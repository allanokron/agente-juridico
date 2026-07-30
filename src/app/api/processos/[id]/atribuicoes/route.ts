import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProcess, getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!(await canAccessProcess(id, sessionUser))) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const processo = await prisma.processo.findUnique({
      where: { id },
    });

    if (!processo) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const atribuicoes = await prisma.processoAtribuicao.findMany({
      where: { processoId: id },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json(atribuicoes);
  } catch (error) {
    console.error("Erro ao buscar atribuições:", error);
    return NextResponse.json(
      { error: "Erro ao buscar atribuições" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!(await canAccessProcess(id, sessionUser))) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await request.json();
    const { usuarioId } = body;

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId é obrigatório" },
        { status: 400 }
      );
    }

    const processo = await prisma.processo.findUnique({
      where: { id },
    });

    if (!processo) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario || usuario.empresaId !== sessionUser.empresaId) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const existing = await prisma.processoAtribuicao.findUnique({
      where: {
        processoId_usuarioId: {
          processoId: id,
          usuarioId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Usuário já está atribuído a este processo" },
        { status: 409 }
      );
    }

    const atribuicao = await prisma.processoAtribuicao.create({
      data: {
        processoId: id,
        usuarioId,
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    await prisma.historico.create({
      data: {
        processoId: id,
        usuarioId: sessionUser.id,
        descricao: `${usuario.nome} foi atribuído ao processo`,
        tipo: "atribuicao",
      },
    });

    return NextResponse.json(atribuicao, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar atribuição:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar atribuição" },
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
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!(await canAccessProcess(id, sessionUser))) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await request.json();
    const { usuarioId } = body;

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId é obrigatório" },
        { status: 400 }
      );
    }

    const existing = await prisma.processoAtribuicao.findUnique({
      where: {
        processoId_usuarioId: {
          processoId: id,
          usuarioId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Atribuição não encontrada" },
        { status: 404 }
      );
    }

    await prisma.processoAtribuicao.delete({
      where: {
        processoId_usuarioId: {
          processoId: id,
          usuarioId,
        },
      },
    });

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nome: true },
    });

    await prisma.historico.create({
      data: {
        processoId: id,
        usuarioId: sessionUser.id,
        descricao: `${usuario?.nome || "Usuário"} foi removido do processo`,
        tipo: "remocao_atribuicao",
      },
    });

    return NextResponse.json({ message: "Atribuição removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover atribuição:", error);
    return NextResponse.json(
      { error: "Erro ao remover atribuição" },
      { status: 500 }
    );
  }
}
