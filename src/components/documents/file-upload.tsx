"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";

interface FileUploadProps {
  processoId?: string;
  empresaId: string;
  usuarioId: string;
  onUploadComplete?: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];

const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.zip";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return "Imagem";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Word";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "Excel";
  if (mimeType.includes("zip")) return "ZIP";
  return "Arquivo";
}

export function FileUpload({
  processoId,
  empresaId,
  usuarioId,
  onUploadComplete,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selected: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Tipo de arquivo não aceito");
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError("Arquivo muito grande (máximo 50MB)");
      return;
    }
    setFile(selected);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const tipoArquivo = file.type.includes("pdf")
        ? "PDF"
        : file.type.includes("image")
          ? "IMAGEM"
          : file.type.includes("word") || file.type.includes("document")
            ? "WORD"
            : file.type.includes("excel") || file.type.includes("sheet")
              ? "EXCEL"
              : file.type.includes("zip")
                ? "ZIP"
                : "OUTRO";

      if (!processoId || !empresaId || !usuarioId) {
        throw new Error("Processo ou usuário ainda não foi carregado");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      await upload(`processos/${processoId}/${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/documentos/upload",
        clientPayload: JSON.stringify({
          nome: file.name,
          tamanho: file.size,
          mimeType: file.type,
          tipoArquivo,
          processoId,
        }),
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      setFile(null);
      setProgress(100);
      window.setTimeout(() => onUploadComplete?.(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar arquivo");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-border bg-surface">
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-border hover:border-border hover:bg-muted/30"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">
            Arraste e solte o arquivo aqui
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            PDF, imagens, Word, Excel, ZIP (máx. 50MB)
          </p>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleInputChange}
          className="hidden"
        />

        {file && (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {getFileTypeLabel(file.type)} · {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {file && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
                {progress > 0 ? ` ${progress}%` : ""}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar arquivo
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
