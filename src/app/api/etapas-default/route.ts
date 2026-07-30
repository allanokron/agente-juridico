import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth";

const DEFAULT_ETAPAS = [
  { nome: "Triagem", cor: "#3B82F6", ordem: 1 },
  { nome: "Análise", cor: "#F59E0B", ordem: 2 },
  { nome: "Audiência", cor: "#EF4444", ordem: 3 },
  { nome: "Protocolo", cor: "#8B5CF6", ordem: 4 },
  { nome: "Finalizado", cor: "#10B981", ordem: 5 },
];

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const empresaId = user.empresaId;

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const existingEtapas = await prisma.etapasKanban.findMany({
      where: { empresaId, ativo: true },
    });

    if (existingEtapas.length > 0) {
      return NextResponse.json(
        { error: "Empresa já possui etapas configuradas" },
        { status: 409 }
      );
    }

    const etapas = await prisma.$transaction(
      DEFAULT_ETAPAS.map((etapa) =>
        prisma.etapasKanban.create({
          data: {
            empresaId,
            nome: etapa.nome,
            cor: etapa.cor,
            ordem: etapa.ordem,
          },
        })
      )
    );

    return NextResponse.json(etapas, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar etapas padrão:", error);
    return NextResponse.json(
      { error: "Erro ao criar etapas padrão" },
      { status: 500 }
    );
  }
}
