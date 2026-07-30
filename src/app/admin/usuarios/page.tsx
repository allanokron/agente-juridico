"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, UserRound } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  clerkId?: string | null;
  clerkInvitationId?: string | null;
  ultimoAcesso?: string | null;
  empresa: { id: string; nome: string; ativo: boolean };
};
type Empresa = { id: string; nome: string; ativo: boolean };

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ empresaId: "", nome: "", email: "", telefone: "", role: "ASSISTENTE" });

  async function load() {
    const [usersResponse, companiesResponse] = await Promise.all([
      fetch("/api/admin/usuarios"),
      fetch("/api/admin/empresas"),
    ]);
    setUsuarios(await usersResponse.json());
    setEmpresas(await companiesResponse.json());
  }
  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/usuarios").then((response) => response.json()),
      fetch("/api/admin/empresas").then((response) => response.json()),
    ]).then(([users, companies]) => {
      setUsuarios(users);
      setEmpresas(companies);
    });
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return usuarios.filter((user) => `${user.nome} ${user.email} ${user.empresa.nome}`.toLowerCase().includes(term));
  }, [usuarios, search]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Falha ao enviar convite");
      setSaving(false);
      return;
    }
    setOpen(false);
    setForm({ empresaId: "", nome: "", email: "", telefone: "", role: "ASSISTENTE" });
    setSaving(false);
    await load();
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><h1 className="text-2xl font-extrabold">Usuários da plataforma</h1><p className="mt-1 text-sm text-slate-500">Convites e acessos separados por escritório.</p></div>
          <Button onClick={() => setOpen(true)}><Plus /> Novo usuário</Button>
        </div>
        <div className="relative max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuário ou escritório" className="pl-11" /></div>
        <div className="overflow-hidden rounded-2xl border bg-white">
          {filtered.map((user) => (
            <div key={user.id} className="grid gap-3 border-b p-4 sm:grid-cols-[1.4fr_1fr_.7fr_.6fr] sm:items-center">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50"><UserRound className="h-5 w-5 text-violet-600" /></div><div><p className="font-bold">{user.nome}</p><p className="text-sm text-slate-500">{user.email}</p></div></div>
              <p className="text-sm font-semibold">{user.empresa.nome}</p>
              <p className="text-sm">{user.role.replaceAll("_", " ")}</p>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${user.ativo ? "bg-emerald-50 text-emerald-700" : user.clerkInvitationId ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{user.ativo ? "Ativo" : user.clerkInvitationId ? "Convidado" : "Inativo"}</span>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => !saving && setOpen(false)}>
          <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-extrabold">Convidar usuário</h2>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold">Escritório<select required value={form.empresaId} onChange={(event) => setForm({ ...form, empresaId: event.target.value })} className="mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal"><option value="">Selecione</option>{empresas.filter((item) => item.ativo).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
              <ModalInput label="Nome" value={form.nome} onChange={(value) => setForm({ ...form, nome: value })} />
              <ModalInput label="E-mail" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
              <ModalInput label="Telefone" required={false} value={form.telefone} onChange={(value) => setForm({ ...form, telefone: value })} />
              <label className="block text-sm font-bold">Função<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal"><option value="ADMINISTRADOR">Administrador</option><option value="ADVOGADO">Advogado</option><option value="ASSISTENTE">Assistente</option><option value="ESTAGIARIO">Estagiário</option></select></label>
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Enviar convite</Button></div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

function ModalInput({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm font-bold">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border px-4 font-normal outline-none focus:border-violet-500" /></label>;
}
