import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const numero = request.nextUrl.searchParams.get("numero");
    const where = {
      empresaId: user.empresaId,
      ...(!isAdmin(user)
        ? {
            OR: [
              { responsavelId: user.id },
              { atribuicoes: { some: { usuarioId: user.id } } },
            ],
          }
        : {}),
      ...(numero
        ? { numeroProcesso: { contains: numero.replace(/\D/g, "") } }
        : {}),
    };

    const processos = await prisma.processo.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        kanbanCard: {
          include: { etapa: { select: { id: true, nome: true, cor: true } } },
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
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const {
      clienteId,
      responsavelId,
      numeroProcesso,
      tribunal,
      vara,
      tipoProcesso,
      observacoes,
      dataRevisao,
      hora,
      isPreProcesso = false,
    } = body;
    const atribuicoes: string[] = Array.isArray(body.atribuicoes)
      ? [...new Set<string>(body.atribuicoes.map((value: unknown) => String(value)))]
      : [];

    if (!atribuicoes.includes(user.id) && user.id !== responsavelId) {
      atribuicoes.push(user.id);
    }

    if (!clienteId || !responsavelId || !tipoProcesso) {
      return NextResponse.json(
        { error: "Cliente, responsável e tipo do processo são obrigatórios" },
        { status: 400 }
      );
    }
    if (!isPreProcesso && !numeroProcesso?.trim()) {
      return NextResponse.json(
        { error: "O número é obrigatório para um processo definitivo" },
        { status: 400 }
      );
    }

    const [cliente, responsavel, primeiraEtapa, validAssignments] =
      await Promise.all([
        prisma.cliente.findFirst({
          where: { id: clienteId, empresaId: user.empresaId, ativo: true },
          select: { id: true },
        }),
        prisma.usuario.findFirst({
          where: { id: responsavelId, empresaId: user.empresaId, ativo: true },
          select: { id: true },
        }),
        prisma.etapasKanban.findFirst({
          where: { empresaId: user.empresaId, ativo: true },
          orderBy: { ordem: "asc" },
          select: { id: true },
        }),
        prisma.usuario.findMany({
          where: {
            id: { in: atribuicoes },
            empresaId: user.empresaId,
            ativo: true,
          },
          select: { id: true },
        }),
      ]);

    if (!cliente || !responsavel) {
      return NextResponse.json(
        { error: "Cliente ou responsável inválido" },
        { status: 400 }
      );
    }
    if (validAssignments.length !== atribuicoes.length) {
      return NextResponse.json(
        { error: "Uma ou mais atribuições são inválidas" },
        { status: 400 }
      );
    }

    const processoId = await prisma.$transaction(async (tx) => {
      const processo = await tx.processo.create({
        data: {
          empresaId: user.empresaId,
          clienteId,
          responsavelId,
          numeroProcesso: numeroProcesso?.trim() || null,
          isPreProcesso: Boolean(isPreProcesso),
          tribunal,
          vara,
          tipoProcesso,
          observacoes,
        },
      });
      if (primeiraEtapa) {
        await tx.kanbanCard.create({
          data: {
            empresaId: user.empresaId,
            processoId: processo.id,
            etapaId: primeiraEtapa.id,
            dataRevisao: dataRevisao
              ? new Date(`${dataRevisao}T12:00:00`)
              : null,
            hora: hora || null,
          },
        });
      } else {
        await tx.kanbanCard.create({
          data: {
            empresaId: user.empresaId,
            processoId: processo.id,
            etapaId: null,
            dataRevisao: dataRevisao
              ? new Date(`${dataRevisao}T12:00:00`)
              : null,
            hora: hora || null,
          },
        });
      }
      if (validAssignments.length) {
        await tx.processoAtribuicao.createMany({
          data: validAssignments.map(({ id }) => ({
            processoId: processo.id,
            usuarioId: id,
          })),
        });
      }
      await tx.historico.create({
        data: {
          processoId: processo.id,
          usuarioId: user.id,
          descricao: isPreProcesso ? "Pré-processo criado" : "Processo criado",
          tipo: "criacao",
        },
      });
      return processo.id;
    });

    const processo = await prisma.processo.findUnique({
      where: { id: processoId },
      include: {
        cliente: true,
        responsavel: true,
        kanbanCard: { include: { etapa: true } },
        atribuicoes: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
        },
      },
    });
    return NextResponse.json(processo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    return NextResponse.json(
      { error: "Erro ao criar processo" },
      { status: 500 }
    );
  }
}
