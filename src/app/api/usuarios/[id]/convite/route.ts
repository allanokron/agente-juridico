import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getInvitationRedirectUrl } from "@/lib/app-url";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isAdmin(sessionUser)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const usuario = await prisma.usuario.findFirst({
    where: { id, empresaId: sessionUser.empresaId, clerkId: null },
  });
  if (!usuario) {
    return NextResponse.json(
      { error: "Usuário não encontrado ou já ativado" },
      { status: 404 }
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
        empresaId: sessionUser.empresaId,
      },
    });
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        clerkInvitationId: invitation.id,
        conviteEnviadoEm: new Date(),
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
