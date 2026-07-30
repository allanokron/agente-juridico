import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProcess, getSessionUser, isAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!(await canAccessProcess(id, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!(await canAccessProcess(id, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
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

    const changes: Record<string, { antes: unknown; depois: unknown }> = {};
    const candidates = {
      clienteId,
      responsavelId,
      numeroProcesso,
      tribunal,
      vara,
      tipoProcesso,
      status,
      observacoes,
    };
    for (const [field, value] of Object.entries(candidates)) {
      if (value !== undefined && existing[field as keyof typeof existing] !== value) {
        changes[field] = {
          antes: existing[field as keyof typeof existing],
          depois: value,
        };
      }
    }

    const processo = await prisma.$transaction(async (tx) => {
      const updated = await tx.processo.update({
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
          kanbanCard: { include: { etapa: true } },
        },
      });
      if (Object.keys(changes).length > 0) {
        await tx.historico.create({
          data: {
            processoId: id,
            usuarioId: user.id,
            descricao: `Processo atualizado: ${Object.keys(changes).join(", ")}`,
            tipo: "PROCESSO_ATUALIZADO",
            detalhes: JSON.parse(JSON.stringify(changes)),
          },
        });
      }
      return updated;
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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const existing = await prisma.processo.findFirst({
      where: { id, empresaId: user.empresaId },
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
