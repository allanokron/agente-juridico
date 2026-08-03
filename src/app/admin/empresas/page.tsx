"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CpfCnpjInput } from "@/components/shared/cpf-cnpj-input";

type Empresa = {
  id: string;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  plano: string;
  ativo: boolean;
  provisionamentoStatus: string;
  provisionamentoErro?: string | null;
  createdAt: string;
  masterUser?: {
    id: string;
    nome: string;
    email: string;
    ativo: boolean;
    clerkId?: string | null;
  } | null;
  _count: { usuarios: number; processos: number; documentos: number };
};

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const PLANOS = ["free", "basic", "pro", "enterprise"];

const emptyCreateForm = {
  leadId: "",
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  cidade: "",
  uf: "",
  masterNome: "",
  masterEmail: "",
  masterTelefone: "",
};

const emptyEditForm = {
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  cidade: "",
  uf: "",
  plano: "free",
};

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroUf, setFiltroUf] = useState<string>("");
  const [filtroPlano, setFiltroPlano] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (filtroUf) params.set("uf", filtroUf);
    if (filtroPlano) params.set("plano", filtroPlano);
    const qs = params.toString();
    const response = await fetch(`/api/admin/empresas${qs ? `?${qs}` : ""}`);
    setEmpresas(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [busca, filtroUf, filtroPlano]);

  useEffect(() => {
    const leadId = new URLSearchParams(window.location.search).get("lead");
    if (leadId) {
      fetch(`/api/admin/leads/${leadId}`)
        .then((r) => r.json())
        .then((lead) => {
          setCreateForm({
            ...emptyCreateForm,
            leadId,
            nome: lead.escritorio || "",
            email: lead.email || "",
            telefone: lead.whatsapp || "",
            masterNome: lead.nomeContato || "",
            masterEmail: lead.email || "",
            masterTelefone: lead.whatsapp || "",
          });
          setCreateOpen(true);
        });
    }
  }, []);

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    setCreateSaving(true);
    setCreateError("");
    const response = await fetch("/api/admin/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, leadId: createForm.leadId || null }),
    });
    const result = await response.json();
    if (!response.ok) {
      setCreateError(result.error || "Falha ao criar escritório.");
      setCreateSaving(false);
      return;
    }
    setCreateOpen(false);
    setCreateForm(emptyCreateForm);
    setCreateSaving(false);
    await load();
  }

  function openEdit(empresa: Empresa) {
    setEditingEmpresa(empresa);
    setEditForm({
      nome: empresa.nome || "",
      cnpj: empresa.cnpj || "",
      email: empresa.email || "",
      telefone: empresa.telefone || "",
      endereco: empresa.endereco || "",
      cidade: empresa.cidade || "",
      uf: empresa.uf || "",
      plano: empresa.plano || "free",
    });
    setEditError("");
    setEditOpen(true);
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingEmpresa) return;
    setEditSaving(true);
    setEditError("");
    const response = await fetch(`/api/admin/empresas/${editingEmpresa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const result = await response.json();
    if (!response.ok) {
      setEditError(result.error || "Falha ao salvar.");
      setEditSaving(false);
      return;
    }
    setEditOpen(false);
    setEditingEmpresa(null);
    setEditSaving(false);
    await load();
  }

  async function toggle(empresa: Empresa) {
    const msg = empresa.ativo
      ? "Tem certeza que deseja suspender este escritório? Todas as sessões ativas serão revogadas."
      : "Deseja reativar este escritório?";
    if (!confirm(msg)) return;
    await fetch(`/api/admin/empresas/${empresa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !empresa.ativo }),
    });
    await load();
  }

  async function retry(empresa: Empresa) {
    await fetch(`/api/admin/empresas/${empresa.id}/ativar`, { method: "POST" });
    await load();
  }

  async function deleteEmpresa(empresa: Empresa) {
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o escritório "${empresa.nome}"? Todos os dados (usuários, processos, documentos) serão removidos. Esta ação não pode ser desfeita.`)) return;
    setDeletingId(empresa.id);
    try {
      const response = await fetch(`/api/admin/empresas/${empresa.id}`, { method: "DELETE" });
      if (response.ok) {
        await load();
      } else {
        const result = await response.json();
        alert(result.error || "Falha ao excluir escritório.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setBusca("");
    setFiltroUf("");
    setFiltroPlano("");
  }

  const hasFilters = busca || filtroUf || filtroPlano;

  function statusBadge(empresa: Empresa) {
    if (empresa.provisionamentoStatus === "FALHA")
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Falha</Badge>;
    if (empresa.ativo)
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>;
    return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Suspenso</Badge>;
  }

  function planoBadge(plano: string) {
    const colors: Record<string, string> = {
      free: "bg-slate-100 text-slate-600",
      basic: "bg-blue-100 text-blue-700",
      pro: "bg-violet-100 text-violet-700",
      enterprise: "bg-amber-100 text-amber-700",
    };
    return (
      <Badge className={`${colors[plano] || colors.free} hover:${colors[plano] || colors.free}`}>
        {plano}
      </Badge>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-extrabold">Escritórios</h1>
            <p className="mt-1 text-sm text-slate-500">
              Ambientes independentes dos clientes LEXO.
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateForm(emptyCreateForm);
              setCreateError("");
              setCreateOpen(true);
            }}
          >
            <Plus /> Novo escritório
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nome, CNPJ ou e-mail"
              className="pl-10"
            />
          </div>
          <Select value={filtroUf} onValueChange={(v) => setFiltroUf(v ?? "")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {UF_LIST.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroPlano} onValueChange={(v) => setFiltroPlano(v ?? "")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PLANOS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : empresas.length === 0 ? (
          <div className="rounded-2xl border bg-white py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {hasFilters ? "Nenhum escritório encontrado com esses filtros." : "Nenhum escritório cadastrado."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Usuários</TableHead>
                  <TableHead className="text-center">Processos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold">{empresa.nome}</p>
                          {empresa.cnpj && (
                            <p className="text-xs text-slate-500">{empresa.cnpj}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{empresa.email || "—"}</p>
                      <p className="text-xs text-slate-500">{empresa.telefone || ""}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {empresa.cidade && empresa.uf
                          ? `${empresa.cidade}/${empresa.uf}`
                          : empresa.uf || "—"}
                      </p>
                    </TableCell>
                    <TableCell>{planoBadge(empresa.plano)}</TableCell>
                    <TableCell>{statusBadge(empresa)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{empresa._count.usuarios}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{empresa._count.processos}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => openEdit(empresa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {empresa.provisionamentoStatus === "FALHA" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            title="Reativar provisionamento"
                            onClick={() => retry(empresa)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${empresa.ativo ? "text-red-600" : "text-emerald-600"}`}
                            title={empresa.ativo ? "Suspender" : "Reativar"}
                            onClick={() => toggle(empresa)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir permanentemente"
                          disabled={deletingId === empresa.id}
                          onClick={() => deleteEmpresa(empresa)}
                        >
                          {deletingId === empresa.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ativar novo escritório</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Escritório" value={createForm.nome} required onChange={(v) => setCreateForm({ ...createForm, nome: v })} />
              <CpfCnpjInput tipo="CNPJ" value={createForm.cnpj} onChange={(v) => setCreateForm({ ...createForm, cnpj: v })} label="CNPJ" />
              <FormField label="E-mail do escritório" type="email" value={createForm.email} required onChange={(v) => setCreateForm({ ...createForm, email: v })} />
              <FormField label="Telefone" value={createForm.telefone} onChange={(v) => setCreateForm({ ...createForm, telefone: v })} />
              <FormField label="Endereço" value={createForm.endereco} onChange={(v) => setCreateForm({ ...createForm, endereco: v })} />
              <div className="flex gap-3">
                <div className="w-20">
                  <Label className="text-sm font-bold">UF</Label>
                  <Select value={createForm.uf} onValueChange={(v) => setCreateForm({ ...createForm, uf: v === "all" ? "" : (v ?? "") })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">—</SelectItem>
                      {UF_LIST.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <FormField label="Cidade" value={createForm.cidade} onChange={(v) => setCreateForm({ ...createForm, cidade: v })} />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-extrabold">Usuário master</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <FormField label="Nome" value={createForm.masterNome} required onChange={(v) => setCreateForm({ ...createForm, masterNome: v })} />
                <FormField label="E-mail" type="email" value={createForm.masterEmail} required onChange={(v) => setCreateForm({ ...createForm, masterEmail: v })} />
                <FormField label="Telefone" value={createForm.masterTelefone} onChange={(v) => setCreateForm({ ...createForm, masterTelefone: v })} />
              </div>
            </div>
            {createError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={createSaving} onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSaving}>
                {createSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar ambiente e convidar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar escritório</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome" value={editForm.nome} required onChange={(v) => setEditForm({ ...editForm, nome: v })} />
              <CpfCnpjInput tipo="CNPJ" value={editForm.cnpj} onChange={(v) => setEditForm({ ...editForm, cnpj: v })} label="CNPJ" />
              <FormField label="E-mail" type="email" value={editForm.email} required onChange={(v) => setEditForm({ ...editForm, email: v })} />
              <FormField label="Telefone" value={editForm.telefone} onChange={(v) => setEditForm({ ...editForm, telefone: v })} />
              <FormField label="Endereço" value={editForm.endereco} onChange={(v) => setEditForm({ ...editForm, endereco: v })} />
              <div className="flex gap-3">
                <div className="w-20">
                  <Label className="text-sm font-bold">UF</Label>
                   <Select value={editForm.uf} onValueChange={(v) => setEditForm({ ...editForm, uf: v === "all" ? "" : (v ?? "") })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">—</SelectItem>
                      {UF_LIST.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <FormField label="Cidade" value={editForm.cidade} onChange={(v) => setEditForm({ ...editForm, cidade: v })} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-bold">Plano</Label>
                 <Select value={editForm.plano} onValueChange={(v) => setEditForm({ ...editForm, plano: v ?? "free" })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANOS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{editError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={editSaving} onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function FormField({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-bold">{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2"
      />
    </div>
  );
}
