import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.servicoTipo.findFirst({
      where: { id, empresaId: user.empresaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Serviço tipo não encontrado" },
        { status: 404 }
      );
    }

    await prisma.servicoTipo.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: "Serviço tipo excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir serviço tipo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir serviço tipo" },
      { status: 500 }
    );
  }
}
