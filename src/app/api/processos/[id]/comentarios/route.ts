import { NextRequest, NextResponse } from "next/server";
import { canAccessProcess, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await canAccessProcess(id, user))) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const comments = await prisma.comentario.findMany({
    where: { processoId: id },
    include: {
      autor: { select: { id: true, nome: true, avatar: true } },
      mencoes: {
        include: { usuario: { select: { id: true, nome: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await canAccessProcess(id, user))) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const conteudo = typeof body.conteudo === "string" ? body.conteudo.trim() : "";
  const mentionIds: string[] = Array.isArray(body.mencoes)
    ? ([...new Set(body.mencoes.filter((value: unknown) => typeof value === "string"))] as string[])
    : [];
  if (!conteudo) {
    return NextResponse.json({ error: "Comentário é obrigatório" }, { status: 400 });
  }

  const validMentioned = await prisma.usuario.findMany({
    where: { id: { in: mentionIds }, empresaId: user.empresaId, ativo: true },
    select: { id: true },
  });
  const validIds = validMentioned.map((mentioned) => mentioned.id).filter((id) => id !== user.id);

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comentario.create({
      data: {
        processoId: id,
        autorId: user.id,
        conteudo,
        mencoes: {
          create: validIds.map((usuarioId) => ({ usuarioId })),
        },
      },
      include: {
        autor: { select: { id: true, nome: true, avatar: true } },
        mencoes: { include: { usuario: { select: { id: true, nome: true } } } },
      },
    });

    await tx.historico.create({
      data: {
        processoId: id,
        usuarioId: user.id,
        descricao: "Comentário adicionado",
        tipo: "COMENTARIO_ADICIONADO",
        detalhes: { comentarioId: created.id, mencoes: validIds },
      },
    });

    if (validIds.length > 0) {
      await tx.notificacao.createMany({
        data: validIds.map((usuarioId) => ({
          empresaId: user.empresaId,
          usuarioId,
          titulo: `${user.nome} mencionou você`,
          mensagem: conteudo.slice(0, 180),
          tipo: "MENCAO_PROCESSO",
          link: `/processos/${id}`,
          metadata: { processoId: id, comentarioId: created.id },
        })),
      });
    }
    return created;
  });

  return NextResponse.json(comment, { status: 201 });
}
