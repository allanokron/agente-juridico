import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const card = await prisma.kanbanCard.findUnique({
      where: { id },
      select: { processoId: true },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    const historico = await prisma.historico.findMany({
      where: { processoId: card.processoId },
      include: {
        usuario: { select: { id: true, nome: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}
