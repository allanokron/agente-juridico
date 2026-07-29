import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");
    const usuarioId = searchParams.get("usuarioId");
    const numero = searchParams.get("numero");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { empresaId };

    if (usuarioId) {
      where.atribuicoes = {
        some: { usuarioId },
      };
    }

    if (numero) {
      const digits = numero.replace(/\D/g, "");
      where.numeroProcesso = { contains: digits };
    }

    const processos = await prisma.processo.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        kanbanCard: {
          include: {
            etapa: { select: { id: true, nome: true, cor: true } },
          },
        },
        atribuicoes: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(processos);
  } catch (error) {
    console.error("Erro ao buscar processos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar processos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      empresaId,
      clienteId,
      responsavelId,
      numeroProcesso,
      tribunal,
      vara,
      tipoProcesso,
      observacoes,
      atribuicoes,
      dataRevisao,
      hora,
    } = body;

    if (!empresaId || !clienteId || !responsavelId || !tipoProcesso) {
      return NextResponse.json(
        { error: "empresaId, clienteId, responsavelId e tipoProcesso são obrigatórios" },
        { status: 400 }
      );
    }

    const processo = await prisma.processo.create({
      data: {
        empresaId,
        clienteId,
        responsavelId,
        numeroProcesso,
        tribunal,
        vara,
        tipoProcesso,
        observacoes,
      },
    });

    const primeiraEtapa = await prisma.etapasKanban.findFirst({
      where: {
        empresaId,
        ativo: true,
      },
      orderBy: { ordem: "asc" },
    });

    if (primeiraEtapa) {
      await prisma.kanbanCard.create({
        data: {
          empresaId,
          processoId: processo.id,
          etapaId: primeiraEtapa.id,
          dataRevisao: dataRevisao ? new Date(dataRevisao + "T12:00:00") : null,
          hora: hora || null,
          ordem: 0,
        },
      });
    }

    if (atribuicoes && Array.isArray(atribuicoes) && atribuicoes.length > 0) {
      await prisma.processoAtribuicao.createMany({
        data: atribuicoes.map((usuarioId: string) => ({
          processoId: processo.id,
          usuarioId,
        })),
      });
    }

    await prisma.historico.create({
      data: {
        processoId: processo.id,
        descricao: "Processo criado",
        tipo: "criacao",
      },
    });

    const processoCompleto = await prisma.processo.findUnique({
      where: { id: processo.id },
      include: {
        cliente: true,
        responsavel: true,
        kanbanCard: {
          include: { etapa: true },
        },
        atribuicoes: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(processoCompleto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    return NextResponse.json(
      { error: "Erro ao criar processo" },
      { status: 500 }
    );
  }
}
