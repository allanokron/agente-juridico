import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const servicosTipo = await prisma.servicoTipo.findMany({
      where: { empresaId: user.empresaId, ativo: true },
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
    const { nome } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const existing = await prisma.servicoTipo.findFirst({
      where: { empresaId: user.empresaId, nome, ativo: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um serviço tipo com este nome" },
        { status: 409 }
      );
    }

    const servicoTipo = await prisma.servicoTipo.create({
      data: {
        empresaId: user.empresaId,
        nome,
      },
    });

    return NextResponse.json(servicoTipo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço tipo:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço tipo" },
      { status: 500 }
    );
  }
}
