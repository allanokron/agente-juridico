import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "lexo_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  nome: string;
  role: string;
  empresaId: string;
  avatar: string | null;
  cargo: {
    id: string;
    nome: string;
    permissoes: unknown;
  } | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.sessao.create({
    data: { tokenHash: hashToken(token), usuarioId, expiresAt },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.sessao.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      usuario: {
        include: {
          cargo: { select: { id: true, nome: true, permissoes: true } },
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.usuario.ativo) {
    return null;
  }

  const { usuario } = session;
  return {
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    role: usuario.role,
    empresaId: usuario.empresaId,
    avatar: usuario.avatar,
    cargo: usuario.cargo,
  };
}

export async function canAccessProcess(processoId: string, user: SessionUser) {
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMINISTRADOR";
  return prisma.processo.findFirst({
    where: {
      id: processoId,
      empresaId: user.empresaId,
      ...(isAdmin
        ? {}
        : {
            OR: [
              { responsavelId: user.id },
              { atribuicoes: { some: { usuarioId: user.id } } },
            ],
          }),
    },
    select: { id: true, empresaId: true },
  });
}
