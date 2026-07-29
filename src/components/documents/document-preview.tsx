"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface DocumentPreviewProps {
  documentoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocumentData {
  id: string;
  nome: string;
  mimeType: string;
  tamanho: number;
  url: string;
  downloadUrl: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function DocumentPreview({
  documentoId,
  open,
  onOpenChange,
}: DocumentPreviewProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentoId) {
      setDocument(null);
      setError(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/documentos/${documentoId}/preview`
        );
        if (!response.ok) throw new Error("Erro ao carregar documento");
        const data = await response.json();
        setDocument(data);
      } catch {
        setError("Erro ao carregar documento");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [open, documentoId]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          <div className="h-6 w-48 bg-border rounded animate-pulse" />
          <div className="h-4 w-32 bg-border rounded animate-pulse" />
          <div className="h-96 bg-border rounded animate-pulse" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/60 mb-4" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      );
    }

    if (!document) return null;

    if (document.mimeType === "application/pdf") {
      return (
        <iframe
          src={document.url}
          className="w-full border-0"
          style={{ height: "calc(100vh - 200px)" }}
          title={document.nome}
        />
      );
    }

    if (document.mimeType.startsWith("image/")) {
      return (
        <div className="flex justify-center p-4">
          <img
            src={document.url}
            alt={document.nome}
            className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-16 w-16 text-muted-foreground/60 mb-4" />
        <h3 className="text-base font-medium text-foreground mb-1">
          {document.nome}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {formatFileSize(document.tamanho)}
        </p>
        <a href={document.downloadUrl}>
          <Button>
            <Download className="h-4 w-4" />
            Baixar arquivo
          </Button>
        </a>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {loading ? "Carregando..." : document?.nome || "Pré-visualização"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
