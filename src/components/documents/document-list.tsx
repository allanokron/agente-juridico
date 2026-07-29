"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, FileText, Image, FileSpreadsheet, FileArchive } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentPreview } from "./document-preview";

interface Document {
  id: string;
  nome: string;
  mimeType: string;
  tamanho: number;
  createdAt: string;
  usuario: { id: string; nome: string };
}

interface DocumentListProps {
  processoId: string;
  empresaId: string;
  usuarioId: string;
  isAdmin?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes("image")) return <Image className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="h-4 w-4 text-blue-600" />;
  if (mimeType.includes("excel") || mimeType.includes("sheet"))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (mimeType.includes("zip")) return <FileArchive className="h-4 w-4 text-yellow-600" />;
  return <FileText className="h-4 w-4 text-muted-foreground/60" />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentList({
  processoId,
  empresaId,
  usuarioId,
  isAdmin,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/documentos?processoId=${processoId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [processoId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      const response = await fetch(`/api/documentos/${docId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      // error handled silently
    }
  };

  const handlePreview = (docId: string) => {
    setPreviewId(docId);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-muted rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum documento"
        description="Envie um arquivo para começar."
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Enviado por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => handlePreview(doc.id)}
              >
                <TableCell>{getFileIcon(doc.mimeType)}</TableCell>
                <TableCell className="font-medium text-foreground">
                  {doc.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(doc.tamanho)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {doc.usuario?.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(doc.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handlePreview(doc.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DocumentPreview
        documentoId={previewId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}
