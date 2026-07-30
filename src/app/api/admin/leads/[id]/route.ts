import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z
    .enum([
      "NOVO",
      "EM_CONTATO",
      "QUALIFICADO",
      "PROPOSTA",
      "GANHO",
      "PERDIDO",
      "ARQUIVADO",
    ])
    .optional(),
  responsavelId: z.string().nullable().optional(),
  observacao: z.string().trim().min(1).max(4000).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      responsavel: { select: { id: true, nome: true, email: true } },
      empresaConvertida: true,
      atividades: {
        include: { autor: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return lead
    ? NextResponse.json(lead)
    : NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
}

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
  const current = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const descriptions: string[] = [];
  if (parsed.data.status && parsed.data.status !== current.status) {
    descriptions.push(
      `Status alterado de ${current.status} para ${parsed.data.status}.`
    );
  }
  if (parsed.data.observacao) descriptions.push(parsed.data.observacao);

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      status: parsed.data.status,
      responsavelId: parsed.data.responsavelId,
      ...(descriptions.length
        ? {
            atividades: {
              create: {
                autorId: admin.id,
                tipo: parsed.data.observacao ? "OBSERVACAO" : "STATUS",
                descricao: descriptions.join("\n"),
              },
            },
          }
        : {}),
    },
  });
  return NextResponse.json(lead);
}
