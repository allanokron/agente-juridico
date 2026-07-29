"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { CreateProcessDialog } from "@/components/kanban/create-process-dialog";

const EMPRESA_ID = "empresa-1";

interface Processo {
  id: string;
  numeroProcesso: string | null;
  cliente: { id: string; nome: string; cpfCnpj: string | null };
  responsavel: { id: string; nome: string; email: string };
  tribunal: string | null;
  vara: string | null;
  tipoProcesso: string;
  status: string;
  observacoes: string | null;
  dataCadastro: string;
  _count: { documentos: number };
  kanbanCard: {
    id: string;
    etapa: { id: string; nome: string; cor: string } | null;
    dataRevisao: string | null;
  } | null;
  atribuicoes: { id: string; usuario: { id: string; nome: string } }[];
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tiposProcesso, setTiposProcesso] = useState(DEFAULT_TIPOS);

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

    const processoDate = new Date(p.dataCadastro);
    const matchesDataInicio = !filterDataInicio || processoDate >= new Date(filterDataInicio);
    const matchesDataFim = !filterDataFim || processoDate <= new Date(filterDataFim + "T23:59:59");

    return matchesSearch && matchesResponsavel && matchesEtapa && matchesTipo && matchesDataInicio && matchesDataFim;
  });

  const handleCreated = () => {
    setKanbanKey((k) => k + 1);
    fetchProcessos();
  };

  const hasActiveFilters =
    searchTerm ||
    filterResponsavel !== "all" ||
    filterEtapa !== "all" ||
    filterTipo !== "all" ||
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
                <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v ?? "all")}>
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
                <Select value={filterResponsavel} onValueChange={(v) => setFilterResponsavel(v ?? "all")}>
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
                <Select value={filterEtapa} onValueChange={(v) => setFilterEtapa(v ?? "all")}>
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
                    <TableHead>Número do Processo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Próximo Evento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcessos.map((processo) => (
                    <TableRow
                      key={processo.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => router.push(`/processos/${processo.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {processo.numeroProcesso || "—"}
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
                    </TableRow>
                  ))}
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
