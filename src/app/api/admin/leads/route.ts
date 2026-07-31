import { NextRequest, NextResponse } from "next/server";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const busca = request.nextUrl.searchParams.get("busca")?.trim();
  const leads = await prisma.lead.findMany({
    where: {
      ...(status && status !== "TODOS"
        ? { status: status as never }
        : {}),
      ...(busca
        ? {
            OR: [
              { nomeContato: { contains: busca, mode: "insensitive" } },
              { escritorio: { contains: busca, mode: "insensitive" } },
              { email: { contains: busca, mode: "insensitive" } },
              { whatsapp: { contains: busca } },
            ],
          }
        : {}),
    },
    include: {
      responsavel: { select: { id: true, nome: true } },
      empresaConvertida: {
        select: {
          id: true,
          nome: true,
          ativo: true,
          provisionamentoStatus: true,
          provisionamentoErro: true,
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
      _count: { select: { atividades: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(leads);
}
