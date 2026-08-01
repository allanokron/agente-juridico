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
  Settings,
  Loader2,
  Trash2,
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
  servicoTipo?: { id: string; nome: string } | null;
}

interface ServicoTipo {
  id: string;
  nome: string;
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

  const [servicosTipo, setServicosTipo] = useState<ServicoTipo[]>([]);
  const [servicosDialogOpen, setServicosDialogOpen] = useState(false);
  const [novoServicoNome, setNovoServicoNome] = useState("");
  const [addingServico, setAddingServico] = useState(false);

  const fetchRecibos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim) params.set("dataFim", dataFim);
      if (busca) params.set("busca", busca);
      if (servicoTipoFilter && servicoTipoFilter !== "all")
        params.set("servicoTipoId", servicoTipoFilter);

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
      }
    } catch {
      toast.error("Erro ao carregar recibos");
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, busca, servicoTipoFilter]);

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
            <Settings className="h-4 w-4 mr-2" />
            Serviços
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

        <Card>
          <CardContent className="grid gap-4 py-4 md:grid-cols-4">
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
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recibos.map((recibo) => (
                    <TableRow key={recibo.id}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/recibos/${recibo.id}`)}
                          title="Ver recibo"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
    </DashboardLayout>
  );
}
