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
      select: {
        conteudo: true,
        mimeType: true,
        nome: true,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conteudo: documento.conteudo,
      mimeType: documento.mimeType,
      nome: documento.nome,
    });
  } catch (error) {
    console.error("Erro ao buscar preview do documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar preview do documento" },
      { status: 500 }
    );
  }
}
