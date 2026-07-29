import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");
    const processoId = searchParams.get("processoId");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { empresaId };
    if (processoId) {
      where.processoId = processoId;
    }

    const documentos = await prisma.documento.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar documentos" },
      { status: 500 }
    );
  }
}
