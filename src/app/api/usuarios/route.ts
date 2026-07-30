import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  role: true,
  avatar: true,
  ativo: true,
  clerkId: true,
  clerkInvitationId: true,
  conviteEnviadoEm: true,
  cargoId: true,
  cargo: { select: { id: true, nome: true, permissoes: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true" &&
      isAdmin(sessionUser);

    const usuarios = await prisma.usuario.findMany({
      where: {
        empresaId: sessionUser.empresaId,
        ...(includeInactive ? {} : { ativo: true }),
      },
      select: userSelect,
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;

  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!isAdmin(sessionUser)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const telefone = body.telefone ? String(body.telefone).trim() : null;
    const cargoId = body.cargoId ? String(body.cargoId) : null;

    if (!nome || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Nome e e-mail válido são obrigatórios" },
        { status: 400 }
      );
    }

    const [existing, cargo] = await Promise.all([
      prisma.usuario.findUnique({ where: { email }, select: { id: true } }),
      cargoId
        ? prisma.cargo.findFirst({
            where: { id: cargoId, empresaId: sessionUser.empresaId, ativo: true },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um usuário com este e-mail" },
        { status: 409 }
      );
    }
    if (cargoId && !cargo) {
      return NextResponse.json({ error: "Cargo inválido" }, { status: 400 });
    }

    const usuario = await prisma.usuario.create({
      data: {
        empresaId: sessionUser.empresaId,
        nome,
        email,
        telefone,
        cargoId,
        senha: null,
        role: "ASSISTENTE",
        ativo: false,
      },
      select: { id: true },
    });
    createdUserId = usuario.id;

    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      expiresInDays: 30,
      notify: true,
      redirectUrl: `${request.nextUrl.origin}/cadastro`,
      publicMetadata: {
        appUserId: usuario.id,
        empresaId: sessionUser.empresaId,
      },
    });

    const invitedUser = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        clerkInvitationId: invitation.id,
        conviteEnviadoEm: new Date(),
      },
      select: userSelect,
    });

    return NextResponse.json(invitedUser, { status: 201 });
  } catch (error) {
    if (createdUserId) {
      await prisma.usuario
        .deleteMany({
          where: {
            id: createdUserId,
            clerkId: null,
            clerkInvitationId: null,
          },
        })
        .catch(() => undefined);
    }
    console.error("Erro ao convidar usuário:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar o convite" },
      { status: 502 }
    );
  }
}
