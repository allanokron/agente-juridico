import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { get } from "@vercel/blob";
import { canAccessProcess, getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const documento = await prisma.documento.findUnique({
      where: { id },
      select: {
        processoId: true,
        blobPath: true,
        conteudo: true,
        mimeType: true,
        nome: true,
        tamanho: true,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }
    if (!documento.processoId || !(await canAccessProcess(documento.processoId, user))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("raw") === "1";
    const download = searchParams.get("download") === "1";
    if (!raw) {
      return NextResponse.json({
        id,
        nome: documento.nome,
        mimeType: documento.mimeType || "application/octet-stream",
        tamanho: documento.tamanho || 0,
        url: `/api/documentos/${id}/preview?raw=1`,
        downloadUrl: `/api/documentos/${id}/preview?raw=1&download=1`,
      });
    }

    const contentType = documento.mimeType || "application/octet-stream";
    const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(documento.nome)}`;
    if (documento.blobPath) {
      const blob = await get(documento.blobPath, { access: "private" });
      if (!blob || blob.statusCode !== 200) {
        return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
      }
      return new Response(blob.stream, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Cache-Control": "private, max-age=300",
        },
      });
    }
    if (documento.conteudo) {
      return new Response(Buffer.from(documento.conteudo, "base64"), {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Cache-Control": "private, no-store",
        },
      });
    }

    return NextResponse.json({ error: "Conteúdo indisponível" }, { status: 404 });
  } catch (error) {
    console.error("Erro ao buscar preview do documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar preview do documento" },
      { status: 500 }
    );
  }
}
