"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Zap,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  addDays,
  isToday,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/auth-context";

interface KanbanActivity {
  id: string;
  dataRevisao: string | null;
  hora: string | null;
  processo: {
    numeroProcesso: string | null;
    isPreProcesso: boolean;
    cliente: { nome: string };
  };
  etapa: { nome: string; cor: string | null };
}

interface CalendarEvent {
  id: string;
  titulo: string;
  data: string;
  hora: string | null;
  tipo: string;
  prioridade: string;
  status: string;
  processo: {
    id: string;
    numeroProcesso: string | null;
    isPreProcesso: boolean;
    cliente: { nome: string };
  } | null;
}

interface CalendarItem {
  id: string;
  tipo: "kanban" | "evento";
  data: Date;
  hora: string | null;
  titulo: string;
  subtitulo: string;
  processoLabel: string;
  clienteLabel: string;
  etapaCor: string | null;
  etapaNome: string;
  isPreProcesso: boolean;
  raw: KanbanActivity | CalendarEvent;
}

interface DashboardData {
  processosAtivos: number;
  atividadesHoje: KanbanActivity[];
  atividadesAmanha: KanbanActivity[];
  atrasados: KanbanActivity[];
  agenda: KanbanActivity[];
  eventos: CalendarEvent[];
}

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const TIPO_LABELS: Record<string, string> = {
  AUDIENCIA: "Audiência",
  PRAZO: "Prazo",
  REUNIAO: "Reunião",
  PROTOCOLO: "Protocolo",
  LEMBRETE: "Lembrete",
  PERSONALIZADO: "Personalizado",
};

function getMonthDays(currentMonth: Date) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const startDay = (start.getDay() + 6) % 7;
  const padding: Date[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    padding.push(addDays(start, -(i + 1)));
  }

  const endDay = (end.getDay() + 6) % 7;
  const trailing: Date[] = [];
  for (let i = 1; i <= 6 - endDay; i++) {
    trailing.push(addDays(end, i));
  }

  return [...padding, ...days, ...trailing];
}

function getWeekDays(currentDate: Date) {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function sortItemsByTime(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
    if (a.hora && !b.hora) return -1;
    if (!a.hora && b.hora) return 1;
    return 0;
  });
}

function getProcessLabel(item: KanbanActivity | CalendarEvent): string {
  if ("processo" in item && item.processo) {
    const p = item.processo;
    if (p.isPreProcesso && !p.numeroProcesso) return "Pré-processo";
    return p.numeroProcesso || "S/N";
  }
  return "";
}

function buildCalendarItems(agenda: KanbanActivity[], eventos: CalendarEvent[]): CalendarItem[] {
  const items: CalendarItem[] = [];

  for (const card of agenda) {
    if (!card.dataRevisao) continue;
    items.push({
      id: card.id,
      tipo: "kanban",
      data: new Date(card.dataRevisao),
      hora: card.hora,
      titulo: card.etapa.nome,
      subtitulo: "",
      processoLabel: getProcessLabel(card),
      clienteLabel: card.processo.cliente.nome,
      etapaCor: card.etapa.cor,
      etapaNome: card.etapa.nome,
      isPreProcesso: card.processo.isPreProcesso,
      raw: card,
    });
  }

  for (const ev of eventos) {
    items.push({
      id: `ev-${ev.id}`,
      tipo: "evento",
      data: new Date(ev.data),
      hora: ev.hora,
      titulo: ev.titulo,
      subtitulo: TIPO_LABELS[ev.tipo] || ev.tipo,
      processoLabel: ev.processo ? getProcessLabel(ev) : "",
      clienteLabel: ev.processo?.cliente.nome || "",
      etapaCor: "#8B5CF6",
      etapaNome: TIPO_LABELS[ev.tipo] || ev.tipo,
      isPreProcesso: ev.processo?.isPreProcesso ?? false,
      raw: ev,
    });
  }

  return items;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<"semana" | "mes">("mes");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);

  const [editingCard, setEditingCard] = useState<KanbanActivity | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [atrasadosOpen, setAtrasadosOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user?.empresaId) return;
    fetch(`/api/empresas/${user.empresaId}`)
      .then((res) => res.json())
      .then((data) => setEmpresaLogo(data.logo ?? null))
      .catch(() => {});
  }, [user?.empresaId]);

  const openEditDialog = (activity: KanbanActivity) => {
    setEditingCard(activity);
    setEditDate(
      activity.dataRevisao
        ? format(new Date(activity.dataRevisao), "yyyy-MM-dd")
        : ""
    );
    setEditTime(activity.hora ?? "");
    setDialogOpen(true);
  };

  const handleDialogSave = async () => {
    if (!editingCard) return;
    setUpdatingId(editingCard.id);
    try {
      const res = await fetch(`/api/kanban/cards/${editingCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataRevisao: editDate || null,
          hora: editTime || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      const updated = await res.json();
      setData((prev) => {
        if (!prev) return prev;
        const updateCard = (card: KanbanActivity) =>
          card.id === editingCard.id
            ? {
                ...card,
                dataRevisao: updated.dataRevisao ?? card.dataRevisao,
                hora: updated.hora ?? card.hora,
              }
            : card;
        return {
          ...prev,
          agenda: prev.agenda.map(updateCard),
          atividadesHoje: prev.atividadesHoje.map(updateCard),
          atividadesAmanha: prev.atividadesAmanha.map(updateCard),
          atrasados: prev.atrasados.map(updateCard),
        };
      });
      setDialogOpen(false);
      setEditingCard(null);
    } catch (err) {
      console.error("Erro ao atualizar data:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  const agenda = data?.agenda ?? [];
  const eventos = data?.eventos ?? [];
  const allCalendarItems = buildCalendarItems(agenda, eventos);

  const selectedDayItems = sortItemsByTime(
    allCalendarItems.filter(
      (item) => isSameDay(item.data, selectedDate)
    )
  );

  const calendarDays =
    view === "mes" ? getMonthDays(currentMonth) : getWeekDays(selectedDate);

  const getItemsForDay = (day: Date) =>
    sortItemsByTime(
      allCalendarItems.filter(
        (item) => isSameDay(item.data, day)
      )
    );

  const handleKanbanCardClick = (item: CalendarItem) => {
    if (item.tipo === "kanban") {
      openEditDialog(item.raw as KanbanActivity);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          {empresaLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={empresaLogo}
              alt="Logo do escritório"
              className="h-10 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visao geral dos seus processos e atividades
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Processos Ativos"
            value={data?.processosAtivos ?? 0}
            icon={Briefcase}
          />
          <StatsCard
            title="Atividades Hoje"
            value={data?.atividadesHoje?.length ?? 0}
            icon={Clock}
          />
          <StatsCard
            title="Atividades Amanha"
            value={data?.atividadesAmanha?.length ?? 0}
            icon={Calendar}
          />
          <StatsCard
            title="Atrasados"
            value={data?.atrasados?.length ?? 0}
            icon={AlertTriangle}
            onClick={() => setAtrasadosOpen(true)}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Agenda</CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <button
                onClick={() => setView("semana")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  view === "semana"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setView("mes")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  view === "mes"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mes
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  view === "mes"
                    ? setCurrentMonth(subMonths(currentMonth, 1))
                    : setSelectedDate(addDays(selectedDate, -7))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground">
                {view === "mes"
                  ? format(currentMonth, "MMMM yyyy", { locale: ptBR })
                  : `${format(getWeekDays(selectedDate)[0], "dd MMM", { locale: ptBR })} - ${format(getWeekDays(selectedDate)[6], "dd MMM yyyy", { locale: ptBR })}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  view === "mes"
                    ? setCurrentMonth(addMonths(currentMonth, 1))
                    : setSelectedDate(addDays(selectedDate, 7))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {view === "mes" && (
              <>
                <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="bg-muted/50 py-2 text-center text-xs font-semibold text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                  {calendarDays.map((day) => {
                    const dayItems = getItemsForDay(day).slice(0, 4);
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          relative bg-white p-2 min-h-[80px] text-left transition-colors border-none
                          ${!isCurrentMonth ? "bg-muted/30" : ""}
                          ${isSelected ? "ring-2 ring-inset ring-primary z-10" : "hover:bg-muted/30"}
                        `}
                      >
                        <span
                          className={`
                            inline-flex items-center justify-center w-7 h-7 text-xs font-semibold rounded-full
                            ${isCurrentDay && !isSelected ? "bg-[#8B5CF6] text-white" : ""}
                            ${isSelected ? "bg-foreground text-white" : ""}
                            ${!isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                          `}
                        >
                          {format(day, "d")}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.tipo === "kanban") {
                                  handleKanbanCardClick(item);
                                }
                              }}
                              title={`${item.etapaNome}\n${item.processoLabel}\n${item.clienteLabel}\n${item.tipo === "evento" ? "Atividade" : "Etapa do kanban"}`}
                              className="block w-full text-left rounded-md px-1.5 py-0.5 border-l-[3px] leading-tight truncate"
                              style={{
                                backgroundColor: item.etapaCor
                                  ? `${item.etapaCor}18`
                                  : "#F1F5F9",
                                borderLeftColor:
                                  item.etapaCor || "#9CA3AF",
                              }}
                            >
                              <span className="block text-[9px] font-bold text-muted-foreground leading-tight">
                                {item.hora || "s/ horario"}
                              </span>
                              {item.tipo === "evento" && (
                                <span className="block text-[8px] font-bold text-purple-600 leading-tight">
                                  {item.subtitulo}
                                </span>
                              )}
                              <span className="block text-[10px] font-semibold text-foreground leading-tight truncate">
                                {item.processoLabel}
                              </span>
                              <span className="block text-[9px] text-muted-foreground leading-tight truncate">
                                {item.clienteLabel}
                              </span>
                            </button>
                          ))}
                          {dayItems.length > 4 && (
                            <div className="text-[10px] text-muted-foreground font-medium px-1">
                              +{dayItems.length - 4} mais
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === "semana" && (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const dayItems = getItemsForDay(day).slice(0, 8);
                  const totalItems = getItemsForDay(day).length;
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`rounded-xl border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedDate(day)}
                        className={`w-full text-center py-2.5 border-b border-border/50 ${
                          isCurrentDay ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="text-xs text-muted-foreground font-medium">
                          {format(day, "EEE", { locale: ptBR })}
                        </div>
                        <div
                          className={`text-lg font-semibold ${
                            isCurrentDay && !isSelected
                              ? "text-[#8B5CF6]"
                              : "text-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                      </button>
                      <div className="p-1.5 space-y-1 min-h-[60px]">
                        {dayItems.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground/40 text-center py-2">
                            —
                          </p>
                        ) : (
                          <>
                            {dayItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.tipo === "kanban") {
                                    handleKanbanCardClick(item);
                                  }
                                }}
                                title={`${item.etapaNome}\n${item.clienteLabel}\n${item.tipo === "evento" ? "Atividade" : "Etapa do kanban"}`}
                                className="block w-full text-left rounded-lg px-1.5 py-1 text-[11px] leading-tight border-l-[3px]"
                                style={{
                                  backgroundColor: item.etapaCor
                                    ? `${item.etapaCor}12`
                                    : "#F8FAFC",
                                  borderLeftColor:
                                    item.etapaCor || "#9CA3AF",
                                }}
                              >
                                <span className="block font-bold text-foreground leading-tight">
                                  {item.hora || "s/ horario"}
                                </span>
                                {item.tipo === "evento" && (
                                  <span className="block text-[9px] font-bold text-purple-600 leading-tight">
                                    {item.subtitulo}
                                  </span>
                                )}
                                <span className="block text-muted-foreground truncate leading-tight">
                                  {item.processoLabel}
                                </span>
                                <span className="block text-muted-foreground truncate leading-tight text-[10px]">
                                  {item.clienteLabel}
                                </span>
                              </button>
                            ))}
                            {totalItems > 8 && (
                              <div className="text-[10px] text-muted-foreground font-medium text-center px-1">
                                +{totalItems - 8} mais
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Day Detail Panel */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </h4>
              {selectedDayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade para este dia
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayItems.map((item) => {
                    const isOverdue =
                      item.data &&
                      isBefore(item.data, new Date()) &&
                      !isToday(item.data);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.tipo === "kanban") {
                            handleKanbanCardClick(item);
                          }
                        }}
                        className={`w-full text-left flex items-center justify-between rounded-xl border p-4 transition-colors cursor-pointer ${
                          isOverdue
                            ? "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                            : "border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                item.etapaCor ||
                                (isOverdue ? "#EF4444" : "#9CA3AF"),
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-semibold ${
                                  isOverdue
                                    ? "text-destructive"
                                    : "text-foreground"
                                }`}
                              >
                                {item.processoLabel}{" "}
                                - {item.etapaNome}
                              </p>
                              {item.tipo === "evento" && (
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px]">
                                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                                  Atividade
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.clienteLabel}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {item.hora && (
                                <span className="font-medium">
                                  {item.hora}
                                </span>
                              )}
                              <span>
                                {format(item.data, "dd/MM/yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <Badge
                              variant="secondary"
                              className="bg-destructive/10 text-destructive text-[10px] font-semibold"
                            >
                              ATRASADO
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar data e horario</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: editingCard.etapa.cor
                    ? `${editingCard.etapa.cor}18`
                    : "#F1F5F9",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: editingCard.etapa.cor || "#9CA3AF",
                  }}
                />
                <span className="text-sm font-medium text-foreground">
                  {editingCard.etapa.nome}
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {editingCard.processo.isPreProcesso && !editingCard.processo.numeroProcesso
                    ? "Pré-processo"
                    : editingCard.processo.numeroProcesso || "S/N"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editingCard.processo.cliente.nome}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Data</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={updatingId === editingCard.id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Horario</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  disabled={updatingId === editingCard.id}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={handleDialogSave}
              disabled={updatingId === editingCard?.id}
            >
              {updatingId === editingCard?.id ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atrasados Dialog */}
      <Dialog open={atrasadosOpen} onOpenChange={setAtrasadosOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Itens Atrasados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(!data?.atrasados || data.atrasados.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma atividade atrasada. Tudo em dia!
              </p>
            ) : (
              data.atrasados.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: card.etapa.cor || "#EF4444",
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {card.processo.isPreProcesso && !card.processo.numeroProcesso
                          ? "Pré-processo"
                          : card.processo.numeroProcesso || "S/N"}{" "}
                        - {card.etapa.nome}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {card.processo.cliente.nome}
                      </p>
                      {card.dataRevisao && (
                        <p className="text-xs text-destructive font-medium mt-0.5">
                          Prazo: {format(new Date(card.dataRevisao), "dd/MM/yyyy")}
                          {card.hora && ` às ${card.hora}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Fechar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
