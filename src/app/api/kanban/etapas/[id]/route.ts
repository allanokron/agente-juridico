import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

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
    const { nome, cor, ordem } = body;

    const existing = await prisma.etapasKanban.findFirst({
      where: { id, empresaId: user.empresaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Etapa não encontrada" },
        { status: 404 }
      );
    }

    const etapa = await prisma.etapasKanban.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cor !== undefined && { cor }),
        ...(ordem !== undefined && { ordem }),
      },
    });

    return NextResponse.json(etapa);
  } catch (error) {
    console.error("Erro ao atualizar etapa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar etapa" },
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

    const existing = await prisma.etapasKanban.findFirst({
      where: { id, empresaId: user.empresaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Etapa não encontrada" },
        { status: 404 }
      );
    }

    await prisma.etapasKanban.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: "Etapa removida com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir etapa:", error);
    return NextResponse.json(
      { error: "Erro ao excluir etapa" },
      { status: 500 }
    );
  }
}
