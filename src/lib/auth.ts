import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let usuario = await prisma.usuario.findUnique({
    where: { clerkId: userId },
    include: {
      cargo: { select: { id: true, nome: true, permissoes: true } },
      empresa: { select: { ativo: true } },
    },
  });

  if (!usuario) {
    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== userId) return null;

    const metadataUserId =
      typeof clerkUser.publicMetadata?.appUserId === "string"
        ? clerkUser.publicMetadata.appUserId
        : null;
    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress
      ?.trim()
      .toLowerCase();
    const emailVerified =
      clerkUser.primaryEmailAddress?.verification?.status === "verified";

    const candidate = metadataUserId
      ? await prisma.usuario.findFirst({
          where: { id: metadataUserId, clerkId: null },
          select: { id: true },
        })
      : emailVerified && primaryEmail
        ? await prisma.usuario.findFirst({
            where: {
              email: { equals: primaryEmail, mode: "insensitive" },
              clerkId: null,
            },
            select: { id: true },
          })
        : null;

    if (!candidate) return null;

    await prisma.usuario.updateMany({
      where: { id: candidate.id, clerkId: null },
      data: {
        clerkId: userId,
        ativo: true,
        ultimoAcesso: new Date(),
        avatar: clerkUser.imageUrl || undefined,
      },
    });

    usuario = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      include: {
        cargo: { select: { id: true, nome: true, permissoes: true } },
        empresa: { select: { ativo: true } },
      },
    });
  }

  if (!usuario?.ativo || !usuario.empresa.ativo) return null;

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

export function isAdmin(user: SessionUser) {
  return user.role === "SUPER_ADMIN" || user.role === "ADMINISTRADOR";
}

export function hasPermission(user: SessionUser, permission: string) {
  if (isAdmin(user)) return true;
  const permissions = user.cargo?.permissoes;
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return false;
  }

  const values = permissions as Record<string, unknown>;
  if (values[permission] === true) return true;

  const [section, action] = permission.split("_", 2);
  const nested = values[section];
  return Boolean(
    nested &&
      typeof nested === "object" &&
      !Array.isArray(nested) &&
      (nested as Record<string, unknown>)[action] === true
  );
}

export async function canAccessProcess(processoId: string, user: SessionUser) {
  const admin = isAdmin(user);
  return prisma.processo.findFirst({
    where: {
      id: processoId,
      empresaId: user.empresaId,
      ...(admin
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
