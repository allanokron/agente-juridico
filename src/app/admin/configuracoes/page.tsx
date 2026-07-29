"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Globe, Mail, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <PageHeader
          title="Configurações"
          description="Configurações gerais da plataforma"
        />

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList>
            <TabsTrigger value="geral" className="gap-2">
              <Settings className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Globe className="h-4 w-4" />
              API & Integrações
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configure as preferências gerais da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome da Plataforma</Label>
                    <Input id="nome" defaultValue="Agente Jurídico" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL da Plataforma</Label>
                    <Input id="url" defaultValue="https://agentejuridico.com.br" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="suporte">Email de Suporte</Label>
                    <Input id="suporte" defaultValue="suporte@agentejuridico.com.br" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Input id="timezone" defaultValue="America/Sao_Paulo" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>API & Integrações</CardTitle>
                <CardDescription>
                  Gerencie as chaves de API e integrações externas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="clerk">Clerk API Key</Label>
                  <Input id="clerk" type="password" placeholder="pk_live_..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="neon">Neon Database URL</Label>
                  <Input id="neon" type="password" placeholder="postgresql://..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp API Key (Futuro)</Label>
                  <Input id="whatsapp" type="password" placeholder="Configurar futuramente" disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="openai">OpenAI API Key (Futuro)</Label>
                  <Input id="openai" type="password" placeholder="Configurar futuramente" disabled />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Configurações de Email</CardTitle>
                <CardDescription>
                  Configure o envio de emails da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="smtp">Servidor SMTP</Label>
                    <Input id="smtp" placeholder="smtp.gmail.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="port">Porta</Label>
                    <Input id="port" placeholder="587" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email-user">Usuário</Label>
                    <Input id="email-user" placeholder="seu@email.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email-pass">Senha</Label>
                    <Input id="email-pass" type="password" placeholder="Sua senha" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguranca">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Configure as opções de segurança da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação em Duas Etapas</p>
                    <p className="text-sm text-slate-500">Exigir 2FA para todos os administradores</p>
                  </div>
                  <Button variant="outline" size="sm">Ativado</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Bloqueio por Tentativas</p>
                    <p className="text-sm text-slate-500">Bloquear após 5 tentativas incorretas</p>
                  </div>
                  <Button variant="outline" size="sm">Ativado</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessões Simultâneas</p>
                    <p className="text-sm text-slate-500">Limitar sessões por usuário</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
