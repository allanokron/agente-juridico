import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tipo = await prisma.tipoProcessoCustom.findUnique({
      where: { id },
    });

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo não encontrado" },
        { status: 404 }
      );
    }

    await prisma.tipoProcessoCustom.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir tipo de processo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir tipo de processo" },
      { status: 500 }
    );
  }
}
