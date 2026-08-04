"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Search,
  Eye,
  DollarSign,
  FileText,
  Users,
  Loader2,
  Trash2,
  ToggleLeft,
  FileDown,
} from "lucide-react";

interface Recibo {
  id: string;
  numero: number;
  valor: number;
  dataPagamento: string;
  pagadorNome: string;
  pagadorCpfCnpj: string;
  servicoPrestado: string;
  formaPagamento: string;
  ativo: boolean;
  servicoTipo?: { id: string; nome: string } | null;
}

interface ServicoTipo {
  id: string;
  nome: string;
}

interface ServicoStat {
  servicoTipoId: string | null;
  nome: string;
  count: number;
  totalValor: number;
}

const PIE_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

function ServiceBreakdown({ data }: { data: ServicoStat[] }) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  if (total === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="text-sm font-bold text-slate-700 shrink-0">Serviços</h3>
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-5 rounded-full overflow-hidden flex">
              {data.map((d, i) => {
                const pct = (d.count / total) * 100;
                return (
                  <div
                    key={d.servicoTipoId}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    title={`${d.nome}: ${d.count} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {data.map((d, i) => {
                const pct = ((d.count / total) * 100).toFixed(0);
                return (
                  <div key={d.servicoTipoId} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-slate-600">{d.nome}</span>
                    <span className="text-xs font-semibold text-slate-900">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const currencyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(date: string) {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export default function RecibosPage() {
  const router = useRouter();
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValor: 0,
    totalRecibos: 0,
    clientesAtendidos: 0,
  });

  const [dataInicio, setDataInicio] = useState(
    format(sevenDaysAgo, "yyyy-MM-dd")
  );
  const [dataFim, setDataFim] = useState(format(today, "yyyy-MM-dd"));
  const [busca, setBusca] = useState("");
  const [servicoTipoFilter, setServicoTipoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ativo");

  const [servicosTipo, setServicosTipo] = useState<ServicoTipo[]>([]);
  const [servicosDialogOpen, setServicosDialogOpen] = useState(false);
  const [novoServicoNome, setNovoServicoNome] = useState("");
  const [addingServico, setAddingServico] = useState(false);
  const [porServico, setPorServico] = useState<ServicoStat[]>([]);

  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [relatorioDataInicio, setRelatorioDataInicio] = useState(format(sevenDaysAgo, "yyyy-MM-dd"));
  const [relatorioDataFim, setRelatorioDataFim] = useState(format(today, "yyyy-MM-dd"));
  const [relatorioServicoTipo, setRelatorioServicoTipo] = useState("all");
  const [relatorioFormato, setRelatorioFormato] = useState<"pdf" | "excel">("pdf");
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const fetchRecibos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim) params.set("dataFim", dataFim);
      if (busca) params.set("busca", busca);
      if (servicoTipoFilter && servicoTipoFilter !== "all")
        params.set("servicoTipoId", servicoTipoFilter);
      if (statusFilter) params.set("status", statusFilter);

      const [recibosRes, statsRes] = await Promise.all([
        fetch(`/api/recibos?${params.toString()}`),
        fetch(`/api/recibos/stats?${params.toString()}`),
      ]);

      if (recibosRes.ok) setRecibos(await recibosRes.json());
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats({
          totalValor: s.totalValor,
          totalRecibos: s.totalRecibos,
          clientesAtendidos: s.clientesAtendidos,
        });
        setPorServico(s.porServico || []);
      }
    } catch {
      toast.error("Erro ao carregar recibos");
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, busca, servicoTipoFilter, statusFilter]);

  const fetchServicosTipo = useCallback(async () => {
    try {
      const res = await fetch("/api/servicos-tipo");
      if (res.ok) setServicosTipo(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchRecibos();
  }, [fetchRecibos]);

  useEffect(() => {
    fetchServicosTipo();
  }, [fetchServicosTipo]);

  const handleAddServico = async () => {
    if (!novoServicoNome.trim()) return;
    setAddingServico(true);
    try {
      const res = await fetch("/api/servicos-tipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoServicoNome.trim() }),
      });
      if (res.ok) {
        toast.success("Serviço adicionado");
        setNovoServicoNome("");
        fetchServicosTipo();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao adicionar serviço");
      }
    } catch {
      toast.error("Erro ao adicionar serviço");
    } finally {
      setAddingServico(false);
    }
  };

  const handleDeleteServico = async (id: string) => {
    try {
      const res = await fetch(`/api/servicos-tipo/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Serviço removido");
        fetchServicosTipo();
        if (servicoTipoFilter === id) setServicoTipoFilter("all");
      }
    } catch {
      toast.error("Erro ao remover serviço");
    }
  };

  const handleToggleAtivo = async (recibo: Recibo) => {
    const msg = recibo.ativo
      ? `Tem certeza que deseja inativar o recibo #${String(recibo.numero).padStart(4, "0")}? Ele não aparecerá mais nos indicadores.`
      : `Deseja reativar o recibo #${String(recibo.numero).padStart(4, "0")}?`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/recibos/${recibo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !recibo.ativo }),
      });
      if (res.ok) {
        toast.success(recibo.ativo ? "Recibo inativado" : "Recibo reativado");
        fetchRecibos();
      } else {
        toast.error("Erro ao atualizar recibo");
      }
    } catch {
      toast.error("Erro ao atualizar recibo");
    }
  };

  const handleGerarRelatorio = async () => {
    setGerandoRelatorio(true);
    try {
      const params = new URLSearchParams();
      if (relatorioDataInicio) params.set("dataInicio", relatorioDataInicio);
      if (relatorioDataFim) params.set("dataFim", relatorioDataFim);
      if (relatorioServicoTipo && relatorioServicoTipo !== "all")
        params.set("servicoTipoId", relatorioServicoTipo);
      params.set("formato", relatorioFormato);

      const res = await fetch(`/api/recibos/relatorio?${params.toString()}`);
      if (!res.ok) {
        toast.error("Erro ao gerar relatório");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibos_${new Date().toISOString().slice(0, 10)}.${relatorioFormato === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setRelatorioOpen(false);
      toast.success("Relatório gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Recibos"
          description="Gerencie seus recibos de pagamento"
          action={{
            label: "Novo Recibo",
            onClick: () => router.push("/recibos/novo"),
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setServicosDialogOpen(true)}
            className="border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Serviço
          </Button>
          <Button
            variant="outline"
            onClick={() => setRelatorioOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Recebido"
            value={currencyFmt.format(stats.totalValor)}
            icon={DollarSign}
          />
          <StatsCard
            title="Recibos Emitidos"
            value={stats.totalRecibos}
            icon={FileText}
          />
          <StatsCard
            title="Clientes Atendidos"
            value={stats.clientesAtendidos}
            icon={Users}
          />
        </div>

        {porServico.length > 0 && <ServiceBreakdown data={porServico} />}

        <Card>
          <CardContent className="grid gap-4 py-4 md:grid-cols-5">
            <div className="grid gap-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Nome ou CPF/CNPJ..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tipo de Serviço</Label>
              <Select
                value={servicoTipoFilter}
                onValueChange={(v) => setServicoTipoFilter(v ?? "all")}
                items={[
                  { value: "all", label: "Todos" },
                  ...servicosTipo.map((s) => ({ value: s.id, label: s.nome })),
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {servicosTipo.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v ?? "ativo")}
                items={[
                  { value: "ativo", label: "Ativos" },
                  { value: "inativo", label: "Inativos" },
                  { value: "todos", label: "Todos" },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ativos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-muted-foreground/60 animate-spin" />
          </div>
        ) : recibos.length === 0 ? (
          <EmptyState
            title="Nenhum recibo encontrado"
            description="Comece emitindo seu primeiro recibo de pagamento."
            icon={Receipt}
            action={{
              label: "Novo Recibo",
              onClick: () => router.push("/recibos/novo"),
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma Pgto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recibos.map((recibo) => (
                    <TableRow key={recibo.id} className={recibo.ativo ? "" : "opacity-50"}>
                      <TableCell className="font-medium">
                        #{String(recibo.numero).padStart(4, "0")}
                      </TableCell>
                      <TableCell>{formatDate(recibo.dataPagamento)}</TableCell>
                      <TableCell>{recibo.pagadorNome}</TableCell>
                      <TableCell>{recibo.pagadorCpfCnpj}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {recibo.servicoTipo?.nome ?? recibo.servicoPrestado}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {currencyFmt.format(recibo.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {recibo.formaPagamento.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recibo.ativo ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/recibos/${recibo.id}`)}
                            title="Ver recibo"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${recibo.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}
                            title={recibo.ativo ? "Inativar" : "Reativar"}
                            onClick={() => handleToggleAtivo(recibo)}
                          >
                            <ToggleLeft className="h-4 w-4" />
                          </Button>
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

      <Dialog open={servicosDialogOpen} onOpenChange={setServicosDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Serviços Padrão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo serviço..."
                value={novoServicoNome}
                onChange={(e) => setNovoServicoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddServico()}
              />
              <Button
                onClick={handleAddServico}
                disabled={!novoServicoNome.trim() || addingServico}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] shrink-0"
              >
                {addingServico ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {servicosTipo.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum serviço cadastrado.
                </p>
              )}
              {servicosTipo.map((servico) => (
                <div
                  key={servico.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">{servico.nome}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteServico(servico.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline">Fechar</Button>}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={relatorioOpen} onOpenChange={setRelatorioOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Recibos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={relatorioDataInicio}
                  onChange={(e) => setRelatorioDataInicio(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={relatorioDataFim}
                  onChange={(e) => setRelatorioDataFim(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tipo de Serviço</Label>
              <Select
                value={relatorioServicoTipo}
                onValueChange={(v) => setRelatorioServicoTipo(v ?? "all")}
                items={[
                  { value: "all", label: "Todos" },
                  ...servicosTipo.map((s) => ({ value: s.id, label: s.nome })),
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {servicosTipo.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Formato</Label>
              <div className="flex gap-3">
                <Button
                  variant={relatorioFormato === "pdf" ? "default" : "outline"}
                  onClick={() => setRelatorioFormato("pdf")}
                  className={relatorioFormato === "pdf" ? "bg-[#8B5CF6] hover:bg-[#7C3AED]" : ""}
                >
                  PDF
                </Button>
                <Button
                  variant={relatorioFormato === "excel" ? "default" : "outline"}
                  onClick={() => setRelatorioFormato("excel")}
                  className={relatorioFormato === "excel" ? "bg-[#8B5CF6] hover:bg-[#7C3AED]" : ""}
                >
                  Excel
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={gerandoRelatorio}>Cancelar</Button>}
            />
            <Button
              onClick={handleGerarRelatorio}
              disabled={gerandoRelatorio}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
            >
              {gerandoRelatorio ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
