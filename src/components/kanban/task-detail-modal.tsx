"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, User } from "lucide-react";
import { DocumentList } from "@/components/documents/document-list";
import { FileUpload } from "@/components/documents/file-upload";

interface CardDetail {
  id: string;
  numeroProcesso: string;
  tipoProcesso: string;
  status: string;
  tribunal: string;
  vara: string;
  nomeCliente: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  dataRevisao: string | null;
  observacoes: string | null;
  equipe: { id: string; nome: string }[];
  processoId: string;
}

interface HistoricoEntry {
  id: string;
  descricao: string;
  criadoEm: string;
  usuario: { nome: string };
}

interface TaskDetailModalProps {
  cardId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  usuarioId: string;
  isAdmin?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskDetailModal({
  cardId,
  open,
  onOpenChange,
  empresaId,
  usuarioId,
  isAdmin,
}: TaskDetailModalProps) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [dataRevisao, setDataRevisao] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!open || !cardId) {
      setCard(null);
      setHistorico([]);
      return;
    }

    setLoading(true);
    try {
      const [cardRes, histRes] = await Promise.all([
        fetch(`/api/kanban/cards/${cardId}`),
        fetch(`/api/kanban/cards/${cardId}/historico`),
      ]);

      if (cardRes.ok) {
        const cardData = await cardRes.json();
        setCard(cardData);
        setObservacoes(cardData.observacoes || "");
        setDataRevisao(cardData.dataRevisao ? cardData.dataRevisao.split("T")[0] : "");
      }

      if (histRes.ok) {
        const histData = await histRes.json();
        setHistorico(histData);
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [open, cardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveObservacoes = async () => {
    if (!cardId) return;
    setSaving(true);
    try {
      await fetch(`/api/kanban/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacoes }),
      });
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDataRevisao = async () => {
    if (!cardId) return;
    setSaving(true);
    try {
      await fetch(`/api/kanban/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataRevisao: dataRevisao || null }),
      });
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const renderLoading = () => (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-full bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-5xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {loading ? "Carregando..." : card?.numeroProcesso || "Detalhes"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          renderLoading()
        ) : card ? (
          <div className="flex-1 overflow-auto min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
              {/* LEFT SIDE */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Processo
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Número:</span>{" "}
                      <span className="text-foreground">
                        {card.numeroProcesso}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>{" "}
                      <span className="text-foreground">{card.tipoProcesso}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant="secondary">{card.status}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tribunal:</span>{" "}
                      <span className="text-foreground">{card.tribunal}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vara:</span>{" "}
                      <span className="text-foreground">{card.vara}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Cliente
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>{" "}
                      <span className="text-foreground">{card.nomeCliente}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CPF/CNPJ:</span>{" "}
                      <span className="text-foreground">{card.cpfCnpj}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>{" "}
                      <span className="text-foreground">{card.telefone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="text-foreground">{card.email}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Equipe
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {card.equipe.map((m) => (
                      <Badge key={m.id} variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        {m.nome}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Data de Revisão
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dataRevisao}
                      onChange={(e) => setDataRevisao(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveDataRevisao}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* CENTER */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Observações
                  </h4>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    onBlur={handleSaveObservacoes}
                    placeholder="Adicione observações sobre este processo..."
                    className="min-h-[120px]"
                  />
                  {saving && (
                    <p className="text-xs text-muted-foreground/60">Salvando...</p>
                  )}
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Documentos
                  </h4>
                  <DocumentList
                    processoId={card.processoId}
                    empresaId={empresaId}
                    usuarioId={usuarioId}
                    isAdmin={isAdmin}
                  />
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Enviar documento
                  </h4>
                  <FileUpload
                    processoId={card.processoId}
                    empresaId={empresaId}
                    usuarioId={usuarioId}
                    onUploadComplete={() => fetchData()}
                  />
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="rounded-lg border border-border p-3 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Histórico
                </h4>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {historico.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 text-center py-4">
                      Nenhum registro
                    </p>
                  ) : (
                    historico.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-b border-border/50 pb-2 last:border-0"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium text-foreground/70">
                            {entry.usuario.nome}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/70 ml-6">
                          {entry.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground/60 ml-6 mt-0.5">
                          {formatDateTime(entry.criadoEm)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
