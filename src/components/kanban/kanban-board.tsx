"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { KanbanColumn } from "./kanban-column";

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  obrigatorioData: boolean;
}

interface Card {
  id: string;
  processoId: string;
  numeroProcesso: string;
  isPreProcesso: boolean;
  nomeCliente: string;
  responsavel: string | null;
  dataRevisao: string | null;
  hora: string | null;
  observacoes: string | null;
  etapaId: string;
  tipoProcesso: string | null;
  responsavelId: string | null;
  atribuidos: string[];
}

interface KanbanFilters {
  dataInicio?: string;
  dataFim?: string;
  tipo?: string;
  responsavelId?: string;
  atribuidoA?: string;
}

interface KanbanBoardProps {
  empresaId: string;
  usuarioId: string;
  isAdmin?: boolean;
  filters?: KanbanFilters;
}

export function KanbanBoard({
  empresaId,
  usuarioId,
  isAdmin,
  filters,
}: KanbanBoardProps) {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEtapa, setEditEtapa] = useState<Etapa | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCor, setEditCor] = useState("#6366f1");

  const filteredCards = useMemo(() => {
    if (!filters) return cards;
    return cards.filter((card) => {
      if (filters.dataInicio && card.dataRevisao) {
        if (card.dataRevisao < filters.dataInicio) return false;
      }
      if (filters.dataFim && card.dataRevisao) {
        if (card.dataRevisao > filters.dataFim) return false;
      }
      if (filters.tipo && card.tipoProcesso !== filters.tipo) return false;
      if (filters.responsavelId && card.responsavelId !== filters.responsavelId) return false;
      if (filters.atribuidoA && !card.atribuidos.includes(filters.atribuidoA)) return false;
      return true;
    });
  }, [cards, filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [etapasRes, cardsRes] = await Promise.all([
        fetch(`/api/kanban/etapas?empresaId=${empresaId}`),
        fetch(`/api/kanban/cards?empresaId=${empresaId}`),
      ]);

      if (etapasRes.ok) {
        const etapasData = await etapasRes.json();
        setEtapas(etapasData.sort((a: Etapa, b: Etapa) => a.ordem - b.ordem));
      }

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(
          cardsData.map((c: Record<string, unknown>) => ({
            id: c.id,
            processoId: (c.processo as Record<string, unknown>)?.id as string,
            numeroProcesso: (c.processo as Record<string, unknown>)?.numeroProcesso ?? null,
            isPreProcesso: Boolean((c.processo as Record<string, unknown>)?.isPreProcesso),
            nomeCliente: ((c.processo as Record<string, unknown>)?.cliente as Record<string, unknown>)?.nome ?? null,
            responsavel: ((c.processo as Record<string, unknown>)?.responsavel as Record<string, unknown>)?.nome ?? null,
            dataRevisao: c.dataRevisao,
            hora: c.hora,
            observacoes: c.observacoes,
            etapaId: c.etapaId,
            tipoProcesso: (c.processo as Record<string, unknown>)?.tipoProcesso ?? null,
            responsavelId: c.responsavelId ?? null,
            atribuidos: ((c as Record<string, unknown>).atribuicoes as Array<Record<string, unknown>>)?.map((a) => a.usuarioId as string) ?? [],
          }))
        );
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCardClick = (card: Card) => {
    router.push(`/processos/${card.processoId}`);
  };

  const handleDrop = async (cardId: string, etapaId: string) => {
    const targetEtapa = etapas.find((e) => e.id === etapaId);
    if (targetEtapa?.obrigatorioData) {
      const card = cards.find((c) => c.id === cardId);
      if (card && !card.dataRevisao) {
        alert("Esta etapa requer uma data de revisão. Defina a data antes de mover o processo.");
        return;
      }
    }

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, etapaId } : c))
    );

    try {
      await fetch("/api/kanban/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, etapaId }),
      });
    } catch {
      fetchData();
    }
  };

  const handleColumnDrop = async (draggedEtapaId: string, targetEtapaId: string) => {
    if (draggedEtapaId === targetEtapaId) return;

    const draggedIdx = etapas.findIndex((e) => e.id === draggedEtapaId);
    const targetIdx = etapas.findIndex((e) => e.id === targetEtapaId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newEtapas = [...etapas];
    const [removed] = newEtapas.splice(draggedIdx, 1);
    newEtapas.splice(targetIdx, 0, removed);

    const updatedEtapas = newEtapas.map((e, i) => ({ ...e, ordem: i }));
    setEtapas(updatedEtapas);

    try {
      await Promise.all(
        updatedEtapas.map((e) =>
          fetch(`/api/kanban/etapas/${e.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ordem: e.ordem }),
          })
        )
      );
    } catch {
      fetchData();
    }
  };

  const handleAddColumn = async () => {
    const nome = prompt("Nome da nova etapa:");
    if (!nome) return;

    try {
      await fetch("/api/kanban/etapas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          empresaId,
          ordem: etapas.length,
          cor: "#6366f1",
        }),
      });
      fetchData();
    } catch {
      // error handled silently
    }
  };

  const handleEditColumn = (etapa: Etapa) => {
    setEditEtapa(etapa);
    setEditNome(etapa.nome);
    setEditCor(etapa.cor || "#6366f1");
  };

  const handleSaveEtapa = async () => {
    if (!editEtapa || !editNome.trim()) return;
    try {
      await fetch(`/api/kanban/etapas/${editEtapa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: editNome.trim(), cor: editCor }),
      });
      setEditEtapa(null);
      fetchData();
    } catch {
      // error handled silently
    }
  };

  const handleDeleteColumn = async (etapaId: string) => {
    const colCards = filteredCards.filter((c) => c.etapaId === etapaId);
    if (colCards.length > 0) {
      alert("Não é possível excluir uma etapa com processos.");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir esta etapa?")) return;

    try {
      await fetch(`/api/kanban/etapas/${etapaId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch {
      // error handled silently
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shrink-0 w-72">
            <div className="h-10 bg-muted rounded-lg animate-pulse mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="h-24 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Suas Etapas</h2>
        {isAdmin && (
          <Button onClick={handleAddColumn} size="sm">
            <Plus className="h-4 w-4" />
            Nova etapa
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapas
          .filter((etapa) => {
            if (etapa.nome === "Novo Processo" || etapa.ordem === 0) {
              return filteredCards.some((c) => c.etapaId === etapa.id);
            }
            return true;
          })
          .map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              cards={filteredCards.filter((c) => c.etapaId === etapa.id)}
              onCardClick={handleCardClick}
              onDrop={handleDrop}
              onColumnDrop={handleColumnDrop}
              isAdmin={isAdmin}
              onEdit={handleEditColumn}
              onDelete={handleDeleteColumn}
            />
          ))}
      </div>

      <Dialog open={!!editEtapa} onOpenChange={(open) => !open && setEditEtapa(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="etapaNome">Nome</Label>
              <Input
                id="etapaNome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome da etapa"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editCor}
                  onChange={(e) => setEditCor(e.target.value)}
                  className="h-10 w-14 rounded border border-border cursor-pointer"
                />
                <div className="flex gap-2">
                  {["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditCor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-colors ${
                        editCor === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Pré-visualização</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editCor }} />
                <span className="text-sm font-medium text-foreground">{editNome || "Nome da etapa"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEtapa(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEtapa} disabled={!editNome.trim()} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
