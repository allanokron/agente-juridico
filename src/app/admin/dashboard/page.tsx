"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Handshake, Target, UserRoundSearch, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardData = {
  empresas: number;
  empresasAtivas: number;
  usuarios: number;
  processos: number;
  leads: number;
  leadsNovos: number;
  leadsEmNegociacao: number;
  leadsGanhos: number;
  leadsPerdidos: number;
  conversoesMes: number;
  recentes: Array<{
    id: string;
    nomeContato: string;
    escritorio: string;
    status: string;
    createdAt: string;
  }>;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((response) => response.json())
      .then(setData);
  }, []);

  const stats = [
    { label: "Leads Novos", value: data?.leadsNovos ?? "—", detail: "aguardando contato", icon: UserRoundSearch },
    { label: "Em Negociação", value: data?.leadsEmNegociacao ?? "—", detail: "contato em andamento", icon: Handshake },
    { label: "Convertidos", value: data?.leadsGanhos ?? "—", detail: "escritórios ativados", icon: CheckCircle2 },
    { label: "Escritórios Ativos", value: data?.empresasAtivas ?? "—", detail: `${data?.empresas ?? 0} cadastrados`, icon: Building2 },
    { label: "Total de Leads", value: data?.leads ?? "—", detail: "base completa", icon: Target },
  ];

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visão geral da LEXO</h1>
          <p className="mt-1 text-sm text-slate-500">Pipeline comercial e escritórios ativos.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <stat.icon className="h-5 w-5 text-violet-600" />
                <p className="mt-5 text-3xl font-extrabold">{stat.value}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leads recentes</CardTitle>
            <Link href="/admin/leads" className="text-sm font-bold text-violet-700">Abrir CRM →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentes?.length ? data.recentes.map((lead) => (
              <Link key={lead.id} href={`/admin/leads?lead=${lead.id}`} className="flex items-center justify-between rounded-xl border p-4 hover:bg-slate-50">
                <div>
                  <p className="font-bold">{lead.escritorio}</p>
                  <p className="text-sm text-slate-500">{lead.nomeContato}</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{lead.status.replaceAll("_", " ")}</span>
              </Link>
            )) : <p className="py-10 text-center text-sm text-slate-500">Nenhum lead recebido ainda.</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
