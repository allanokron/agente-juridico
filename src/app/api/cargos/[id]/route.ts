import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const cargo = await prisma.cargo.findFirst({
      where: { id, empresaId: user.empresaId },
      include: {
        usuarios: {
          select: { id: true, nome: true, email: true, role: true, ativo: true },
        },
      },
    });

    if (!cargo) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cargo);
  } catch (error) {
    console.error("Erro ao buscar cargo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cargo" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const { nome, permissoes } = body;

    const existing = await prisma.cargo.findFirst({ where: { id, empresaId: user.empresaId } });

    if (!existing) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    const cargo = await prisma.cargo.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(permissoes !== undefined && { permissoes }),
      },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    return NextResponse.json(cargo);
  } catch (error) {
    console.error("Erro ao atualizar cargo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cargo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const { id } = await params;

    const existing = await prisma.cargo.findFirst({
      where: { id, empresaId: user.empresaId },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    if (existing._count.usuarios > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir cargo com usuários vinculados" },
        { status: 400 }
      );
    }

    await prisma.cargo.delete({ where: { id } });

    return NextResponse.json({ message: "Cargo excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cargo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cargo" },
      { status: 500 }
    );
  }
}
