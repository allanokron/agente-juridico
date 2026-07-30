import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  nome: z.string().trim().min(2).max(160).optional(),
  email: z.string().trim().email().optional(),
  telefone: z.string().trim().max(30).nullable().optional(),
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
  const current = await prisma.empresa.findUnique({
    where: { id },
    include: {
      usuarios: {
        where: { clerkId: { not: null } },
        select: { clerkId: true },
      },
    },
  });
  if (!current) {
    return NextResponse.json({ error: "Escritório não encontrado" }, { status: 404 });
  }
  if (parsed.data.ativo === false && id === admin.empresaId) {
    return NextResponse.json(
      { error: "Não é possível suspender o ambiente do administrador conectado." },
      { status: 409 }
    );
  }
  if (
    parsed.data.ativo === true &&
    current.provisionamentoStatus !== "PRONTO"
  ) {
    return NextResponse.json(
      { error: "Conclua o provisionamento antes de reativar o escritório." },
      { status: 409 }
    );
  }

  if (parsed.data.ativo === false && current.ativo) {
    const client = await clerkClient();
    await Promise.allSettled(
      current.usuarios.flatMap((usuario) =>
        usuario.clerkId
          ? [
              client.sessions
                .getSessionList({ userId: usuario.clerkId })
                .then((result) =>
                  Promise.all(
                    result.data.map((session) =>
                      client.sessions.revokeSession(session.id)
                    )
                  )
                ),
            ]
          : []
      )
    );
  }

  const empresa = await prisma.$transaction(async (tx) => {
    const updated = await tx.empresa.update({
      where: { id },
      data: parsed.data,
      include: {
        masterUser: { select: { id: true, nome: true, email: true } },
        _count: { select: { usuarios: true, processos: true } },
      },
    });
    await tx.log.create({
      data: {
        usuarioId: admin.id,
        empresaId: id,
        acao:
          parsed.data.ativo === false
            ? "EMPRESA_SUSPENSA"
            : parsed.data.ativo === true
              ? "EMPRESA_REATIVADA"
              : "EMPRESA_ATUALIZADA",
        entidade: "Empresa",
        entidadeId: id,
      },
    });
    return updated;
  });

  return NextResponse.json(empresa);
}
