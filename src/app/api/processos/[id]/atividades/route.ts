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
  return NextResponse.json(
    await prisma.evento.findMany({
      where: { processoId: id, empresaId: user.empresaId },
      include: { responsavel: { select: { id: true, nome: true } } },
      orderBy: [{ data: "asc" }, { hora: "asc" }],
    })
  );
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
  if (!body.titulo?.trim() || !body.data) {
    return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });
  }
  const responsible = body.responsavelId || user.id;
  const belongsToCompany = await prisma.usuario.findFirst({
    where: { id: responsible, empresaId: user.empresaId, ativo: true },
    select: { id: true },
  });
  if (!belongsToCompany) {
    return NextResponse.json({ error: "Responsável inválido" }, { status: 400 });
  }

  const activity = await prisma.$transaction(async (tx) => {
    const created = await tx.evento.create({
      data: {
        empresaId: user.empresaId,
        processoId: id,
        responsavelId: responsible,
        titulo: body.titulo.trim(),
        descricao: body.descricao?.trim() || null,
        data: new Date(`${body.data}T12:00:00`),
        hora: body.hora || null,
        tipo: body.tipo || "PRAZO",
        prioridade: body.prioridade || "MEDIA",
        status: "PENDENTE",
      },
      include: { responsavel: { select: { id: true, nome: true } } },
    });
    await tx.historico.create({
      data: {
        processoId: id,
        usuarioId: user.id,
        descricao: `Atividade criada: ${created.titulo}`,
        tipo: "ATIVIDADE_CRIADA",
        detalhes: { eventoId: created.id, data: body.data, hora: body.hora || null },
      },
    });
    return created;
  });
  return NextResponse.json(activity, { status: 201 });
}
