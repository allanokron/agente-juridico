"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { KanbanCard } from "./kanban-card";

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  obrigatorioData: boolean;
}

interface CardData {
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

interface KanbanColumnProps {
  etapa: Etapa;
  cards: CardData[];
  onCardClick: (card: CardData) => void;
  onDrop: (cardId: string, etapaId: string) => void;
  onColumnDrop: (draggedEtapaId: string, targetEtapaId: string) => void;
  isAdmin?: boolean;
  onEdit: (etapa: Etapa) => void;
  onDelete: (etapaId: string) => void;
}

export function KanbanColumn({
  etapa,
  cards,
  onCardClick,
  onDrop,
  onColumnDrop,
  isAdmin,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const isNovoProcesso = etapa.nome === "Novo Processo" || etapa.ordem === 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const cardId = e.dataTransfer.getData("cardId");
    const draggedEtapaId = e.dataTransfer.getData("etapaId");

    if (draggedEtapaId && !isNovoProcesso) {
      onColumnDrop(draggedEtapaId, etapa.id);
    } else if (cardId && !isNovoProcesso) {
      onDrop(cardId, etapa.id);
    }
  };

  const handleColumnDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("etapaId", etapa.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      onDragOver={isNovoProcesso ? undefined : handleDragOver}
      onDragLeave={isNovoProcesso ? undefined : handleDragLeave}
      onDrop={isNovoProcesso ? undefined : handleDrop}
      className={`shrink-0 w-72 flex flex-col rounded-xl border transition-colors ${
        isDragOver
          ? "border-[#8B5CF6]/30 bg-[#8B5CF6]/5"
          : isNovoProcesso
            ? "border-dashed border-border bg-muted/30"
            : "border-border bg-muted/30"
      }`}
    >
      <div
        draggable={!isNovoProcesso}
        onDragStart={!isNovoProcesso ? handleColumnDragStart : undefined}
        className={`flex items-center justify-between p-3 border-b border-border ${
          !isNovoProcesso ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isNovoProcesso && (
            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          )}
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: etapa.cor }}
          />
          <h3 className="text-sm font-semibold text-foreground truncate">
            {etapa.nome}
          </h3>
          <span className="text-xs text-muted-foreground/60 shrink-0">
            {cards.length}
          </span>
        </div>
        {isAdmin && !isNovoProcesso && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(etapa)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(etapa.id)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
        {cards.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-4">
            Nenhum processo
          </p>
        )}
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
            onDragStart={(e) => {
              e.dataTransfer.setData("cardId", card.id);
              e.dataTransfer.effectAllowed = "move";
            }}
          />
        ))}
      </div>
    </div>
  );
}
