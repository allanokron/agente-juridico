"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

interface Event {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string;
  priority: string;
  process?: string;
  client?: string;
  location?: string;
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Audiência de Instrução",
    date: new Date(2026, 0, 28),
    time: "14:00",
    type: "Audiência",
    priority: "Alta",
    process: "0001234-56.2024.8.26.0001",
    client: "Maria Santos",
    location: "TJSP - 1a Vara Cível",
  },
  {
    id: "2",
    title: "Prazo para Contrarrazões",
    date: new Date(2026, 0, 29),
    time: "18:00",
    type: "Prazo",
    priority: "Alta",
    process: "0002345-67.2024.8.26.0002",
    client: "Empresa XYZ S.A.",
  },
  {
    id: "3",
    title: "Reunião com Cliente",
    date: new Date(2026, 0, 30),
    time: "10:00",
    type: "Reunião",
    priority: "Média",
    client: "João Oliveira",
    location: "Escritório",
  },
  {
    id: "4",
    title: "Protocolo de Petição",
    date: new Date(2026, 1, 2),
    time: "09:00",
    type: "Protocolo",
    priority: "Baixa",
    process: "0003456-78.2024.8.26.0003",
  },
];

export default function AgendaPage() {
  const [events] = useState<Event[]>(mockEvents);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "",
    priority: "Média",
    process: "",
    client: "",
    location: "",
  });

  const selectedDayEvents = events.filter((event) =>
    isSameDay(event.date, selectedDate)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-red-100 text-red-700";
      case "Média":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Audiência":
        return "bg-red-100 text-red-700";
      case "Prazo":
        return "bg-amber-100 text-amber-700";
      case "Reunião":
        return "bg-blue-100 text-blue-700";
      case "Protocolo":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Agenda"
            description="Gerencie seus eventos e compromissos"
            action={{
              label: "Novo Evento",
              onClick: () => setIsDialogOpen(true),
              icon: <Plus className="h-4 w-4 mr-2" />,
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              variant={view === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              Calendário
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
            >
              Lista
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Calendar */}
          <Card className="md:col-span-2 border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
                {daysInMonth.map((day) => {
                  const dayEvents = events.filter((e) => isSameDay(e.date, day));
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 rounded-lg text-sm transition-colors
                        ${isSelected ? "bg-[#8B5CF6] text-white" : "hover:bg-muted"}
                        ${isToday && !isSelected ? "bg-[#8B5CF6]/10 text-[#8B5CF6] font-medium" : ""}
                      `}
                    >
                      {format(day, "d")}
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? "bg-white" : "bg-[#8B5CF6]"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Events */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento para este dia
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        <Badge variant="secondary" className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {event.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.client && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{event.client}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className={`mt-2 ${getTypeColor(event.type)}`}>
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events
                .filter((e) => e.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                          {format(event.date, "d")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, "MMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.time && `${event.time} • `}
                          {event.client || event.process}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Título do evento"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => value && setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Audiência">Audiência</SelectItem>
                    <SelectItem value="Prazo">Prazo</SelectItem>
                    <SelectItem value="Reunião">Reunião</SelectItem>
                    <SelectItem value="Protocolo">Protocolo</SelectItem>
                    <SelectItem value="Lembrete">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={newEvent.priority}
                  onValueChange={(value) => value && setNewEvent({ ...newEvent, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Local do evento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsDialogOpen(false)} className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
              Criar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
