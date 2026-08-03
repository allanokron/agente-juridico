"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Role } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderOpen,
  Search,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  FileText,
  Image,
  FileSpreadsheet,
  Archive,
} from "lucide-react";
import { DocumentPreview } from "@/components/documents/document-preview";

interface ApiDocument {
  id: string;
  nome: string;
  descricao?: string | null;
  tipoArquivo: string;
  mimeType?: string | null;
  tamanho?: number | null;
  tamanhoKb?: number | null;
  url: string;
  createdAt: string;
  processo?: {
    numeroProcesso: string;
    cliente?: { nome: string } | null;
  } | null;
  usuario: {
    nome: string;
  };
}

interface Document {
  id: string;
  nome: string;
  processoNumero: string | null;
  tipoArquivo: string;
  mimeType: string;
  tamanho: number;
  usuario: string;
  dataUpload: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFileIcon(tipoArquivo: string) {
  switch (tipoArquivo) {
    case "PDF":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "IMAGEM":
      return <Image className="h-5 w-5 text-purple-500" />;
    case "WORD":
      return <FileText className="h-5 w-5 text-blue-600" />;
    case "EXCEL":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    case "ZIP":
      return <Archive className="h-5 w-5 text-amber-500" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
}

function getTipoBadgeColor(tipoArquivo: string) {
  switch (tipoArquivo) {
    case "PDF":
      return "bg-red-100 text-red-700";
    case "IMAGEM":
      return "bg-purple-100 text-purple-700";
    case "WORD":
      return "bg-blue-100 text-blue-700";
    case "EXCEL":
      return "bg-emerald-100 text-emerald-700";
    case "ZIP":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function mapApiDocument(doc: ApiDocument): Document {
  return {
    id: doc.id,
    nome: doc.nome,
    processoNumero: doc.processo?.numeroProcesso ?? null,
    tipoArquivo: doc.tipoArquivo,
    mimeType: doc.mimeType ?? "",
    tamanho: doc.tamanho ?? doc.tamanhoKb ?? 0,
    usuario: doc.usuario.nome,
    dataUpload: doc.createdAt,
  };
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMINISTRADOR;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/documentos?empresaId=empresa-1`
      );
      if (response.ok) {
        const data: ApiDocument[] = await response.json();
        setDocuments(data.map(mapApiDocument));
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePreview = (docId: string) => {
    setPreviewId(docId);
    setPreviewOpen(true);
  };

  const handleDownload = (doc: Document) => {
    const link = window.document.createElement("a");
    link.href = `/api/documentos/${doc.id}/preview`;
    link.download = doc.nome;
    link.click();
  };

  const handleDelete = async (docId: string) => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      const response = await fetch(`/api/documentos/${docId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id }),
      });
      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      // error handled silently
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.processoNumero &&
        doc.processoNumero.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || doc.tipoArquivo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Documentos"
          description="Visualize e gerencie todos os documentos do escritório"
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Buscar por nome ou processo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(v) => v && setFilterType(v)}
            items={[
              { value: "all", label: "Todos os tipos" },
              { value: "PDF", label: "PDF" },
              { value: "IMAGEM", label: "Imagem" },
              { value: "WORD", label: "Word" },
              { value: "EXCEL", label: "Excel" },
              { value: "ZIP", label: "ZIP" },
              { value: "OUTRO", label: "Outro" },
            ]}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo de arquivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="IMAGEM">Imagem</SelectItem>
              <SelectItem value="WORD">Word</SelectItem>
              <SelectItem value="EXCEL">Excel</SelectItem>
              <SelectItem value="ZIP">ZIP</SelectItem>
              <SelectItem value="OUTRO">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-muted rounded animate-pulse"
              />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            title="Nenhum documento encontrado"
            description={
              searchTerm || filterType !== "all"
                ? "Tente ajustar os filtros de busca."
                : "Ainda não há documentos enviados."
            }
            icon={FolderOpen}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Enviado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => handlePreview(doc.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.tipoArquivo)}
                          <span className="font-medium">{doc.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {doc.processoNumero ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getTipoBadgeColor(doc.tipoArquivo)}
                        >
                          {doc.tipoArquivo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(doc.tamanho)}
                      </TableCell>
                      <TableCell>{doc.usuario}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(doc.dataUpload)}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handlePreview(doc.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-3.5 w-3.5" />
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
            </CardContent>
          </Card>
        )}
      </div>

      <DocumentPreview
        documentoId={previewId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </DashboardLayout>
  );
}
