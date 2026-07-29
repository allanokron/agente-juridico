import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");
    const etapaId = searchParams.get("etapaId");
    const usuarioId = searchParams.get("usuarioId");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { empresaId };

    if (etapaId) {
      where.etapaId = etapaId;
    }

    if (usuarioId) {
      where.processo = {
        atribuicoes: {
          some: { usuarioId },
        },
      };
    }

    const cards = await prisma.kanbanCard.findMany({
      where,
      include: {
        processo: {
          include: {
            cliente: { select: { nome: true } },
            responsavel: { select: { nome: true } },
          },
        },
        etapa: { select: { nome: true, cor: true } },
      },
      orderBy: { ordem: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Erro ao buscar cards:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, etapaId, dataRevisao, hora, observacoes, ordem, usuarioId } = body;

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId é obrigatório" },
        { status: 400 }
      );
    }

    const existingCard = await prisma.kanbanCard.findUnique({
      where: { id: cardId },
      include: {
        etapa: { select: { nome: true } },
        processo: { select: { numeroProcesso: true } },
      },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    const newEtapaId = etapaId || existingCard.etapaId;

    const updatedCard = await prisma.kanbanCard.update({
      where: { id: cardId },
      data: {
        ...(etapaId && { etapaId }),
        ...(dataRevisao !== undefined && {
          dataRevisao: dataRevisao ? new Date(dataRevisao + "T12:00:00") : null,
        }),
        ...(hora !== undefined && { hora: hora || null }),
        ...(observacoes !== undefined && { observacoes }),
        ...(ordem !== undefined && { ordem }),
      },
    });

    if (etapaId && etapaId !== existingCard.etapaId) {
      const newEtapa = await prisma.etapasKanban.findUnique({
        where: { id: etapaId },
        select: { nome: true },
      });

      await prisma.historico.create({
        data: {
          processoId: existingCard.processoId,
          usuarioId: usuarioId || null,
          descricao: `Card movido de "${existingCard.etapa.nome}" para "${newEtapa?.nome || "Etapa desconhecida"}"`,
          tipo: "movimentacao_kanban",
          detalhes: {
            etapaAnterior: existingCard.etapa.nome,
            etapaNova: newEtapa?.nome,
          },
        },
      });
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("Erro ao atualizar card:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar card" },
      { status: 500 }
    );
  }
}
