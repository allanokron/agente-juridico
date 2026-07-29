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
      include: {
        processo: {
          include: {
            cliente: true,
            responsavel: true,
            atribuicoes: {
              where: {
                usuario: { ativo: true },
              },
              include: {
                usuario: { select: { id: true, nome: true, email: true } },
              },
            },
          },
        },
        etapa: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    const equipe = card.processo.atribuicoes.map((a) => ({
      id: a.usuario.id,
      nome: a.usuario.nome,
    }));

    return NextResponse.json({ ...card, equipe });
  } catch (error) {
    console.error("Erro ao buscar card:", error);
    return NextResponse.json(
      { error: "Erro ao buscar card" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { observacoes, dataRevisao, hora, usuarioId } = body;

    const existing = await prisma.kanbanCard.findUnique({
      where: { id },
      include: {
        processo: { select: { numeroProcesso: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    const updatedCard = await prisma.kanbanCard.update({
      where: { id },
      data: {
        ...(observacoes !== undefined && { observacoes }),
        ...(dataRevisao !== undefined && {
          dataRevisao: dataRevisao ? new Date(dataRevisao + "T12:00:00") : null,
        }),
        ...(hora !== undefined && { hora: hora || null }),
      },
    });

    const changes: string[] = [];
    if (observacoes !== undefined) changes.push("observações");
    if (dataRevisao !== undefined) changes.push("data de revisão");
    if (hora !== undefined) changes.push("horário");

    if (changes.length > 0) {
      await prisma.historico.create({
        data: {
          processoId: existing.processoId,
          usuarioId: usuarioId || null,
          descricao: `Card atualizado: ${changes.join(" e ")}`,
          tipo: "atualizacao_card",
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
