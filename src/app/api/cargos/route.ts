import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const empresaId = user.empresaId;

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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await request.json();
    const { nome, permissoes } = body;
    const empresaId = user.empresaId;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
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
