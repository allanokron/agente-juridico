import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { id } = await params;

    const recibo = await prisma.recibo.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
      },
      include: {
        servicoTipo: true,
      },
    });

    if (!recibo) {
      return NextResponse.json(
        { error: "Recibo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(recibo);
  } catch (error) {
    console.error("Erro ao buscar recibo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar recibo" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const recibo = await prisma.recibo.findFirst({
      where: { id, empresaId: user.empresaId },
      select: { id: true, ativo: true },
    });

    if (!recibo) {
      return NextResponse.json({ error: "Recibo não encontrado" }, { status: 404 });
    }

    if (body.ativo !== undefined) {
      const updated = await prisma.recibo.update({
        where: { id },
        data: { ativo: body.ativo },
        include: { servicoTipo: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao atualizar recibo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar recibo" },
      { status: 500 }
    );
  }
}
