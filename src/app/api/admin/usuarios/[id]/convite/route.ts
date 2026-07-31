import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getInvitationRedirectUrl } from "@/lib/app-url";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
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
      clerkInvitationId: true,
      empresaId: true,
      ativo: true,
    },
  });

  if (!usuario) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  if (usuario.clerkId) {
    return NextResponse.json(
      { error: "Usuário já ativou a conta. Reenvio não é necessário." },
      { status: 400 }
    );
  }

  try {
    const client = await clerkClient();

    if (usuario.clerkInvitationId) {
      await client.invitations
        .revokeInvitation(usuario.clerkInvitationId)
        .catch(() => undefined);
    }

    const invitation = await client.invitations.createInvitation({
      emailAddress: usuario.email,
      expiresInDays: 30,
      notify: true,
      ignoreExisting: true,
      redirectUrl: getInvitationRedirectUrl(),
      publicMetadata: {
        appUserId: usuario.id,
        empresaId: usuario.empresaId,
      },
    });

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        clerkInvitationId: invitation.id,
        conviteEnviadoEm: new Date(),
      },
    });

    await prisma.log.create({
      data: {
        usuarioId: admin.id,
        empresaId: usuario.empresaId,
        acao: "CONVITE_REENVIADO",
        entidade: "Usuario",
        entidadeId: usuario.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json(
      { error: "Não foi possível reenviar o convite" },
      { status: 502 }
    );
  }
}
