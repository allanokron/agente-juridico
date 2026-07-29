import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const notifications = await prisma.notificacao.findMany({
    where: { usuarioId: user.id, empresaId: user.empresaId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id, todas } = await request.json();
  await prisma.notificacao.updateMany({
    where: {
      usuarioId: user.id,
      empresaId: user.empresaId,
      ...(todas ? {} : { id }),
    },
    data: { lida: true },
  });
  return NextResponse.json({ ok: true });
}
