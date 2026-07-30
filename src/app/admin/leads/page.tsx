"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Columns3, List, Loader2, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statuses = ["NOVO", "EM_CONTATO", "QUALIFICADO", "PROPOSTA", "GANHO", "PERDIDO"] as const;
const labels: Record<string, string> = {
  NOVO: "Novo",
  EM_CONTATO: "Em contato",
  QUALIFICADO: "Qualificado",
  PROPOSTA: "Proposta",
  GANHO: "Ganho",
  PERDIDO: "Perdido",
};

type Lead = {
  id: string;
  nomeContato: string;
  escritorio: string;
  email: string;
  whatsapp: string;
  cidade?: string | null;
  uf?: string | null;
  tamanhoEquipe?: string | null;
  volumeProcessos?: string | null;
  mensagem?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  empresaConvertida?: { id: string; nome: string } | null;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"pipeline" | "lista">("pipeline");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/leads");
    setLeads(await response.json());
    setLoading(false);
  }
  useEffect(() => {
    void fetch("/api/admin/leads")
      .then((response) => response.json())
      .then((items) => {
        setLeads(items);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return leads.filter((lead) =>
      `${lead.nomeContato} ${lead.escritorio} ${lead.email} ${lead.whatsapp}`.toLowerCase().includes(term)
    );
  }, [leads, search]);

  async function changeStatus(lead: Lead, status: string) {
    setSaving(true);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSelected((current) => current?.id === lead.id ? { ...current, status } : current);
    await load();
    setSaving(false);
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-extrabold">CRM de leads</h1>
            <p className="mt-1 text-sm text-slate-500">Contatos recebidos pela home da LEXO.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={view === "pipeline" ? "default" : "outline"} onClick={() => setView("pipeline")}><Columns3 /> Pipeline</Button>
            <Button variant={view === "lista" ? "default" : "outline"} onClick={() => setView("lista")}><List /> Lista</Button>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar contato, escritório ou telefone" className="pl-11" />
        </div>
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-violet-600" /></div>
        ) : view === "pipeline" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => {
              const items = filtered.filter((lead) => lead.status === status);
              return (
                <section key={status} className="min-w-[285px] flex-1 rounded-2xl bg-slate-100 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-sm font-extrabold">{labels[status]}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((lead) => (
                      <button key={lead.id} onClick={() => setSelected(lead)} className="w-full rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-violet-300">
                        <p className="font-bold">{lead.escritorio}</p>
                        <p className="mt-1 text-sm text-slate-600">{lead.nomeContato}</p>
                        <p className="mt-3 text-xs text-slate-400">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</p>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white">
            {filtered.map((lead) => (
              <button key={lead.id} onClick={() => setSelected(lead)} className="grid w-full gap-2 border-b p-4 text-left hover:bg-slate-50 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
                <div><p className="font-bold">{lead.escritorio}</p><p className="text-sm text-slate-500">{lead.nomeContato}</p></div>
                <p className="text-sm">{lead.email}</p>
                <p className="text-sm">{lead.whatsapp}</p>
                <span className="text-xs font-bold text-violet-700">{labels[lead.status] || lead.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onMouseDown={() => setSelected(null)}>
          <aside className="h-full w-full max-w-lg overflow-y-auto bg-white p-7 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="text-sm font-bold text-slate-500">← Fechar</button>
            <h2 className="mt-6 text-2xl font-extrabold">{selected.escritorio}</h2>
            <p className="mt-1 text-slate-500">{selected.nomeContato}</p>
            <div className="mt-7 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm">
              <p><strong>E-mail:</strong> {selected.email}</p>
              <p><strong>WhatsApp:</strong> {selected.whatsapp}</p>
              <p><strong>Local:</strong> {[selected.cidade, selected.uf].filter(Boolean).join(" / ") || "Não informado"}</p>
              <p><strong>Equipe:</strong> {selected.tamanhoEquipe || "Não informado"}</p>
              <p><strong>Processos:</strong> {selected.volumeProcessos || "Não informado"}</p>
              {selected.mensagem && <p><strong>Mensagem:</strong><br />{selected.mensagem}</p>}
            </div>
            <label className="mt-6 block text-sm font-bold">Etapa comercial
              <select value={selected.status} disabled={saving} onChange={(event) => changeStatus(selected, event.target.value)} className="mt-2 h-12 w-full rounded-xl border bg-white px-4">
                {statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}
              </select>
            </label>
            {!selected.empresaConvertida && (
              <a href={`/admin/empresas?lead=${selected.id}`} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 font-bold text-white">
                <Building2 className="h-4 w-4" /> Converter em escritório
              </a>
            )}
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
