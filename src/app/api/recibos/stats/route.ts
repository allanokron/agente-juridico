import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const servicoTipoId = searchParams.get("servicoTipoId");

    const where: Record<string, unknown> = { empresaId: user.empresaId };

    if (dataInicio || dataFim) {
      where.dataPagamento = {};
      if (dataInicio) {
        (where.dataPagamento as Record<string, unknown>).gte = new Date(dataInicio);
      }
      if (dataFim) {
        (where.dataPagamento as Record<string, unknown>).lte = new Date(dataFim);
      }
    }

    if (servicoTipoId) {
      where.servicoTipoId = servicoTipoId;
    }

    const [aggResult, distinctResult, porServico] = await Promise.all([
      prisma.recibo.aggregate({
        where,
        _sum: { valor: true },
        _count: true,
      }),
      prisma.recibo.findMany({
        where,
        select: { pagadorCpfCnpj: true },
        distinct: ["pagadorCpfCnpj"],
      }),
      prisma.recibo.groupBy({
        by: ["servicoTipoId"],
        where,
        _count: true,
        _sum: { valor: true },
      }),
    ]);

    const servicoTipoIds = porServico
      .map((p) => p.servicoTipoId)
      .filter((id): id is string => id !== null);

    const servicoTipos = servicoTipoIds.length > 0
      ? await prisma.servicoTipo.findMany({
          where: { id: { in: servicoTipoIds } },
          select: { id: true, nome: true },
        })
      : [];

    const servicoTipoMap = new Map(servicoTipos.map((s) => [s.id, s.nome]));

    return NextResponse.json({
      totalValor: aggResult._sum.valor ?? 0,
      totalRecibos: aggResult._count,
      clientesAtendidos: distinctResult.length,
      porServico: porServico.map((p) => ({
        servicoTipoId: p.servicoTipoId,
        nome: p.servicoTipoId ? servicoTipoMap.get(p.servicoTipoId) ?? "Sem tipo" : "Sem tipo",
        count: p._count,
        totalValor: p._sum.valor ?? 0,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar stats de recibos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar stats de recibos" },
      { status: 500 }
    );
  }
}
