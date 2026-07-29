"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
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

interface KanbanActivity {
  id: string;
  dataRevisao: string | null;
  hora: string | null;
  processo: {
    numeroProcesso: string | null;
    cliente: { nome: string };
  };
  etapa: { nome: string; cor: string | null };
}

interface DashboardData {
  processosAtivos: number;
  atividadesHoje: KanbanActivity[];
  atividadesAmanha: KanbanActivity[];
  atrasados: KanbanActivity[];
  agenda: KanbanActivity[];
}

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

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

function sortActivitiesByTime(activities: KanbanActivity[]): KanbanActivity[] {
  return [...activities].sort((a, b) => {
    if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
    if (a.hora && !b.hora) return -1;
    if (!a.hora && b.hora) return 1;
    return 0;
  });
}

const EMPRESA_ID = "empresa-1";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<"semana" | "mes">("mes");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingDates, setPendingDates] = useState<Record<string, string>>({});
  const [pendingTimes, setPendingTimes] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard?empresaId=${EMPRESA_ID}&usuarioId=placeholder&isAdmin=true`
      );
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

  const handleDateUpdate = async (cardId: string) => {
    setUpdatingId(cardId);
    try {
      const newDate = pendingDates[cardId] ?? "";
      const newTime = pendingTimes[cardId] ?? undefined;
      const res = await fetch(`/api/kanban/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataRevisao: newDate || null,
          ...(newTime !== undefined && { hora: newTime || null }),
        }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      await fetchData();
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
  const agendaDates = new Set(
    agenda
      .map((a) =>
        a.dataRevisao ? format(new Date(a.dataRevisao), "yyyy-MM-dd") : null
      )
      .filter(Boolean) as string[]
  );

  const selectedDayActivities = sortActivitiesByTime(
    agenda.filter(
      (a) => a.dataRevisao && isSameDay(new Date(a.dataRevisao), selectedDate)
    )
  );

  const calendarDays =
    view === "mes" ? getMonthDays(currentMonth) : getWeekDays(selectedDate);

  const getActivitiesForDay = (day: Date) =>
    sortActivitiesByTime(
      agenda.filter(
        (a) => a.dataRevisao && isSameDay(new Date(a.dataRevisao), day)
      )
    );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visao geral dos seus processos e atividades
          </p>
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

            {/* Month View */}
            {view === "mes" && (
              <>
                <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-muted-foreground py-2.5 bg-white uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day) => {
                    const dayActivities = getActivitiesForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);
                    const isCurrentMonth =
                      day.getMonth() === currentMonth.getMonth();

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
                          {dayActivities.slice(0, 4).map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] leading-tight truncate"
                              style={{
                                backgroundColor: activity.etapa.cor
                                  ? `${activity.etapa.cor}18`
                                  : "#F1F5F9",
                                color: activity.etapa.cor || "#6B7280",
                              }}
                            >
                              <div
                                className="w-1 h-1 rounded-full shrink-0"
                                style={{
                                  backgroundColor: activity.etapa.cor || "#9CA3AF",
                                }}
                              />
                              <span className="truncate font-medium">
                                {activity.hora
                                  ? `${activity.hora} `
                                  : ""}
                                {activity.etapa.nome}
                              </span>
                            </div>
                          ))}
                          {dayActivities.length > 4 && (
                            <div className="text-[10px] text-muted-foreground font-medium px-1">
                              +{dayActivities.length - 4} mais
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Week View */}
            {view === "semana" && (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const dayActivities = getActivitiesForDay(day).slice(0, 8);
                  const totalActivities = getActivitiesForDay(day).length;
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
                              : isSelected
                                ? "text-foreground"
                                : "text-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                      </button>
                      <div className="p-1.5 space-y-1 min-h-[60px]">
                        {dayActivities.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground/40 text-center py-2">
                            —
                          </p>
                        ) : (
                          <>
                            {dayActivities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-1 rounded-lg px-1.5 py-1 text-[11px] leading-tight"
                                style={{
                                  backgroundColor: activity.etapa.cor
                                    ? `${activity.etapa.cor}12`
                                    : "#F8FAFC",
                                }}
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                                  style={{
                                    backgroundColor:
                                      activity.etapa.cor || "#9CA3AF",
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-foreground truncate">
                                    {activity.hora || "s/ horario"}
                                  </div>
                                  <div className="text-muted-foreground truncate">
                                    {activity.processo.numeroProcesso || "S/N"} -{" "}
                                    {activity.etapa.nome}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {totalActivities > 8 && (
                              <div className="text-[10px] text-muted-foreground font-medium text-center px-1">
                                +{totalActivities - 8} mais
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
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h4>
              {selectedDayActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade para este dia
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayActivities.map((activity) => {
                    const isOverdue =
                      activity.dataRevisao &&
                      isBefore(new Date(activity.dataRevisao), new Date()) &&
                      !isToday(new Date(activity.dataRevisao));

                    return (
                      <div
                        key={activity.id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                          isOverdue
                            ? "border-destructive/20 bg-destructive/5"
                            : "border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                activity.etapa.cor ||
                                (isOverdue ? "#EF4444" : "#9CA3AF"),
                            }}
                          />
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isOverdue ? "text-destructive" : "text-foreground"
                              }`}
                            >
                              {activity.processo.numeroProcesso || "Sem numero"} -{" "}
                              {activity.etapa.nome}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {activity.hora && (
                                <span className="font-medium">
                                  {activity.hora}
                                </span>
                              )}
                              {activity.dataRevisao && (
                                <span>
                                  {format(new Date(activity.dataRevisao), "dd/MM/yyyy")}
                                </span>
                              )}
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
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="date"
                              className="w-36 h-9 text-xs"
                              value={
                                pendingDates[activity.id] ??
                                (activity.dataRevisao
                                  ? format(
                                      new Date(activity.dataRevisao),
                                      "yyyy-MM-dd"
                                    )
                                  : "")
                              }
                              onChange={(e) =>
                                setPendingDates((prev) => ({
                                  ...prev,
                                  [activity.id]: e.target.value,
                                }))
                              }
                              disabled={updatingId === activity.id}
                            />
                            <Input
                              type="time"
                              className="w-24 h-9 text-xs"
                              value={
                                pendingTimes[activity.id] ??
                                activity.hora ??
                                ""
                              }
                              onChange={(e) =>
                                setPendingTimes((prev) => ({
                                  ...prev,
                                  [activity.id]: e.target.value,
                                }))
                              }
                              disabled={updatingId === activity.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs"
                              onClick={() => handleDateUpdate(activity.id)}
                              disabled={updatingId === activity.id}
                            >
                              Atualizar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
