"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Building2, User, Bell, Shield, Loader2, Tag, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface EmpresaData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
}

interface PerfilData {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  avatar: string | null;
}

const initialEmpresa: EmpresaData = {
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
};

const initialPerfil: PerfilData = {
  nome: "",
  email: "",
  telefone: "",
  cargo: "",
  avatar: null,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMINISTRADOR";

  const [empresa, setEmpresa] = useState<EmpresaData>(initialEmpresa);
  const [perfil, setPerfil] = useState<PerfilData>(initialPerfil);
  const [empresaSaving, setEmpresaSaving] = useState(false);
  const [perfilSaving, setPerfilSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    prazos: true,
    documentos: true,
  });
  const [tiposProcesso, setTiposProcesso] = useState<{ id: string; valor: string; label: string }[]>([]);
  const [novoTipoValor, setNovoTipoValor] = useState("");
  const [tipoSaving, setTipoSaving] = useState(false);

  const defaultTab = isManager ? "empresa" : "perfil";

  const fetchTipos = useCallback(async () => {
    if (!user?.empresaId) return;
    try {
      const res = await fetch(`/api/tipos-processo?empresaId=${user.empresaId}`);
      if (res.ok) {
        const data = await res.json();
        setTiposProcesso(data);
      }
    } catch {
      // silent
    }
  }, [user?.empresaId]);

  const handleAddTipo = async () => {
    if (!novoTipoValor.trim() || !user?.empresaId) return;
    setTipoSaving(true);
    try {
      const valor = novoTipoValor.trim().toUpperCase().replace(/\s+/g, "_");
      const label = valor
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await fetch("/api/tipos-processo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: user.empresaId,
          valor,
          label,
        }),
      });
      if (res.ok) {
        setNovoTipoValor("");
        fetchTipos();
      }
    } catch {
      // silent
    } finally {
      setTipoSaving(false);
    }
  };

  const handleDeleteTipo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tipo?")) return;
    try {
      const res = await fetch(`/api/tipos-processo/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTipos();
      }
    } catch {
      // silent
    }
  };

  const fetchEmpresa = useCallback(async () => {
    if (!user?.empresaId) return;
    try {
      const res = await fetch(`/api/empresas/${user.empresaId}`);
      if (res.ok) {
        const data = await res.json();
        setEmpresa({
          nome: data.nome ?? "",
          cnpj: data.cnpj ?? "",
          email: data.email ?? "",
          telefone: data.telefone ?? "",
          endereco: data.endereco ?? "",
        });
      }
    } catch {
      // silent
    }
  }, [user?.empresaId]);

  const fetchPerfil = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/usuarios/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPerfil({
          nome: data.nome ?? "",
          email: data.email ?? "",
          telefone: data.telefone ?? "",
          cargo: data.cargo?.nome ?? "",
          avatar: data.avatar ?? null,
        });
      }
    } catch {
      // silent
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEmpresa();
    fetchPerfil();
    fetchTipos();
  }, [fetchEmpresa, fetchPerfil, fetchTipos]);

  const handleSaveEmpresa = async () => {
    if (!user?.empresaId) return;
    setEmpresaSaving(true);
    try {
      const res = await fetch(`/api/empresas/${user.empresaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      if (res.ok) {
        fetchEmpresa();
      }
    } catch {
      // silent
    } finally {
      setEmpresaSaving(false);
    }
  };

  const handleSavePerfil = async () => {
    if (!user?.id) return;
    setPerfilSaving(true);
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: perfil.nome,
          email: perfil.email,
          telefone: perfil.telefone,
          avatar: perfil.avatar,
        }),
      });
      if (res.ok) {
        fetchPerfil();
      }
    } catch {
      // silent
    } finally {
      setPerfilSaving(false);
    }
  };

  const handleAvatarUpload = async (base64: string) => {
    if (!user?.id) return;
    setPerfil((prev) => ({ ...prev, avatar: base64 }));
    try {
      await fetch(`/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: base64 }),
      });
    } catch {
      // silent
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Configurações"
          description="Gerencie as configurações do escritório"
        />

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            {isManager && (
              <TabsTrigger value="empresa" className="gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
            )}
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value="tipos" className="gap-2">
                <Tag className="h-4 w-4" />
                Tipos de Processo
              </TabsTrigger>
            )}
          </TabsList>

          {/* Empresa Tab */}
          {isManager && (
            <TabsContent value="empresa">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                  <CardDescription>
                    Atualize as informações do seu escritório
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="empresa-nome">Nome do Escritório</Label>
                      <Input
                        id="empresa-nome"
                        value={empresa.nome}
                        onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                        placeholder="Nome do escritório"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="empresa-cnpj">CNPJ</Label>
                      <Input
                        id="empresa-cnpj"
                        value={empresa.cnpj}
                        onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="empresa-email">Email</Label>
                      <Input
                        id="empresa-email"
                        type="email"
                        value={empresa.email}
                        onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                        placeholder="contato@escritorio.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="empresa-telefone">Telefone</Label>
                      <Input
                        id="empresa-telefone"
                        value={empresa.telefone}
                        onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="empresa-endereco">Endereço</Label>
                    <Input
                      id="empresa-endereco"
                      value={empresa.endereco}
                      onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveEmpresa}
                      disabled={empresaSaving}
                      className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
                    >
                      {empresaSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Perfil Tab */}
          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <AvatarUpload
                    avatar={perfil.avatar}
                    initials={getInitials(perfil.nome || "U")}
                    onUpload={handleAvatarUpload}
                  />
                  <div>
                    <p className="font-medium text-foreground">{perfil.nome}</p>
                    <p className="text-sm text-muted-foreground">{perfil.email}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="perfil-nome">Nome</Label>
                    <Input
                      id="perfil-nome"
                      value={perfil.nome}
                      onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="perfil-email">Email</Label>
                    <Input
                      id="perfil-email"
                      type="email"
                      value={perfil.email}
                      onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                      placeholder="Seu email"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="perfil-telefone">Telefone</Label>
                    <Input
                      id="perfil-telefone"
                      value={perfil.telefone}
                      onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                      placeholder="Seu telefone"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="perfil-cargo">Cargo</Label>
                    <Input
                      id="perfil-cargo"
                      value={perfil.cargo}
                      disabled
                      placeholder="Seu cargo"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePerfil}
                    disabled={perfilSaving}
                    className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
                  >
                    {perfilSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">Receba notificações importantes por email</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotifications((prev) => ({ ...prev, email: !prev.email }))}
                    className={notifications.email ? "bg-[#8B5CF6] text-white hover:bg-[#7C3AED]" : ""}
                  >
                    {notifications.email ? "Ativado" : "Desativado"}
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembretes de Prazo</p>
                    <p className="text-sm text-muted-foreground">Receba lembretes antes de prazos importantes</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotifications((prev) => ({ ...prev, prazos: !prev.prazos }))}
                    className={notifications.prazos ? "bg-[#8B5CF6] text-white hover:bg-[#7C3AED]" : ""}
                  >
                    {notifications.prazos ? "Ativado" : "Desativado"}
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Novos Documentos</p>
                    <p className="text-sm text-muted-foreground">Seja notificado quando novos documentos forem enviados</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotifications((prev) => ({ ...prev, documentos: !prev.documentos }))}
                    className={notifications.documentos ? "bg-[#8B5CF6] text-white hover:bg-[#7C3AED]" : ""}
                  >
                    {notifications.documentos ? "Ativado" : "Desativado"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança Tab */}
          <TabsContent value="seguranca">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alterar Senha</p>
                    <p className="text-sm text-muted-foreground">Atualize sua senha regularmente</p>
                  </div>
                  <Button variant="outline">Alterar</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação em Duas Etapas</p>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessões Ativas</p>
                    <p className="text-sm text-muted-foreground">Gerencie os dispositivos conectados</p>
                  </div>
                  <Button variant="outline">Ver Todas</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tipos de Processo Tab */}
          {isManager && (
            <TabsContent value="tipos">
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Processo</CardTitle>
                  <CardDescription>
                    Adicione ou remova tipos de processo disponíveis no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="grid gap-1.5 flex-1">
                      <Label>Nome do tipo</Label>
                      <Input
                        value={novoTipoValor}
                        onChange={(e) => setNovoTipoValor(e.target.value)}
                        placeholder="Ex: ambiental"
                        className="h-9"
                      />
                    </div>
                    <Button
                      onClick={handleAddTipo}
                      disabled={tipoSaving || !novoTipoValor.trim()}
                      className="bg-[#8B5CF6] hover:bg-[#7C3AED] h-9"
                    >
                      {tipoSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {novoTipoValor.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Será criado como: <span className="font-medium text-foreground">
                        {novoTipoValor.trim().toUpperCase().replace(/\s+/g, "_")}
                      </span>
                      {" → "}
                      <span className="font-medium text-foreground">
                        {novoTipoValor.trim().toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </p>
                  )}
                  <div className="space-y-2">
                    {tiposProcesso.map((tipo) => (
                      <div
                        key={tipo.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{tipo.label}</p>
                          <p className="text-xs text-muted-foreground">{tipo.valor}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDeleteTipo(tipo.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
