import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { canAccessProcess, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];
const MAX_SIZE = 50 * 1024 * 1024;

type UploadPayload = {
  processoId: string;
  usuarioId: string;
  empresaId: string;
  nome: string;
  mimeType: string;
  tamanho: number;
  tipoArquivo: "PDF" | "IMAGEM" | "WORD" | "EXCEL" | "ZIP" | "OUTRO";
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getSessionUser();
        if (!user) throw new Error("Não autenticado");
        if (!clientPayload) throw new Error("Dados do upload ausentes");
        const payload = JSON.parse(clientPayload) as Omit<UploadPayload, "usuarioId" | "empresaId">;
        if (!(await canAccessProcess(payload.processoId, user))) {
          throw new Error("Acesso negado");
        }
        if (!ALLOWED_TYPES.includes(payload.mimeType) || payload.tamanho > MAX_SIZE) {
          throw new Error("Arquivo não permitido");
        }
        if (!pathname.startsWith(`processos/${payload.processoId}/`)) {
          throw new Error("Destino inválido");
        }
        return {
          access: "private" as const,
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            ...payload,
            usuarioId: user.id,
            empresaId: user.empresaId,
          } satisfies UploadPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) throw new Error("Metadados do upload ausentes");
        const payload = JSON.parse(tokenPayload) as UploadPayload;
        await prisma.$transaction(async (tx) => {
          const existing = await tx.documento.findUnique({
            where: { blobPath: blob.pathname },
          });
          if (existing) return;
          const document = await tx.documento.create({
            data: {
              empresaId: payload.empresaId,
              processoId: payload.processoId,
              usuarioId: payload.usuarioId,
              nome: payload.nome,
              tipoArquivo: payload.tipoArquivo,
              mimeType: payload.mimeType,
              tamanho: payload.tamanho,
              tamanhoKb: Math.round(payload.tamanho / 1024),
              url: blob.url,
              blobPath: blob.pathname,
            },
          });
          await tx.historico.create({
            data: {
              processoId: payload.processoId,
              usuarioId: payload.usuarioId,
              descricao: `Documento "${payload.nome}" adicionado ao processo`,
              tipo: "DOCUMENTO_ADICIONADO",
              detalhes: { documentoId: document.id, nome: payload.nome },
            },
          });
        });
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao fazer upload" },
      { status: 400 }
    );
  }
}
