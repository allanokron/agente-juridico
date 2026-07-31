"use client";

import { Card } from "@/components/ui/card";
import { GripVertical, AlertTriangle, CheckCircle, User } from "lucide-react";

interface KanbanCardProps {
  card: {
    id: string;
    numeroProcesso: string;
    isPreProcesso: boolean;
    nomeCliente: string;
    responsavel: string | null;
    dataRevisao: string | null;
    hora: string | null;
    observacoes: string | null;
  };
  onClick: () => void;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
}

function parseDate(dateStr: string): Date | null {
  try {
    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }
    return new Date(dateStr + "T12:00:00");
  } catch {
    return null;
  }
}

function getRevisionStatus(dateStr: string): {
  color: string;
  bg: string;
  label: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const revDate = parseDate(dateStr);

  if (!revDate) {
    return {
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      label: "Sem data",
    };
  }

  const revDay = new Date(revDate);
  revDay.setHours(0, 0, 0, 0);

  if (revDay < today) {
    return {
      color: "text-[#EF4444]",
      bg: "bg-[#EF4444]/10",
      label: "Atrasado",
    };
  }

  if (revDay.getTime() === today.getTime()) {
    return {
      color: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/10",
      label: "Hoje",
    };
  }

  return {
    color: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
    label: "Em dia",
  };
}

function formatDateTime(dateStr: string, hora: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return "";
  const date = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  if (hora) return `${date} ${hora}`;
  return date;
}

export function KanbanCard({ card, onClick, onDragStart }: KanbanCardProps) {
  const revisionStatus = card.dataRevisao
    ? getRevisionStatus(card.dataRevisao)
    : null;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={onClick}
      className={`cursor-pointer p-3 transition-shadow hover:shadow-md ${
        card.isPreProcesso
          ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200/70"
          : "border-border bg-white"
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {card.isPreProcesso && (
            <span className="mb-1.5 inline-flex rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              Pré-processo
            </span>
          )}
          <p className="truncate text-sm font-medium text-foreground">
            {card.numeroProcesso || (card.isPreProcesso ? "Aguardando número" : "Sem número")}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {card.nomeCliente}
          </p>

          {card.dataRevisao && revisionStatus && (
            <div
              className={`inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-lg text-xs font-medium ${revisionStatus.bg} ${revisionStatus.color}`}
            >
              {revisionStatus.label === "Atrasado" ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              {formatDateTime(card.dataRevisao, card.hora)}
            </div>
          )}

          {card.responsavel && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{card.responsavel}</span>
            </div>
          )}

          {card.observacoes && (
            <p className="text-xs text-muted-foreground/60 mt-2 line-clamp-2">
              {card.observacoes}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
