"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Edit,
  Loader2,
  Mail,
  Plus,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  role: string;
  ativo: boolean;
  clerkId?: string | null;
  clerkInvitationId?: string | null;
  conviteEnviadoEm?: string | null;
  ultimoAcesso?: string | null;
  empresa: { id: string; nome: string; ativo: boolean };
};

type Empresa = { id: string; nome: string; ativo: boolean };

const ROLES = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "ADVOGADO", label: "Advogado" },
  { value: "ASSISTENTE", label: "Assistente" },
  { value: "ESTAGIARIO", label: "Estagiário" },
];

const emptyCreateForm = {
  empresaId: "",
  nome: "",
  email: "",
  telefone: "",
  role: "ASSISTENTE",
};

const emptyEditForm = {
  nome: "",
  email: "",
  telefone: "",
  role: "ASSISTENTE",
};

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const [resendingId, setResendingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEmpresa) params.set("empresaId", filtroEmpresa);
    if (busca) params.set("busca", busca);
    const qs = params.toString();

    const [usersRes, companiesRes] = await Promise.all([
      fetch(`/api/admin/usuarios${qs ? `?${qs}` : ""}`),
      fetch("/api/admin/empresas"),
    ]);
    setUsuarios(await usersRes.json());
    setEmpresas(await companiesRes.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [busca, filtroEmpresa]);

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    setCreateSaving(true);
    setCreateError("");
    const response = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const result = await response.json();
    if (!response.ok) {
      setCreateError(result.error || "Falha ao enviar convite");
      setCreateSaving(false);
      return;
    }
    setCreateOpen(false);
    setCreateForm(emptyCreateForm);
    setCreateSaving(false);
    await load();
  }

  function openEdit(usuario: Usuario) {
    setEditingUser(usuario);
    setEditForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      telefone: usuario.telefone || "",
      role: usuario.role || "ASSISTENTE",
    });
    setEditError("");
    setEditOpen(true);
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    setEditError("");
    const response = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
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
    setEditingUser(null);
    setEditSaving(false);
    await load();
  }

  async function resendInvite(usuario: Usuario) {
    if (!confirm(`Reenviar convite para ${usuario.email}?`)) return;
    setResendingId(usuario.id);
    const response = await fetch(`/api/admin/usuarios/${usuario.id}/convite`, {
      method: "POST",
    });
    setResendingId(null);
    if (response.ok) {
      await load();
    } else {
      const result = await response.json();
      alert(result.error || "Falha ao reenviar convite");
    }
  }

  async function toggle(usuario: Usuario) {
    const msg = usuario.ativo
      ? "Tem certeza que deseja desativar este usuário? As sessões ativas serão revogadas."
      : "Deseja reativar este usuário?";
    if (!confirm(msg)) return;
    await fetch(`/api/admin/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !usuario.ativo }),
    });
    await load();
  }

  function clearFilters() {
    setBusca("");
    setFiltroEmpresa("");
  }

  const hasFilters = busca || filtroEmpresa;

  function statusBadge(usuario: Usuario) {
    if (usuario.ativo)
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>;
    if (usuario.clerkInvitationId)
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Convidado</Badge>;
    return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Inativo</Badge>;
  }

  function roleBadge(role: string) {
    const colors: Record<string, string> = {
      ADMINISTRADOR: "bg-violet-100 text-violet-700",
      ADVOGADO: "bg-blue-100 text-blue-700",
      ASSISTENTE: "bg-slate-100 text-slate-600",
      ESTAGIARIO: "bg-orange-100 text-orange-700",
    };
    return (
      <Badge className={`${colors[role] || colors.ASSISTENTE} hover:${colors[role] || colors.ASSISTENTE}`}>
        {role.replaceAll("_", " ")}
      </Badge>
    );
  }

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-extrabold">Usuários da plataforma</h1>
            <p className="mt-1 text-sm text-slate-500">
              Convites e acessos separados por escritório.
            </p>
          </div>
          <Button onClick={() => { setCreateForm(emptyCreateForm); setCreateError(""); setCreateOpen(true); }}>
            <Plus /> Novo usuário
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone"
              className="pl-10"
            />
          </div>
          <Select value={filtroEmpresa} onValueChange={(v) => setFiltroEmpresa(v ?? "")}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Escritório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
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
        ) : usuarios.length === 0 ? (
          <div className="rounded-2xl border bg-white py-16 text-center">
            <UserRound className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {hasFilters ? "Nenhum usuário encontrado com esses filtros." : "Nenhum usuário cadastrado."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50">
                          <UserRound className="h-4 w-4 text-violet-600" />
                        </div>
                        <span className="font-semibold">{usuario.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{usuario.email}</TableCell>
                    <TableCell className="text-sm">{usuario.telefone || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{usuario.empresa.nome}</span>
                    </TableCell>
                    <TableCell>{roleBadge(usuario.role)}</TableCell>
                    <TableCell>{statusBadge(usuario)}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(usuario.ultimoAcesso)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!usuario.clerkId && usuario.clerkInvitationId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            title="Reenviar convite"
                            disabled={resendingId === usuario.id}
                            onClick={() => resendInvite(usuario)}
                          >
                            {resendingId === usuario.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => openEdit(usuario)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${usuario.ativo ? "text-red-600" : "text-emerald-600"}`}
                          title={usuario.ativo ? "Desativar" : "Reativar"}
                          onClick={() => toggle(usuario)}
                        >
                          {usuario.ativo ? "✕" : "✓"}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <Label className="text-sm font-bold">Escritório</Label>
              <Select
                value={createForm.empresaId}
                onValueChange={(v) => setCreateForm({ ...createForm, empresaId: v === "all" ? "" : (v ?? "") })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Selecione</SelectItem>
                  {empresas.filter((e) => e.ativo).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormField label="Nome" value={createForm.nome} required onChange={(v) => setCreateForm({ ...createForm, nome: v })} />
            <FormField label="E-mail" type="email" value={createForm.email} required onChange={(v) => setCreateForm({ ...createForm, email: v })} />
            <FormField label="Telefone" value={createForm.telefone} onChange={(v) => setCreateForm({ ...createForm, telefone: v })} />
            <div>
              <Label className="text-sm font-bold">Função</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v ?? "ASSISTENTE" })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={createSaving} onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSaving}>
                {createSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <FormField label="Nome" value={editForm.nome} required onChange={(v) => setEditForm({ ...editForm, nome: v })} />
            <FormField label="E-mail" type="email" value={editForm.email} required onChange={(v) => setEditForm({ ...editForm, email: v })} />
            <FormField label="Telefone" value={editForm.telefone} onChange={(v) => setEditForm({ ...editForm, telefone: v })} />
            <div>
              <Label className="text-sm font-bold">Função</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v ?? "ASSISTENTE" })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
