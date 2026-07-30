import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const selectUser = {
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
  cargo: { select: { id: true, nome: true } },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const usuario = await prisma.usuario.findFirst({
    where: { id, empresaId: sessionUser.empresaId },
    select: selectUser,
  });
  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  return NextResponse.json(usuario);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!isAdmin(sessionUser)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.usuario.findFirst({
      where: { id, empresaId: sessionUser.empresaId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    if (id === sessionUser.id && body.ativo === false) {
      return NextResponse.json(
        { error: "Você não pode desativar sua própria conta" },
        { status: 400 }
      );
    }
    if (
      existing.clerkId &&
      body.email !== undefined &&
      String(body.email).trim().toLowerCase() !== existing.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "O e-mail de uma conta ativa deve ser alterado pelo perfil seguro" },
        { status: 400 }
      );
    }
    const allowedRoles = [
      "ADMINISTRADOR",
      "ADVOGADO",
      "ASSISTENTE",
      "ESTAGIARIO",
    ];
    if (
      body.role !== undefined &&
      !(
        allowedRoles.includes(String(body.role)) ||
        (body.role === "SUPER_ADMIN" && sessionUser.role === "SUPER_ADMIN")
      )
    ) {
      return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
    }

    const cargoId = body.cargoId ? String(body.cargoId) : null;
    if (cargoId) {
      const cargo = await prisma.cargo.findFirst({
        where: { id: cargoId, empresaId: sessionUser.empresaId, ativo: true },
        select: { id: true },
      });
      if (!cargo) {
        return NextResponse.json({ error: "Cargo inválido" }, { status: 400 });
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(body.nome !== undefined && { nome: String(body.nome).trim() }),
        ...(body.email !== undefined &&
          !existing.clerkId && {
            email: String(body.email).trim().toLowerCase(),
          }),
        ...(body.telefone !== undefined && {
          telefone: body.telefone ? String(body.telefone).trim() : null,
        }),
        ...(body.cargoId !== undefined && { cargoId }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.ativo !== undefined && { ativo: Boolean(body.ativo) }),
      },
      select: selectUser,
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isAdmin(sessionUser)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  if (id === sessionUser.id) {
    return NextResponse.json(
      { error: "Você não pode remover sua própria conta" },
      { status: 400 }
    );
  }

  const result = await prisma.usuario.updateMany({
    where: { id, empresaId: sessionUser.empresaId },
    data: { ativo: false },
  });
  if (!result.count) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ message: "Usuário bloqueado com sucesso" });
}
