import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { ETAPAS_JURIDICAS_PADRAO } from "@/lib/kanban-defaults";

const ETAPAS_LEGADAS = ["Triagem", "Análise", "Audiência", "Protocolo", "Finalizado"];

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const empresaId = user.empresaId;

    let etapas = await prisma.etapasKanban.findMany({
      where: { empresaId, ativo: true },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { ordem: "asc" },
    });

    const usaPadraoLegado =
      etapas.length === ETAPAS_LEGADAS.length &&
      etapas.every((etapa, index) => etapa.nome === ETAPAS_LEGADAS[index]);

    if (usaPadraoLegado) {
      await prisma.$transaction(
        etapas.map((etapa, index) =>
          prisma.etapasKanban.update({
            where: { id: etapa.id },
            data: {
              ...ETAPAS_JURIDICAS_PADRAO[index],
              fixa: false,
            },
          })
        )
      );
      etapas = await prisma.etapasKanban.findMany({
        where: { empresaId, ativo: true },
        include: { _count: { select: { cards: true } } },
        orderBy: { ordem: "asc" },
      });
    }

    return NextResponse.json(etapas);
  } catch (error) {
    console.error("Erro ao buscar etapas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar etapas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await request.json();
    const { nome, cor, ordem } = body;
    const empresaId = user.empresaId;

    if (!nome || ordem === undefined) {
      return NextResponse.json(
        { error: "Nome e ordem são obrigatórios" },
        { status: 400 }
      );
    }

    const etapa = await prisma.etapasKanban.create({
      data: {
        empresaId,
        nome,
        cor,
        ordem,
      },
    });

    return NextResponse.json(etapa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar etapa:", error);
    return NextResponse.json(
      { error: "Erro ao criar etapa" },
      { status: 500 }
    );
  }
}
