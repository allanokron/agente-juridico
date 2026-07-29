import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const processo = await prisma.processo.findUnique({
      where: { id },
      include: {
        cliente: true,
        responsavel: true,
        kanbanCard: {
          include: { etapa: true },
        },
        documentos: true,
        eventos: true,
        historicos: {
          include: {
            usuario: { select: { id: true, nome: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        atribuicoes: {
          include: {
            usuario: { select: { id: true, nome: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!processo) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(processo);
  } catch (error) {
    console.error("Erro ao buscar processo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar processo" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.processo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const {
      clienteId,
      responsavelId,
      numeroProcesso,
      tribunal,
      vara,
      tipoProcesso,
      status,
      observacoes,
    } = body;

    const processo = await prisma.processo.update({
      where: { id },
      data: {
        ...(clienteId !== undefined && { clienteId }),
        ...(responsavelId !== undefined && { responsavelId }),
        ...(numeroProcesso !== undefined && { numeroProcesso }),
        ...(tribunal !== undefined && { tribunal }),
        ...(vara !== undefined && { vara }),
        ...(tipoProcesso !== undefined && { tipoProcesso }),
        ...(status !== undefined && { status }),
        ...(observacoes !== undefined && { observacoes }),
      },
      include: {
        cliente: true,
        responsavel: true,
        kanbanCard: {
          include: { etapa: true },
        },
      },
    });

    return NextResponse.json(processo);
  } catch (error) {
    console.error("Erro ao atualizar processo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar processo" },
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
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");

    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario || !["SUPER_ADMIN", "ADMINISTRADOR"].includes(usuario.role)) {
        return NextResponse.json(
          { error: "Apenas administradores podem excluir processos" },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.processo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    await prisma.historico.deleteMany({ where: { processoId: id } });
    await prisma.processoAtribuicao.deleteMany({ where: { processoId: id } });
    await prisma.kanbanCard.deleteMany({ where: { processoId: id } });
    await prisma.documento.deleteMany({ where: { processoId: id } });
    await prisma.evento.deleteMany({ where: { processoId: id } });
    await prisma.anotacao.deleteMany({ where: { processoId: id } });
    await prisma.processo.delete({ where: { id } });

    return NextResponse.json({ message: "Processo excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir processo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir processo" },
      { status: 500 }
    );
  }
}
