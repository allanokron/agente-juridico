import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const { id } = await params;

    const tipo = await prisma.tipoProcessoCustom.findFirst({
      where: { id, empresaId: user.empresaId },
    });

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo não encontrado" },
        { status: 404 }
      );
    }

    await prisma.tipoProcessoCustom.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir tipo de processo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir tipo de processo" },
      { status: 500 }
    );
  }
}
