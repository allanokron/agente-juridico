import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { provisionarEmpresa } from "@/lib/provisioning";

const createSchema = z.object({
  leadId: z.string().optional().nullable(),
  nome: z.string().trim().min(2).max(160),
  cnpj: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email(),
  telefone: z.string().trim().max(30).optional().nullable(),
  endereco: z.string().trim().max(300).optional().nullable(),
  cidade: z.string().trim().max(100).optional().nullable(),
  uf: z.string().trim().max(2).optional().nullable(),
  masterNome: z.string().trim().min(2).max(120),
  masterEmail: z.string().trim().email(),
  masterTelefone: z.string().trim().max(30).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const busca = searchParams.get("busca") || undefined;
  const uf = searchParams.get("uf") || undefined;
  const cidade = searchParams.get("cidade") || undefined;
  const plano = searchParams.get("plano") || undefined;

  const where: Record<string, unknown> = {};
  if (uf) where.uf = uf;
  if (plano) where.plano = plano;
  if (cidade) where.cidade = { contains: cidade, mode: "insensitive" };
  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: "insensitive" } },
      { cnpj: { contains: busca, mode: "insensitive" } },
      { email: { contains: busca, mode: "insensitive" } },
    ];
  }

  const empresas = await prisma.empresa.findMany({
    where,
    include: {
      masterUser: {
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
          clerkId: true,
          conviteEnviadoEm: true,
        },
      },
      leadOrigem: { select: { id: true, escritorio: true } },
      _count: { select: { usuarios: true, processos: true, documentos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(empresas);
}

export async function POST(request: NextRequest) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Revise os dados do escritório." }, { status: 400 });
  }
  try {
    const empresa = await provisionarEmpresa({
      ...parsed.data,
      adminId: admin.id,
    });
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível provisionar o escritório.",
      },
      { status: 502 }
    );
  }
}
