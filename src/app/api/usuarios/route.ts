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

    const usuarios = await prisma.usuario.findMany({
      where: {
        empresaId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        avatar: true,
        cargoId: true,
        cargo: { select: { id: true, nome: true, permissoes: true } },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}
