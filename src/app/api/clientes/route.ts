import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const empresaId = user.empresaId;
    const cpfCnpj = searchParams.get("cpfCnpj");

    const where: Record<string, unknown> = { empresaId };

    if (!isAdmin(user)) {
      where.processos = {
        some: {
          atribuicoes: {
            some: { usuarioId: user.id },
          },
        },
      };
    }

    if (cpfCnpj) {
      const digits = cpfCnpj.replace(/\D/g, "");
      where.cpfCnpj = { contains: digits };
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        _count: {
          select: { processos: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const body = await request.json();
    const { nome, cpfCnpj, telefone, email, endereco, observacoes } =
      body;
    const empresaId = user.empresaId;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (cpfCnpj) {
      const existing = await prisma.cliente.findFirst({
        where: {
          empresaId,
          cpfCnpj,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Já existe um cliente com este CPF/CNPJ nesta empresa" },
          { status: 409 }
        );
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        empresaId,
        nome,
        cpfCnpj,
        telefone,
        email,
        endereco,
        observacoes,
      },
      include: {
        _count: {
          select: { processos: true },
        },
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
