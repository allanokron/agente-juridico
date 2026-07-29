import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const cargos = await prisma.cargo.findMany({
      where: { empresaId },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(cargos);
  } catch (error) {
    console.error("Erro ao buscar cargos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cargos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, nome, permissoes } = body;

    if (!empresaId || !nome) {
      return NextResponse.json(
        { error: "empresaId e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const cargo = await prisma.cargo.create({
      data: {
        empresaId,
        nome,
        permissoes: permissoes ?? {},
      },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    return NextResponse.json(cargo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json(
      { error: "Erro ao criar cargo" },
      { status: 500 }
    );
  }
}
