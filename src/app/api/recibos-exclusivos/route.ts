import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const servicoTipoId = searchParams.get("servicoTipoId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      empresaId: user.empresaId,
      tipo: "EXCLUSIVO",
    };

    if (status === "inativo") {
      where.ativo = false;
    } else if (status !== "todos") {
      where.ativo = true;
    }

    if (busca) {
      where.OR = [
        { pagadorNome: { contains: busca, mode: "insensitive" } },
        { pagadorCpfCnpj: { contains: busca } },
      ];
    }

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

    const recibos = await prisma.recibo.findMany({
      where,
      include: {
        servicoTipo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recibos);
  } catch (error) {
    console.error("Erro ao buscar recibos exclusivos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar recibos exclusivos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const {
      valor,
      dataPagamento,
      pagadorNome,
      pagadorCpfCnpj,
      pagadorTipoDoc,
      servicoPrestado,
      servicoTipoId,
      observacao,
      cidadePrestacao,
      prestadorNome,
      prestadorCpfCnpj,
      prestadorTipoDoc,
      prestadorCep,
      prestadorEndereco,
      prestadorNumero,
      prestadorComplemento,
      prestadorBairro,
      prestadorCidade,
      prestadorUf,
      formaPagamento,
      pagamentoDetalhes,
    } = body;

    if (!valor || !dataPagamento || !pagadorNome || !pagadorCpfCnpj || !pagadorTipoDoc || !cidadePrestacao || !prestadorNome || !prestadorCpfCnpj || !prestadorTipoDoc || !prestadorCep || !formaPagamento) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const numeracao = await prisma.reciboExclusivoNumeracao.findUnique({
      where: { empresaId: user.empresaId },
    });

    const numero = numeracao?.proximoNumero ?? 1;

    const [recibo] = await prisma.$transaction([
      prisma.recibo.create({
        data: {
          empresaId: user.empresaId,
          criadoPorId: user.id,
          numero,
          tipo: "EXCLUSIVO",
          valor,
          dataPagamento: new Date(dataPagamento),
          pagadorNome,
          pagadorCpfCnpj,
          pagadorTipoDoc,
          servicoPrestado: servicoPrestado || null,
          servicoTipoId: servicoTipoId || null,
          observacao: observacao || null,
          cidadePrestacao,
          prestadorNome,
          prestadorCpfCnpj,
          prestadorTipoDoc,
          prestadorCep,
          prestadorEndereco: prestadorEndereco || null,
          prestadorNumero: prestadorNumero || null,
          prestadorComplemento: prestadorComplemento || null,
          prestadorBairro: prestadorBairro || null,
          prestadorCidade: prestadorCidade || null,
          prestadorUf: prestadorUf || null,
          formaPagamento,
          pagamentoDetalhes: pagamentoDetalhes || undefined,
        },
        include: {
          servicoTipo: true,
        },
      }),
      prisma.reciboExclusivoNumeracao.upsert({
        where: { empresaId: user.empresaId },
        update: { proximoNumero: numero + 1 },
        create: {
          empresaId: user.empresaId,
          proximoNumero: numero + 1,
        },
      }),
    ]);

    return NextResponse.json(recibo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar recibo exclusivo:", error);
    return NextResponse.json(
      { error: "Erro ao criar recibo exclusivo" },
      { status: 500 }
    );
  }
}
