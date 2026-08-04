import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const empresaId = user.empresaId;
    const processAccess = isAdmin(user)
      ? {}
      : {
          processo: {
            OR: [
              { responsavelId: user.id },
              { atribuicoes: { some: { usuarioId: user.id } } },
            ],
          },
        };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const endOfNext30Days = new Date(startOfToday);
    endOfNext30Days.setDate(endOfNext30Days.getDate() + 30);

    const kanbanInclude = {
      processo: {
        select: {
          numeroProcesso: true,
          isPreProcesso: true,
          cliente: { select: { nome: true } },
        },
      },
      etapa: { select: { nome: true, cor: true } },
    };

    const [processosAtivos, allCards, eventosProcesso] = await Promise.all([
      prisma.processo.count({
        where: {
          empresaId,
          ...(!isAdmin(user)
            ? {
                OR: [
                  { responsavelId: user.id },
                  { atribuicoes: { some: { usuarioId: user.id } } },
                ],
              }
            : {}),
        },
      }),
      prisma.kanbanCard.findMany({
        where: {
          empresaId,
          dataRevisao: { not: null },
          ...processAccess,
        },
        include: kanbanInclude,
        orderBy: { dataRevisao: "asc" },
        take: 200,
      }),
      prisma.evento.findMany({
        where: {
          empresaId,
          processoId: { not: null },
          data: { gte: startOfToday, lte: endOfNext30Days },
          ...(!isAdmin(user)
            ? {
                OR: [
                  { responsavelId: user.id },
                  { processo: { atribuicoes: { some: { usuarioId: user.id } } } },
                ],
              }
            : {}),
        },
        include: {
          processo: {
            select: {
              id: true,
              numeroProcesso: true,
              isPreProcesso: true,
              cliente: { select: { nome: true } },
            },
          },
        },
        orderBy: { data: "asc" },
        take: 200,
      }),
    ]);

    const atividadesHoje = [];
    const atividadesAmanha = [];
    const atrasados = [];
    const agenda = [];

    const startOfTomorrow = new Date(endOfToday);
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    for (const card of allCards) {
      const data = new Date(card.dataRevisao!);
      if (data >= startOfToday && data < endOfToday) {
        atividadesHoje.push(card);
      } else if (data >= startOfTomorrow && data < endOfTomorrow) {
        atividadesAmanha.push(card);
      } else if (data < startOfToday) {
        atrasados.push(card);
      }
      agenda.push(card);
    }

    return NextResponse.json({
      processosAtivos,
      atividadesHoje,
      atividadesAmanha,
      atrasados,
      agenda,
      eventos: eventosProcesso,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
