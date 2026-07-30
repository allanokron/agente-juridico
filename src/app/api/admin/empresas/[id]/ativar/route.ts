import { NextRequest, NextResponse } from "next/server";
import { getSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { provisionarEmpresa } from "@/lib/provisioning";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const { id } = await params;
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { masterUser: true },
  });
  if (!empresa?.masterUser) {
    return NextResponse.json(
      { error: "Escritório ou usuário master não encontrado." },
      { status: 404 }
    );
  }
  try {
    const result = await provisionarEmpresa({
      leadId: empresa.leadOrigemId,
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email || empresa.masterUser.email,
      telefone: empresa.telefone,
      endereco: empresa.endereco,
      masterNome: empresa.masterUser.nome,
      masterEmail: empresa.masterUser.email,
      masterTelefone: empresa.masterUser.telefone,
      origin: request.nextUrl.origin,
      adminId: admin.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o provisionamento.",
      },
      { status: 502 }
    );
  }
}
