import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const cliente = await prisma.cliente.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
        ...(isAdmin(user)
          ? {}
          : { processos: { some: { atribuicoes: { some: { usuarioId: user.id } } } } }),
      },
      include: {
        _count: {
          select: { processos: true },
        },
        processos: {
          include: {
            _count: {
              select: { documentos: true },
            },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { nome, cpfCnpj, telefone, email, endereco, observacoes } = body;

    const existing = await prisma.cliente.findFirst({ where: { id, empresaId: user.empresaId } });

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cpfCnpj !== undefined && { cpfCnpj }),
        ...(telefone !== undefined && { telefone }),
        ...(email !== undefined && { email }),
        ...(endereco !== undefined && { endereco }),
        ...(observacoes !== undefined && { observacoes }),
      },
      include: {
        _count: {
          select: { processos: true },
        },
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const { id } = await params;

    const existing = await prisma.cliente.findFirst({
      where: { id, empresaId: user.empresaId },
      include: {
        _count: {
          select: { processos: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    if (existing._count.processos > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir cliente com processos vinculados" },
        { status: 400 }
      );
    }

    await prisma.cliente.delete({ where: { id } });

    return NextResponse.json({ message: "Cliente excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cliente" },
      { status: 500 }
    );
  }
}
