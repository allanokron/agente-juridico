import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    if (user.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        uf: true,
        cep: true,
        numero: true,
        complemento: true,
        logo: true,
        logoExclusiva: true,
        plano: true,
      },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json({ error: "Erro ao buscar empresa" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    if (user.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, cnpj, email, telefone, endereco, cidade, uf, logo, logoExclusiva, cep, numero, complemento } = body;

    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cnpj !== undefined && { cnpj }),
        ...(email !== undefined && { email }),
        ...(telefone !== undefined && { telefone }),
        ...(endereco !== undefined && { endereco }),
        ...(cidade !== undefined && { cidade }),
        ...(uf !== undefined && { uf }),
        ...(cep !== undefined && { cep }),
        ...(numero !== undefined && { numero }),
        ...(complemento !== undefined && { complemento }),
        ...(logo !== undefined && { logo }),
        ...(logoExclusiva !== undefined && { logoExclusiva }),
      },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        uf: true,
        cep: true,
        numero: true,
        complemento: true,
        logo: true,
        logoExclusiva: true,
      },
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}
