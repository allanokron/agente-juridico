import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    const where: Record<string, unknown> = { empresaId: user.empresaId, ativo: true };

    if (tipo === "REGULAR" || tipo === "EXCLUSIVO") {
      where.tipo = tipo;
    }

    const servicosTipo = await prisma.servicoTipo.findMany({
      where,
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(servicosTipo);
  } catch (error) {
    console.error("Erro ao buscar serviços tipo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços tipo" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const { nome, tipo } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const servicoTipo = tipo === "EXCLUSIVO" ? "EXCLUSIVO" : "REGULAR";

    const existing = await prisma.servicoTipo.findFirst({
      where: { empresaId: user.empresaId, nome, tipo: servicoTipo, ativo: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um serviço tipo com este nome" },
        { status: 409 }
      );
    }

    const newServicoTipo = await prisma.servicoTipo.create({
      data: {
        empresaId: user.empresaId,
        nome,
        tipo: servicoTipo,
      },
    });

    return NextResponse.json(newServicoTipo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço tipo:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço tipo" },
      { status: 500 }
    );
  }
}
