import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProcess, getSessionUser, isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const empresaId = user.empresaId;
    const etapaId = searchParams.get("etapaId");

    const where: Record<string, unknown> = { empresaId };

    if (etapaId) {
      where.etapaId = etapaId;
    }

    if (!isAdmin(user)) {
      where.processo = {
        OR: [
          { responsavelId: user.id },
          { atribuicoes: { some: { usuarioId: user.id } } },
        ],
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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const body = await request.json();
    const { cardId, etapaId, dataRevisao, hora, observacoes, ordem } = body;

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

    if (!existingCard || existingCard.empresaId !== user.empresaId) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }
    if (!(await canAccessProcess(existingCard.processoId, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const newEtapa = etapaId
      ? await prisma.etapasKanban.findFirst({
          where: { id: etapaId, empresaId: user.empresaId, ativo: true },
          select: { nome: true },
        })
      : null;
    if (etapaId && !newEtapa) {
      return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
    }

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
      await prisma.historico.create({
        data: {
          processoId: existingCard.processoId,
          usuarioId: user.id,
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
