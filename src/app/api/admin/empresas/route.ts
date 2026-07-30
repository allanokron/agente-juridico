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
  masterNome: z.string().trim().min(2).max(120),
  masterEmail: z.string().trim().email(),
  masterTelefone: z.string().trim().max(30).optional().nullable(),
});

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const empresas = await prisma.empresa.findMany({
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
