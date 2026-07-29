import { NextRequest, NextResponse } from "next/server";
import { canAccessProcess, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventoId: string }> }
) {
  const { id, eventoId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await canAccessProcess(id, user))) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const existing = await prisma.evento.findFirst({
    where: { id: eventoId, processoId: id, empresaId: user.empresaId },
  });
  if (!existing) return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });
  const body = await request.json();

  const updated = await prisma.$transaction(async (tx) => {
    const event = await tx.evento.update({
      where: { id: eventoId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.titulo !== undefined && { titulo: body.titulo.trim() }),
        ...(body.descricao !== undefined && { descricao: body.descricao?.trim() || null }),
        ...(body.data !== undefined && { data: new Date(`${body.data}T12:00:00`) }),
        ...(body.hora !== undefined && { hora: body.hora || null }),
        ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
      },
      include: { responsavel: { select: { id: true, nome: true } } },
    });
    await tx.historico.create({
      data: {
        processoId: id,
        usuarioId: user.id,
        descricao: `Atividade atualizada: ${event.titulo}`,
        tipo: "ATIVIDADE_ATUALIZADA",
        detalhes: { eventoId, antes: existing, depois: body },
      },
    });
    return event;
  });
  return NextResponse.json(updated);
}
