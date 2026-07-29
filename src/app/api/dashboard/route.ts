import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");
    const usuarioId = searchParams.get("usuarioId");
    const isAdmin = searchParams.get("isAdmin") === "true";

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId é obrigatório" },
        { status: 400 }
      );
    }

    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfTomorrow = new Date(endOfToday);
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    const endOfNext30Days = new Date(startOfToday);
    endOfNext30Days.setDate(endOfNext30Days.getDate() + 30);

    const processosAtivos = await prisma.processo.count({
      where: {
        empresaId,
        ...(isAdmin
          ? {}
          : {
              atribuicoes: {
                some: { usuarioId },
              },
            }),
      },
    });

    const kanbanInclude = {
      processo: {
        select: {
          numeroProcesso: true,
          cliente: { select: { nome: true } },
        },
      },
      etapa: { select: { nome: true, cor: true } },
    };

    const [atividadesHoje, atividadesAmanha, atrasados, agenda] =
      await Promise.all([
        prisma.kanbanCard.findMany({
          where: {
            empresaId,
            dataRevisao: { gte: startOfToday, lt: endOfToday },
          },
          include: kanbanInclude,
          orderBy: { dataRevisao: "asc" },
        }),
        prisma.kanbanCard.findMany({
          where: {
            empresaId,
            dataRevisao: { gte: startOfTomorrow, lt: endOfTomorrow },
          },
          include: kanbanInclude,
          orderBy: { dataRevisao: "asc" },
        }),
        prisma.kanbanCard.findMany({
          where: {
            empresaId,
            dataRevisao: { lt: startOfToday, not: null },
          },
          include: kanbanInclude,
          orderBy: { dataRevisao: "asc" },
        }),
        prisma.kanbanCard.findMany({
          where: {
            empresaId,
            dataRevisao: { gte: startOfToday, lt: endOfNext30Days },
          },
          include: kanbanInclude,
          orderBy: { dataRevisao: "asc" },
        }),
      ]);

    return NextResponse.json({
      processosAtivos,
      atividadesHoje,
      atividadesAmanha,
      atrasados,
      agenda,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
