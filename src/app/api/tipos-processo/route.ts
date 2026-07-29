import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TIPOS = [
  { valor: "CIVIL", label: "Cível" },
  { valor: "CRIMINAL", label: "Criminal" },
  { valor: "TRABALHISTA", label: "Trabalhista" },
  { valor: "ADMINISTRATIVO", label: "Administrativo" },
  { valor: "TRIBUTARIO", label: "Tributário" },
  { valor: "FAMILIAR", label: "Familiar" },
  { valor: "EMPRESARIAL", label: "Empresarial" },
  { valor: "CONSUMIDOR", label: "Consumidor" },
  { valor: "AMBIENTAL", label: "Ambiental" },
  { valor: "PREVIDENCIARIO", label: "Previdenciário" },
  { valor: "OUTRO", label: "Outro" },
];

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

    let tipos = await prisma.tipoProcessoCustom.findMany({
      where: { empresaId, ativo: true },
      orderBy: { label: "asc" },
    });

    if (tipos.length === 0) {
      await prisma.tipoProcessoCustom.createMany({
        data: DEFAULT_TIPOS.map((t) => ({
          empresaId,
          valor: t.valor,
          label: t.label,
        })),
      });
      tipos = await prisma.tipoProcessoCustom.findMany({
        where: { empresaId, ativo: true },
        orderBy: { label: "asc" },
      });
    }

    return NextResponse.json(tipos);
  } catch (error) {
    console.error("Erro ao buscar tipos de processo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tipos de processo" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, valor, label } = body;

    if (!empresaId || !valor || !label) {
      return NextResponse.json(
        { error: "empresaId, valor e label são obrigatórios" },
        { status: 400 }
      );
    }

    const existing = await prisma.tipoProcessoCustom.findFirst({
      where: { empresaId, valor },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um tipo com este valor" },
        { status: 409 }
      );
    }

    const tipo = await prisma.tipoProcessoCustom.create({
      data: { empresaId, valor, label },
    });

    return NextResponse.json(tipo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tipo de processo:", error);
    return NextResponse.json(
      { error: "Erro ao criar tipo de processo" },
      { status: 500 }
    );
  }
}
