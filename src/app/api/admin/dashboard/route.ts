import { NextResponse } from "next/server";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [
    empresas,
    empresasAtivas,
    usuarios,
    processos,
    leads,
    leadsNovos,
    conversoesMes,
    recentes,
  ] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { ativo: true } }),
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.processo.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NOVO" } }),
    prisma.lead.count({ where: { status: "GANHO", updatedAt: { gte: start } } }),
    prisma.lead.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nomeContato: true,
        escritorio: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    empresas,
    empresasAtivas,
    usuarios,
    processos,
    leads,
    leadsNovos,
    conversoesMes,
    recentes,
  });
}
