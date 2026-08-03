import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  telefone: z.string().trim().max(30).nullable().optional(),
  role: z
    .enum(["ADMINISTRADOR", "ADVOGADO", "ASSISTENTE", "ESTAGIARIO"])
    .optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { id } = await params;
  const current = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      clerkId: true,
      empresaId: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (current.email === admin.email && parsed.data.ativo === false) {
    return NextResponse.json(
      { error: "Não é possível desativar a própria conta." },
      { status: 409 }
    );
  }

  if (parsed.data.email && parsed.data.email.toLowerCase() !== current.email) {
    const existing = await prisma.usuario.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }
  }

  if (parsed.data.ativo === false && current.ativo && current.clerkId) {
    const client = await clerkClient();
    const sessions = await client.sessions.getSessionList({
      userId: current.clerkId,
    });
    await Promise.allSettled(
      sessions.data.map((session) => client.sessions.revokeSession(session.id))
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.nome !== undefined) updateData.nome = parsed.data.nome;
  if (parsed.data.email !== undefined)
    updateData.email = parsed.data.email.toLowerCase();
  if (parsed.data.telefone !== undefined)
    updateData.telefone = parsed.data.telefone;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.ativo !== undefined) updateData.ativo = parsed.data.ativo;

  const usuario = await prisma.$transaction(async (tx) => {
    const updated = await tx.usuario.update({
      where: { id },
      data: updateData,
      include: {
        empresa: { select: { id: true, nome: true } },
      },
    });

    await tx.log.create({
      data: {
        usuarioId: admin.id,
        empresaId: current.empresaId,
        acao:
          parsed.data.ativo === false
            ? "USUARIO Desativado"
            : parsed.data.ativo === true
              ? "USUARIO Ativado"
              : "USUARIO Atualizado",
        entidade: "Usuario",
        entidadeId: id,
      },
    });

    return updated;
  });

  if (current.clerkId && (parsed.data.nome || parsed.data.email)) {
    const client = await clerkClient();
    const clerkUpdates: Record<string, unknown> = {};
    if (parsed.data.nome) clerkUpdates.firstName = parsed.data.nome;
    if (parsed.data.email) clerkUpdates.emailAddress = parsed.data.email.toLowerCase();
    try {
      await client.users.updateUser(current.clerkId, clerkUpdates);
    } catch {
      // Clerk update is best-effort
    }
  }

  return NextResponse.json(usuario);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      clerkId: true,
      empresaId: true,
    },
  });

  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (usuario.email === admin.email) {
    return NextResponse.json(
      { error: "Não é possível excluir a própria conta de administrador." },
      { status: 409 }
    );
  }

  if (usuario.clerkId) {
    const client = await clerkClient();
    await client.users.deleteUser(usuario.clerkId).catch(() => {});
  }

  await prisma.$transaction(async (tx) => {
    await tx.log.create({
      data: {
        usuarioId: admin.id,
        empresaId: usuario.empresaId,
        acao: "USUARIO_EXCLUIDO",
        entidade: "Usuario",
        entidadeId: id,
      },
    });

    await tx.usuario.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
