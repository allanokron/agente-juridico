"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Empresa = {
  id: string;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  provisionamentoStatus: string;
  provisionamentoErro?: string | null;
  createdAt: string;
  masterUser?: { nome: string; email: string; ativo: boolean } | null;
  _count: { usuarios: number; processos: number; documentos: number };
};

const emptyForm = {
  leadId: "",
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  masterNome: "",
  masterEmail: "",
  masterTelefone: "",
};

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/empresas");
    setEmpresas(await response.json());
  }

  useEffect(() => {
    void fetch("/api/admin/empresas")
      .then((response) => response.json())
      .then(setEmpresas);
    const leadId = new URLSearchParams(window.location.search).get("lead");
    if (leadId) {
      fetch(`/api/admin/leads/${leadId}`)
        .then((response) => response.json())
        .then((lead) => {
          setForm({
            ...emptyForm,
            leadId,
            nome: lead.escritorio || "",
            email: lead.email || "",
            telefone: lead.whatsapp || "",
            masterNome: lead.nomeContato || "",
            masterEmail: lead.email || "",
            masterTelefone: lead.whatsapp || "",
          });
          setOpen(true);
        });
    }
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return empresas.filter((empresa) =>
      `${empresa.nome} ${empresa.cnpj} ${empresa.email}`.toLowerCase().includes(term)
    );
  }, [empresas, search]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/admin/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, leadId: form.leadId || null }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Falha ao criar escritório.");
      setSaving(false);
      await load();
      return;
    }
    setOpen(false);
    setForm(emptyForm);
    setSaving(false);
    await load();
  }

  async function toggle(empresa: Empresa) {
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

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-extrabold">Escritórios</h1>
            <p className="mt-1 text-sm text-slate-500">Ambientes independentes dos clientes LEXO.</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setError(""); setOpen(true); }}><Plus /> Novo escritório</Button>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, CNPJ ou e-mail" className="pl-11" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((empresa) => (
            <article key={empresa.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-extrabold">{empresa.nome}</h2>
                    <p className="mt-1 text-sm text-slate-500">{empresa.email || "Sem e-mail"}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${empresa.ativo ? "bg-emerald-50 text-emerald-700" : empresa.provisionamentoStatus === "FALHA" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                  {empresa.provisionamentoStatus === "FALHA" ? "Falha" : empresa.ativo ? "Ativo" : "Suspenso"}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center">
                <div><Users className="mx-auto h-4 w-4 text-slate-400" /><p className="mt-1 font-extrabold">{empresa._count.usuarios}</p><p className="text-[11px] text-slate-500">usuários</p></div>
                <div><ShieldCheck className="mx-auto h-4 w-4 text-slate-400" /><p className="mt-1 font-extrabold">{empresa._count.processos}</p><p className="text-[11px] text-slate-500">processos</p></div>
                <div><Building2 className="mx-auto h-4 w-4 text-slate-400" /><p className="mt-1 font-extrabold">{empresa.masterUser ? 1 : 0}</p><p className="text-[11px] text-slate-500">master</p></div>
              </div>
              {empresa.masterUser && <p className="mt-4 text-sm"><strong>Master:</strong> {empresa.masterUser.nome} · {empresa.masterUser.email}</p>}
              {empresa.provisionamentoErro && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{empresa.provisionamentoErro}</p>}
              {empresa.provisionamentoStatus === "FALHA" ? (
                <Button className="mt-4 w-full" onClick={() => retry(empresa)}>
                  Tentar provisionamento novamente
                </Button>
              ) : (
                <Button variant="outline" className="mt-4 w-full" onClick={() => toggle(empresa)}>
                  {empresa.ativo ? "Suspender acessos" : "Reativar escritório"}
                </Button>
              )}
            </article>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => !saving && setOpen(false)}>
          <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-extrabold">Ativar novo escritório</h2>
            <p className="mt-1 text-sm text-slate-500">O convite do usuário master será enviado após a criação segura do ambiente.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FormInput label="Escritório" value={form.nome} required onChange={(value) => setForm({ ...form, nome: value })} />
              <FormInput label="CNPJ" value={form.cnpj} onChange={(value) => setForm({ ...form, cnpj: value })} />
              <FormInput label="E-mail do escritório" type="email" value={form.email} required onChange={(value) => setForm({ ...form, email: value })} />
              <FormInput label="Telefone" value={form.telefone} onChange={(value) => setForm({ ...form, telefone: value })} />
              <div className="sm:col-span-2"><FormInput label="Endereço" value={form.endereco} onChange={(value) => setForm({ ...form, endereco: value })} /></div>
            </div>
            <h3 className="mt-7 font-extrabold">Usuário master</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormInput label="Nome" value={form.masterNome} required onChange={(value) => setForm({ ...form, masterNome: value })} />
              <FormInput label="E-mail" type="email" value={form.masterEmail} required onChange={(value) => setForm({ ...form, masterEmail: value })} />
              <FormInput label="Telefone" value={form.masterTelefone} onChange={(value) => setForm({ ...form, masterTelefone: value })} />
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-7 flex justify-end gap-3">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Criar ambiente e convidar</Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

function FormInput({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="block text-sm font-bold">{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border px-4 font-normal outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>;
}
