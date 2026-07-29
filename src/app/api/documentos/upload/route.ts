import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      empresaId,
      processoId,
      usuarioId,
      nome,
      descricao,
      conteudo,
      tipoArquivo,
      mimeType,
      tamanho,
    } = body;

    if (!empresaId || !usuarioId || !nome || !conteudo || !tipoArquivo) {
      return NextResponse.json(
        { error: "empresaId, usuarioId, nome, conteudo e tipoArquivo são obrigatórios" },
        { status: 400 }
      );
    }

    const tamanhoKb = tamanho ? Math.round(tamanho / 1024) : null;

    const documento = await prisma.$transaction(async (tx) => {
      const doc = await tx.documento.create({
        data: {
          empresaId,
          processoId: processoId || null,
          usuarioId,
          nome,
          descricao: descricao || null,
          conteudo,
          tipoArquivo,
          mimeType: mimeType || null,
          tamanho: tamanho || null,
          tamanhoKb,
          url: "",
        },
      });

      if (processoId) {
        await tx.historico.create({
          data: {
            processoId,
            usuarioId,
            descricao: `Documento "${nome}" adicionado ao processo`,
            tipo: "DOCUMENTO_ADICIONADO",
            detalhes: { documentoId: doc.id, nome, tipoArquivo },
          },
        });
      }

      return doc;
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error("Erro ao fazer upload do documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao fazer upload do documento" },
      { status: 500 }
    );
  }
}
