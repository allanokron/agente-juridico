import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProcess, getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const processoId = searchParams.get("processoId");
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    if (!processoId || !(await canAccessProcess(processoId, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const documentos = await prisma.documento.findMany({
      where: { empresaId: user.empresaId, processoId },
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

    return NextResponse.json(
      documentos.map((documento) => ({
        id: documento.id,
        nome: documento.nome,
        mimeType: documento.mimeType || "application/octet-stream",
        tamanho: documento.tamanho || 0,
        createdAt: documento.createdAt,
        usuario: documento.usuario,
        processo: documento.processo,
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar documentos" },
      { status: 500 }
    );
  }
}
