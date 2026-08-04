"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Search,
  Briefcase,
  Loader2,
  Filter,
  X,
  Pencil,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CreateProcessDialog } from "@/components/kanban/create-process-dialog";

const EMPRESA_ID = "empresa-1";

interface Processo {
  id: string;
  numeroProcesso: string | null;
  isPreProcesso: boolean;
  cliente: { id: string; nome: string; cpfCnpj: string | null };
  responsavel: { id: string; nome: string; email: string };
  tribunal: string | null;
  vara: string | null;
  tipoProcesso: string;
  status: string;
  observacoes: string | null;
  dataCadastro: string;
  _count: { documentos: number; eventos: number };
  kanbanCard: {
    id: string;
    etapa: { id: string; nome: string; cor: string } | null;
    dataRevisao: string | null;
  } | null;
  atribuicoes: { id: string; usuario: { id: string; nome: string } }[];
}

interface Evento {
  id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  hora?: string | null;
  tipo: string;
  prioridade: string;
  status: string;
}

const DEFAULT_TIPOS = [
  { value: "CIVIL", label: "Cível" },
  { value: "CRIMINAL", label: "Criminal" },
  { value: "TRABALHISTA", label: "Trabalhista" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "TRIBUTARIO", label: "Tributário" },
  { value: "FAMILIAR", label: "Familiar" },
  { value: "EMPRESARIAL", label: "Empresarial" },
  { value: "CONSUMIDOR", label: "Consumidor" },
  { value: "AMBIENTAL", label: "Ambiental" },
  { value: "PREVIDENCIARIO", label: "Previdenciário" },
  { value: "OUTRO", label: "Outro" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700",
  CONCLUIDO: "bg-green-100 text-green-700",
  CANCELADO: "bg-slate-100 text-slate-500",
  REAGENDADO: "bg-purple-100 text-purple-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  REAGENDADO: "Reagendado",
};

const TIPO_LABELS: Record<string, string> = {
  AUDIENCIA: "Audiência",
  PRAZO: "Prazo",
  REUNIAO: "Reunião",
  PROTOCOLO: "Protocolo",
  LEMBRETE: "Lembrete",
  PERSONALIZADO: "Personalizado",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatEventoDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ProcessesPage() {
  const router = useRouter();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kanbanKey, setKanbanKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [filterEtapa, setFilterEtapa] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterPreProcesso, setFilterPreProcesso] = useState("all");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tiposProcesso, setTiposProcesso] = useState(DEFAULT_TIPOS);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedEventos, setExpandedEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    try {
      const [processosRes, tiposRes] = await Promise.all([
        fetch(`/api/processos?empresaId=${EMPRESA_ID}`),
        fetch(`/api/tipos-processo?empresaId=${EMPRESA_ID}`),
      ]);
      if (processosRes.ok) {
        const data = await processosRes.json();
        setProcessos(data);
      }
      if (tiposRes.ok) {
        const data = await tiposRes.json();
        setTiposProcesso(data.map((t: { valor: string; label: string }) => ({ value: t.valor, label: t.label })));
      }
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const responsaveis = Array.from(
    new Map(processos.map((p) => [p.responsavel.id, p.responsavel])).values()
  );

  const etapas = Array.from(
    new Map(
      processos
        .filter((p) => p.kanbanCard?.etapa)
        .map((p) => [p.kanbanCard!.etapa!.id, p.kanbanCard!.etapa!])
    ).values()
  );

  const filteredProcessos = processos.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.numeroProcesso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente?.cpfCnpj?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResponsavel =
      filterResponsavel === "all" || p.responsavel.id === filterResponsavel;

    const matchesEtapa =
      filterEtapa === "all" || p.kanbanCard?.etapa?.id === filterEtapa;

    const matchesTipo =
      filterTipo === "all" || p.tipoProcesso === filterTipo;

    const matchesPreProcesso =
      filterPreProcesso === "all" ||
      (filterPreProcesso === "pre" && p.isPreProcesso) ||
      (filterPreProcesso === "processo" && !p.isPreProcesso);

    const processoDate = new Date(p.dataCadastro);
    const matchesDataInicio = !filterDataInicio || processoDate >= new Date(filterDataInicio);
    const matchesDataFim = !filterDataFim || processoDate <= new Date(filterDataFim + "T23:59:59");

    return matchesSearch && matchesResponsavel && matchesEtapa && matchesTipo && matchesPreProcesso && matchesDataInicio && matchesDataFim;
  });

  const handleCreated = () => {
    setKanbanKey((k) => k + 1);
    fetchProcessos();
  };

  const toggleExpand = async (processo: Processo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedId === processo.id) {
      setExpandedId(null);
      setExpandedEventos([]);
      return;
    }
    setExpandedId(processo.id);
    setLoadingEventos(true);
    try {
      const res = await fetch(`/api/processos/${processo.id}/atividades`);
      if (res.ok) {
        const data = await res.json();
        setExpandedEventos(data);
      }
    } catch {
      // handled silently
    } finally {
      setLoadingEventos(false);
    }
  };

  const hasActiveFilters =
    searchTerm ||
    filterResponsavel !== "all" ||
    filterEtapa !== "all" ||
    filterTipo !== "all" ||
    filterPreProcesso !== "all" ||
    !!filterDataInicio ||
    !!filterDataFim;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Processos"
          description="Gerencie seus processos jurídicos"
          action={{
            label: "Novo Processo",
            onClick: () => setIsDialogOpen(true),
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Buscar por número, cliente ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-[#8B5CF6] hover:bg-[#7C3AED]" : ""}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1.5 h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {[filterResponsavel, filterEtapa, filterTipo, filterDataInicio, filterDataFim].filter((f) => f && f !== "all").length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchTerm("");
                setFilterResponsavel("all");
                setFilterEtapa("all");
                setFilterTipo("all");
                setFilterPreProcesso("all");
                setFilterDataInicio("");
                setFilterDataFim("");
              }}>
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Data início</Label>
                <Input
                  type="date"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                  className="w-[150px] h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Data fim</Label>
                <Input
                  type="date"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                  className="w-[150px] h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Tipo de processo</Label>
                <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v ?? "all")}
                  items={{ all: "Todos", ...Object.fromEntries(tiposProcesso.map((t) => [t.value, t.label])) }}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposProcesso.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Responsável</Label>
                <Select value={filterResponsavel} onValueChange={(v) => setFilterResponsavel(v ?? "all")}
                  items={{ all: "Todos", ...Object.fromEntries(responsaveis.map((r) => [r.id, r.nome])) }}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {responsaveis.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Etapa</Label>
                <Select value={filterEtapa} onValueChange={(v) => setFilterEtapa(v ?? "all")}
                  items={{ all: "Todas", ...Object.fromEntries(etapas.map((e) => [e.id, e.nome])) }}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {etapas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Tipo de cadastro</Label>
                <Select value={filterPreProcesso} onValueChange={(v) => setFilterPreProcesso(v ?? "all")}
                  items={[
                    { value: "all", label: "Todos" },
                    { value: "processo", label: "Processos" },
                    { value: "pre", label: "Pré-processos" },
                  ]}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="processo">Processos</SelectItem>
                    <SelectItem value="pre">Pré-processos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
          </div>
        ) : filteredProcessos.length === 0 ? (
          <EmptyState
            title="Nenhum processo encontrado"
            description="Comece cadastrando seu primeiro processo."
            icon={Briefcase}
            action={{ label: "Novo Processo", onClick: () => setIsDialogOpen(true) }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Número do Processo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-center">Atividades</TableHead>
                    <TableHead className="text-center">Documentos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Próximo Evento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcessos.map((processo) => {
                    const isExpanded = expandedId === processo.id;
                    return (
                      <Fragment key={processo.id}>
                        <TableRow
                          key={`${processo.id}-row`}
                          className={`cursor-pointer hover:bg-muted/30 ${processo.isPreProcesso ? "bg-amber-50/50" : ""}`}
                          onClick={() => router.push(`/processos/${processo.id}`)}
                        >
                          <TableCell
                            className="w-8 px-2"
                            onClick={(e) => toggleExpand(processo, e)}
                          >
                            {(processo._count?.eventos ?? 0) > 0 ? (
                              <button
                                className="p-1 rounded hover:bg-muted transition-colors"
                                title={isExpanded ? "Recolher atividades" : "Ver atividades"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {processo.isPreProcesso ? (
                              <div className="flex items-center gap-2">
                                <span>{processo.numeroProcesso || "Sem número"}</span>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">Pré</Badge>
                              </div>
                            ) : (
                              processo.numeroProcesso || "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{processo.cliente?.nome}</p>
                              {processo.cliente?.cpfCnpj && (
                                <p className="text-xs text-muted-foreground">{processo.cliente.cpfCnpj}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {tiposProcesso.find((t) => t.value === processo.tipoProcesso)?.label ??
                              processo.tipoProcesso}
                          </TableCell>
                          <TableCell className="text-sm">{processo.responsavel?.nome}</TableCell>
                          <TableCell>
                            {processo.kanbanCard?.etapa ? (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: processo.kanbanCard.etapa.cor
                                    ? `${processo.kanbanCard.etapa.cor}18`
                                    : undefined,
                                  color: processo.kanbanCard.etapa.cor ?? undefined,
                                }}
                              >
                                {processo.kanbanCard.etapa.nome}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs">Sem etapa</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-center">
                            <div className="flex items-center justify-center gap-1">
                              <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <span>{processo._count?.eventos ?? 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-center">
                            {processo._count?.documentos ?? 0}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(processo.dataCadastro)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {processo.kanbanCard?.dataRevisao ? (
                              <Badge variant="outline" className="text-xs">
                                {formatDate(processo.kanbanCard.dataRevisao)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar processo"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/processos/${processo.id}`);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${processo.id}-expanded`} className="bg-muted/20 hover:bg-muted/30">
                            <TableCell colSpan={11} className="p-0">
                              <div className="px-6 py-4">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                  Atividades do processo
                                </h4>
                                {loadingEventos ? (
                                  <div className="flex items-center gap-2 py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
                                    <span className="text-sm text-muted-foreground">Carregando atividades...</span>
                                  </div>
                                ) : expandedEventos.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">
                                    Nenhuma atividade cadastrada para este processo.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {expandedEventos.map((evento) => (
                                      <div
                                        key={evento.id}
                                        className="flex items-center gap-3 rounded-lg border bg-white p-3"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">{evento.titulo}</span>
                                            <Badge
                                              className={`text-[10px] ${STATUS_COLORS[evento.status] || "bg-slate-100 text-slate-500"}`}
                                            >
                                              {STATUS_LABELS[evento.status] || evento.status}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px]">
                                              {TIPO_LABELS[evento.tipo] || evento.tipo}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>{formatEventoDate(evento.data)}</span>
                                            {evento.hora && <span>às {evento.hora}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateProcessDialog
        key={kanbanKey}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreated={handleCreated}
      />
    </DashboardLayout>
  );
}
