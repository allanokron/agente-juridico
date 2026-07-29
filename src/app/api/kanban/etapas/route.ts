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

    const etapas = await prisma.etapasKanban.findMany({
      where: { empresaId, ativo: true },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { ordem: "asc" },
    });

    return NextResponse.json(etapas);
  } catch (error) {
    console.error("Erro ao buscar etapas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar etapas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, nome, cor, ordem, usuarioId } = body;

    if (!empresaId || !nome || ordem === undefined) {
      return NextResponse.json(
        { error: "empresaId, nome e ordem são obrigatórios" },
        { status: 400 }
      );
    }

    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario || !["SUPER_ADMIN", "ADMINISTRADOR"].includes(usuario.role)) {
        return NextResponse.json(
          { error: "Apenas administradores podem criar etapas" },
          { status: 403 }
        );
      }
    }

    const etapa = await prisma.etapasKanban.create({
      data: {
        empresaId,
        nome,
        cor,
        ordem,
      },
    });

    return NextResponse.json(etapa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar etapa:", error);
    return NextResponse.json(
      { error: "Erro ao criar etapa" },
      { status: 500 }
    );
  }
}
