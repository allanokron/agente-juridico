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
        tipo: "EXCLUSIVO",
      },
      include: {
        servicoTipo: true,
      },
    });

    if (!recibo) {
      return NextResponse.json({ error: "Recibo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(recibo);
  } catch (error) {
    console.error("Erro ao buscar recibo exclusivo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar recibo exclusivo" },
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
      where: {
        id,
        empresaId: user.empresaId,
        tipo: "EXCLUSIVO",
      },
    });

    if (!recibo) {
      return NextResponse.json({ error: "Recibo não encontrado" }, { status: 404 });
    }

    const updated = await prisma.recibo.update({
      where: { id },
      data: { ativo: body.ativo },
      include: { servicoTipo: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar recibo exclusivo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar recibo exclusivo" },
      { status: 500 }
    );
  }
}
