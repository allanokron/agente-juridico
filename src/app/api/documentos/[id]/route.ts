import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { canAccessProcess, getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

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
    if (!documento.processoId || !(await canAccessProcess(documento.processoId, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMINISTRADOR") {
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
    if (!documento.processoId || !(await canAccessProcess(documento.processoId, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.historico.create({
        data: {
          processoId: documento.processoId,
          usuarioId: user.id,
          descricao: `Documento "${documento.nome}" removido do processo`,
          tipo: "DOCUMENTO_REMOVIDO",
          detalhes: { documentoId: documento.id, nome: documento.nome },
        },
      }),
      prisma.documento.delete({ where: { id } }),
    ]);
    if (documento.blobPath) await del(documento.blobPath);

    return NextResponse.json({ message: "Documento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir documento" },
      { status: 500 }
    );
  }
}
