import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuarioId, avatar } = body;

    if (!usuarioId || !avatar) {
      return NextResponse.json(
        { error: "usuarioId e avatar são obrigatórios" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { avatar },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar avatar" },
      { status: 500 }
    );
  }
}
