import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInvitationRedirectUrl } from "@/lib/app-url";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  empresaId: z.string(),
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  telefone: z.string().trim().max(30).optional().nullable(),
  role: z
    .enum(["ADMINISTRADOR", "ADVOGADO", "ASSISTENTE", "ESTAGIARIO"])
    .default("ASSISTENTE"),
});

export async function GET(request: NextRequest) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const empresaId = request.nextUrl.searchParams.get("empresaId");
  const usuarios = await prisma.usuario.findMany({
    where: empresaId ? { empresaId } : {},
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      role: true,
      ativo: true,
      clerkId: true,
      clerkInvitationId: true,
      conviteEnviadoEm: true,
      ultimoAcesso: true,
      empresa: { select: { id: true, nome: true, ativo: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const data = parsed.data;
  const empresa = await prisma.empresa.findUnique({
    where: { id: data.empresaId },
    select: { id: true, ativo: true },
  });
  if (!empresa?.ativo) {
    return NextResponse.json({ error: "Escritório inativo ou inexistente" }, { status: 400 });
  }
  const email = data.email.toLowerCase();
  if (await prisma.usuario.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const usuario = await prisma.usuario.create({
    data: {
      empresaId: data.empresaId,
      nome: data.nome,
      email,
      telefone: data.telefone || null,
      role: data.role,
      ativo: false,
      senha: null,
    },
  });
  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      notify: true,
      expiresInDays: 30,
      redirectUrl: getInvitationRedirectUrl(),
      publicMetadata: { appUserId: usuario.id, empresaId: data.empresaId },
    });
    const invited = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        clerkInvitationId: invitation.id,
        conviteEnviadoEm: new Date(),
      },
      include: { empresa: { select: { id: true, nome: true } } },
    });
    return NextResponse.json(invited, { status: 201 });
  } catch {
    await prisma.usuario.delete({ where: { id: usuario.id } }).catch(() => null);
    return NextResponse.json({ error: "Falha ao enviar convite" }, { status: 502 });
  }
}
