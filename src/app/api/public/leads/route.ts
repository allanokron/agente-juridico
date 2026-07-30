import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  nomeContato: z.string().trim().min(2).max(120),
  escritorio: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(180),
  whatsapp: z.string().trim().min(8).max(30),
  cidade: z.string().trim().max(100).optional().or(z.literal("")),
  uf: z.string().trim().max(2).optional().or(z.literal("")),
  tamanhoEquipe: z.string().trim().max(60).optional().or(z.literal("")),
  volumeProcessos: z.string().trim().max(60).optional().or(z.literal("")),
  mensagem: z.string().trim().max(2000).optional().or(z.literal("")),
  consentimentoLgpd: z.literal(true),
  website: z.string().max(0).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional(),
  utmTerm: z.string().trim().max(120).optional(),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(request: NextRequest) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

function optional(value?: string) {
  const normalized = value?.trim();
  return normalized || null;
}

export async function POST(request: NextRequest) {
  if (rateLimited(request)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto." },
      { status: 429 }
    );
  }

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revise os campos obrigatórios do formulário." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const emailNormalizado = data.email.toLowerCase();
  const whatsappNormalizado = data.whatsapp.replace(/\D/g, "");
  const existing = await prisma.lead.findFirst({
    where: {
      status: { notIn: ["GANHO", "PERDIDO", "ARQUIVADO"] },
      OR: [{ emailNormalizado }, { whatsappNormalizado }],
    },
    orderBy: { updatedAt: "desc" },
  });

  const common = {
    nomeContato: data.nomeContato,
    escritorio: data.escritorio,
    email: data.email,
    emailNormalizado,
    whatsapp: data.whatsapp,
    whatsappNormalizado,
    cidade: optional(data.cidade),
    uf: optional(data.uf)?.toUpperCase() || null,
    tamanhoEquipe: optional(data.tamanhoEquipe),
    volumeProcessos: optional(data.volumeProcessos),
    mensagem: optional(data.mensagem),
    consentimentoLgpd: true,
    consentimentoEm: new Date(),
    utmSource: optional(data.utmSource),
    utmMedium: optional(data.utmMedium),
    utmCampaign: optional(data.utmCampaign),
    utmContent: optional(data.utmContent),
    utmTerm: optional(data.utmTerm),
  };

  if (existing) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        ...common,
        atividades: {
          create: {
            tipo: "NOVO_ENVIO",
            descricao: "O contato enviou novamente o formulário da home.",
          },
        },
      },
    });
  } else {
    await prisma.lead.create({
      data: {
        ...common,
        atividades: {
          create: {
            tipo: "CRIACAO",
            descricao: "Lead criado pelo formulário da home.",
          },
        },
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
