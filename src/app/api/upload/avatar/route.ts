import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const body = await request.json();
    const { avatar } = body;
    const usuarioId = body.usuarioId || sessionUser.id;

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar é obrigatório" },
        { status: 400 }
      );
    }

    if (usuarioId !== sessionUser.id && !isAdmin(sessionUser)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, empresaId: sessionUser.empresaId },
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
