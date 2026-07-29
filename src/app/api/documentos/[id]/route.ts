import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const documento = await prisma.documento.findUnique({
      where: { id },
      include: {
        processo: {
          select: {
            numeroProcesso: true,
            cliente: { select: { nome: true } },
          },
        },
        usuario: {
          select: { nome: true },
        },
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(documento);
  } catch (error) {
    console.error("Erro ao buscar documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar documento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { usuarioId } = body as { usuarioId?: string };

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId é obrigatório" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { role: true },
    });

    if (!usuario || (usuario.role !== "SUPER_ADMIN" && usuario.role !== "ADMINISTRADOR")) {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir documentos" },
        { status: 403 }
      );
    }

    const documento = await prisma.documento.findUnique({ where: { id } });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    await prisma.documento.delete({ where: { id } });

    return NextResponse.json({ message: "Documento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir documento" },
      { status: 500 }
    );
  }
}
