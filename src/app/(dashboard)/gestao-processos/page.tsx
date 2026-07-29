"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { CreateProcessDialog } from "@/components/kanban/create-process-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Filter, X } from "lucide-react";

const EMPRESA_ID = "empresa-1";
const USUARIO_ID = "user-1";

const TIPOS_PROCESSO = [
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

interface Usuario {
  id: string;
  nome: string;
}

export default function GestaoProcessosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kanbanKey, setKanbanKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [filterAtribuido, setFilterAtribuido] = useState("all");

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch(`/api/usuarios?empresaId=${EMPRESA_ID}`);
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleCreated = () => {
    setKanbanKey((k) => k + 1);
  };

  const hasActiveFilters =
    filterDataInicio || filterDataFim || filterTipo !== "all" || filterResponsavel !== "all" || filterAtribuido !== "all";

  const clearFilters = () => {
    setFilterDataInicio("");
    setFilterDataFim("");
    setFilterTipo("all");
    setFilterResponsavel("all");
    setFilterAtribuido("all");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestão de Processos"
          description="Visualize e gerencie seus processos no quadro Kanban"
          action={{
            label: "Novo Processo",
            onClick: () => setIsDialogOpen(true),
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
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
                  {[filterDataInicio, filterDataFim, filterTipo, filterResponsavel, filterAtribuido].filter((f) => f && f !== "all").length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
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
                    {TIPOS_PROCESSO.map((t) => (
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
                  items={{ all: "Todos", ...Object.fromEntries(usuarios.map((u) => [u.id, u.nome])) }}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Atribuído a</Label>
                <Select value={filterAtribuido} onValueChange={(v) => setFilterAtribuido(v ?? "all")}
                  items={{ all: "Todos", ...Object.fromEntries(usuarios.map((u) => [u.id, u.nome])) }}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <KanbanBoard
          key={kanbanKey}
          empresaId={EMPRESA_ID}
          usuarioId={USUARIO_ID}
          isAdmin
          filters={{
            dataInicio: filterDataInicio || undefined,
            dataFim: filterDataFim || undefined,
            tipo: filterTipo !== "all" ? filterTipo : undefined,
            responsavelId: filterResponsavel !== "all" ? filterResponsavel : undefined,
            atribuidoA: filterAtribuido !== "all" ? filterAtribuido : undefined,
          }}
        />
      </div>

      <CreateProcessDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreated={handleCreated}
      />
    </DashboardLayout>
  );
}
