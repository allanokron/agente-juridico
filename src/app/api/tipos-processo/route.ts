import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

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

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const empresaId = user.empresaId;

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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await request.json();
    const { valor, label } = body;
    const empresaId = user.empresaId;

    if (!valor || !label) {
      return NextResponse.json(
        { error: "Valor e nome são obrigatórios" },
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
