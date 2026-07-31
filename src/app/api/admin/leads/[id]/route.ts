import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { provisionarEmpresa } from "@/lib/provisioning";

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
    include: {
      empresaConvertida: {
        select: {
          id: true,
          masterUser: { select: { clerkId: true, ativo: true } },
        },
      },
    },
  });
  if (!current) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (
    parsed.data.status === "GANHO" &&
    (!current.empresaConvertida ||
      !current.empresaConvertida.masterUser?.clerkId ||
      !current.empresaConvertida.masterUser.ativo)
  ) {
    try {
      await provisionarEmpresa({
        leadId: current.id,
        nome: current.escritorio,
        email: current.email,
        telefone: current.whatsapp,
        masterNome: current.nomeContato,
        masterEmail: current.email,
        masterTelefone: current.whatsapp,
        adminId: admin.id,
      });
      const converted = await prisma.lead.findUnique({
        where: { id: current.id },
        include: {
          empresaConvertida: {
            select: {
              id: true,
              nome: true,
              ativo: true,
              provisionamentoStatus: true,
              masterUser: {
                select: {
                  id: true,
                  email: true,
                  ativo: true,
                  clerkId: true,
                  clerkInvitationId: true,
                  conviteEnviadoEm: true,
                },
              },
            },
          },
        },
      });
      return NextResponse.json(converted);
    } catch (error) {
      console.error("Falha ao converter lead e enviar convite:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível criar o acesso e enviar o convite.",
        },
        { status: 502 }
      );
    }
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
