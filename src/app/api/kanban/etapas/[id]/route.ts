import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, cor, ordem } = body;

    const existing = await prisma.etapasKanban.findUnique({
      where: { id },
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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");

    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario || !["SUPER_ADMIN", "ADMINISTRADOR"].includes(usuario.role)) {
        return NextResponse.json(
          { error: "Apenas administradores podem excluir etapas" },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.etapasKanban.findUnique({
      where: { id },
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
