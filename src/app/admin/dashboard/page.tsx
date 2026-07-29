"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  Users, 
  FileText, 
  Building2,
  Activity,
  HardDrive,
  Clock,
  TrendingUp
} from "lucide-react";

const recentAccess = [
  { usuario: "Dr. João Silva", empresa: "Escritório Silva & Associados", data: "Hoje, 09:30" },
  { usuario: "Dra. Ana Santos", empresa: "Silva & Associados", data: "Hoje, 08:15" },
  { usuario: "Pedro Costa", empresa: "Advocacia Costa", data: "Ontem, 17:45" },
  { usuario: "Maria Oliveira", empresa: "Oliveira Advocacia", data: "Ontem, 16:20" },
  { usuario: "Carlos Mendes", empresa: "Mendes & Filhos", data: "15/01, 14:30" },
];

export default function AdminDashboardPage() {
  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão geral da plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Escritórios"
            value={42}
            icon={Building2}
            trend="up"
            trendValue="+5 este mês"
          />
          <StatsCard
            title="Usuários"
            value={187}
            icon={Users}
            trend="up"
            trendValue="+23 este mês"
          />
          <StatsCard
            title="Processos"
            value={1243}
            icon={Briefcase}
            trend="up"
            trendValue="+156 este mês"
          />
          <StatsCard
            title="Documentos"
            value={4567}
            icon={FileText}
            trend="up"
            trendValue="+389 este mês"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Notificações"
            value={89}
            icon={Activity}
          />
          <StatsCard
            title="Uso do Sistema"
            value="78%"
            icon={TrendingUp}
            description="da capacidade"
          />
          <StatsCard
            title="Espaço Utilizado"
            value="45 GB"
            icon={HardDrive}
            description="de 100 GB"
          />
          <StatsCard
            title="Acessos Hoje"
            value={156}
            icon={Clock}
            trend="up"
            trendValue="+12 vs ontem"
          />
        </div>

        {/* Recent Access */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Últimos Acessos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAccess.map((access, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">
                        {access.usuario.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{access.usuario}</p>
                      <p className="text-xs text-slate-500">{access.empresa}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{access.data}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">API</span>
                <span className="text-sm font-medium text-emerald-600">Operacional</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Banco de Dados</span>
                <span className="text-sm font-medium text-emerald-600">Operacional</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Armazenamento</span>
                <span className="text-sm font-medium text-emerald-600">Operacional</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Autenticação</span>
                <span className="text-sm font-medium text-emerald-600">Operacional</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Plano Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">Enterprise</p>
                <p className="text-sm text-slate-500">Plano ativo</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Usuários</span>
                  <span className="font-medium">187 / 500</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Processos</span>
                  <span className="font-medium">1.243 / Ilimitado</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Armazenamento</span>
                  <span className="font-medium">45 GB / 100 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
