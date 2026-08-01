"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  Loader2,
  UserCheck,
  UserX,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface Cargo {
  id: string;
  nome: string;
  permissoes: Record<string, boolean>;
  _count?: { usuarios: number };
}

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  role: string;
  avatar?: string | null;
  cargoId?: string | null;
  cargo?: { id: string; nome: string } | null;
  ativo: boolean;
  ultimoAcesso?: string | null;
  clerkId?: string | null;
  clerkInvitationId?: string | null;
  conviteEnviadoEm?: string | null;
}

interface MemberFormData {
  nome: string;
  email: string;
  telefone: string;
  cargoId: string;
  avatar: string | null;
}

interface CargoFormData {
  nome: string;
  permissoes: Record<string, boolean>;
}

const PERMISSION_SECTIONS = [
  {
    title: "Processos",
    permissions: [
      { key: "processos_criar", label: "Criar" },
      { key: "processos_editar", label: "Editar" },
      { key: "processos_excluir", label: "Excluir" },
      { key: "processos_mover_kanban", label: "Mover no Kanban" },
    ],
  },
  {
    title: "Clientes",
    permissions: [
      { key: "clientes_criar", label: "Criar" },
      { key: "clientes_editar", label: "Editar" },
      { key: "clientes_excluir", label: "Excluir" },
    ],
  },
  {
    title: "Documentos",
    permissions: [
      { key: "documentos_anexar", label: "Anexar" },
      { key: "documentos_excluir", label: "Excluir" },
    ],
  },
  {
    title: "Equipe",
    permissions: [
      { key: "equipe_gerenciar", label: "Gerenciar" },
    ],
  },
  {
    title: "Etapas",
    permissions: [
      { key: "etapas_gerenciar", label: "Gerenciar" },
    ],
  },
  {
    title: "Geral",
    permissions: [
      { key: "geral_alterar_datas", label: "Alterar Datas" },
      { key: "geral_visualizar_relatorios", label: "Visualizar Relatórios" },
    ],
  },
];

const initialMemberForm: MemberFormData = {
  nome: "",
  email: "",
  telefone: "",
  cargoId: "",
  avatar: null,
};

const initialCargoForm: CargoFormData = {
  nome: "",
  permissoes: {},
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "ADMINISTRADOR":
      return "bg-purple-100 text-purple-700";
    case "ADVOGADO":
      return "bg-blue-100 text-blue-700";
    case "ASSISTENTE":
      return "bg-emerald-100 text-emerald-700";
    case "ESTAGIARIO":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "ADMINISTRADOR":
      return "Administrador";
    case "ADVOGADO":
      return "Advogado";
    case "ASSISTENTE":
      return "Assistente";
    case "ESTAGIARIO":
      return "Estagiário";
    default:
      return role;
  }
}

function countPermissions(permissoes: Record<string, boolean>) {
  return Object.values(permissoes).filter(Boolean).length;
}

export default function TeamPage() {
  const { user } = useAuth();
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMINISTRADOR";
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("membros");

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormData>(initialMemberForm);
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [cargoForm, setCargoForm] = useState<CargoFormData>(initialCargoForm);
  const [cargoSubmitting, setCargoSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"member" | "cargo" | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCargos = useCallback(async () => {
    try {
      const res = await fetch("/api/cargos");
      if (res.ok) {
        const data = await res.json();
        setCargos(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchCargos();
  }, [fetchMembers, fetchCargos]);

  const filteredMembers = members.filter(
    (m) =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.cargo?.nome ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCargos = cargos.filter(
    (c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateMember = () => {
    setEditingMember(null);
    setMemberForm(initialMemberForm);
    setIsMemberDialogOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      nome: member.nome,
      email: member.email,
      telefone: member.telefone ?? "",
      cargoId: member.cargoId ?? "",
      avatar: member.avatar ?? null,
    });
    setIsMemberDialogOpen(true);
  };

  const handleSaveMember = async () => {
    setMemberSubmitting(true);
    try {
      const payload = {
        nome: memberForm.nome,
        email: memberForm.email,
        telefone: memberForm.telefone || null,
        cargoId: memberForm.cargoId || null,
        avatar: memberForm.avatar,
      };

      if (editingMember) {
        const res = await fetch(`/api/usuarios/${editingMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchMembers();
          setIsMemberDialogOpen(false);
        }
      } else {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchMembers();
          setIsMemberDialogOpen(false);
        }
      }
    } catch {
      // silent
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMembers();
      }
    } catch {
      // silent
    }
    setDeleteConfirmId(null);
    setDeleteType(null);
  };

  const handleToggleMember = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/usuarios/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !member.ativo }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch {
      // silent
    }
  };

  const handleResendInvite = async (member: TeamMember) => {
    try {
      await fetch(`/api/usuarios/${member.id}/convite`, { method: "POST" });
      fetchMembers();
    } catch {
      // silent
    }
  };

  const handleCreateCargo = () => {
    setEditingCargo(null);
    setCargoForm(initialCargoForm);
    setIsCargoDialogOpen(true);
  };

  const handleEditCargo = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setCargoForm({
      nome: cargo.nome,
      permissoes: { ...cargo.permissoes },
    });
    setIsCargoDialogOpen(true);
  };

  const handleSaveCargo = async () => {
    setCargoSubmitting(true);
    try {
      const payload = {
        nome: cargoForm.nome,
        permissoes: cargoForm.permissoes,
      };

      if (editingCargo) {
        const res = await fetch(`/api/cargos/${editingCargo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchCargos();
          setIsCargoDialogOpen(false);
        }
      } else {
        const res = await fetch("/api/cargos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchCargos();
          fetchMembers();
          setIsCargoDialogOpen(false);
        }
      }
    } catch {
      // silent
    } finally {
      setCargoSubmitting(false);
    }
  };

  const handleDeleteCargo = async (id: string) => {
    try {
      const res = await fetch(`/api/cargos/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCargos();
        fetchMembers();
      }
    } catch {
      // silent
    }
    setDeleteConfirmId(null);
    setDeleteType(null);
  };

  const toggleCargoPermission = (key: string) => {
    setCargoForm((prev) => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [key]: !prev.permissoes[key],
      },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Equipe"
          description="Gerencie os membros e cargos do seu escritório"
          action={isManager ? {
            label: activeTab === "membros" ? "Convidar Membro" : "Novo Cargo",
            onClick: activeTab === "membros" ? handleCreateMember : handleCreateCargo,
            icon: <Plus className="h-4 w-4 mr-2" />,
          } : undefined}
        />

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as string); setSearchTerm(""); }}>
          <TabsList>
            <TabsTrigger value="membros" className="gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="cargos" className="gap-2">
              <Shield className="h-4 w-4" />
              Cargos
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder={activeTab === "membros" ? "Buscar por nome, email ou cargo..." : "Buscar cargo..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="membros" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-muted-foreground/60 animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <EmptyState
                title="Nenhum membro encontrado"
                description={isManager ? "Comece convidando seu primeiro membro." : "Nenhum membro encontrado no escritório."}
                icon={Users}
                action={isManager ? { label: "Convidar Membro", onClick: handleCreateMember } : undefined}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="border-border hover:border-muted-foreground/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar ?? undefined} alt={member.nome} />
                            <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                              {getInitials(member.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-foreground">{member.nome}</h3>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        {(isManager || member.id === user?.id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer outline-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {member.id === user?.id ? "Editar meu perfil" : "Editar"}
                            </DropdownMenuItem>
                            {isManager && (
                            <DropdownMenuItem onClick={() => handleToggleMember(member)}>
                              {member.ativo ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            )}
                            {isManager && !member.clerkId && member.clerkInvitationId && (
                              <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Reenviar convite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteConfirmId(member.id);
                                setDeleteType("member");
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="secondary" className={getRoleBadgeColor(member.role)}>
                          {member.cargo?.nome ?? getRoleLabel(member.role)}
                        </Badge>
                        <Badge variant="outline" className={member.ativo ? "text-emerald-600" : "text-muted-foreground/60"}>
                          {member.clerkId
                            ? member.ativo
                              ? "Ativo"
                              : "Bloqueado"
                            : member.clerkInvitationId
                              ? "Convidado"
                              : "Sem acesso"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cargos" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-muted-foreground/60 animate-spin" />
              </div>
            ) : filteredCargos.length === 0 ? (
              <EmptyState
                title="Nenhum cargo encontrado"
                description="Crie cargos para organizar as permissões do seu time."
                icon={Shield}
                action={isManager ? { label: "Novo Cargo", onClick: handleCreateCargo } : undefined}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCargos.map((cargo) => {
                  const userCount = cargo._count?.usuarios ?? 0;
                  const permCount = countPermissions(cargo.permissoes);
                  return (
                    <Card key={cargo.id} className="border-border hover:border-muted-foreground/40 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Shield className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{cargo.nome}</h3>
                              <p className="text-sm text-muted-foreground">
                                {userCount} {userCount === 1 ? "membro" : "membros"} · {permCount} permissões
                              </p>
                            </div>
                          </div>
                          {isManager && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer outline-none">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCargo(cargo)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (userCount === 0) {
                                    setDeleteConfirmId(cargo.id);
                                    setDeleteType("cargo");
                                  }
                                }}
                                className={userCount > 0 ? "text-muted-foreground/60" : "text-red-600"}
                                disabled={userCount > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          )}
                        </div>
                        {permCount > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {Object.entries(cargo.permissoes)
                              .filter(([, v]) => v)
                              .slice(0, 5)
                              .map(([key]) => (
                                <Badge key={key} variant="secondary" className="text-xs bg-muted text-muted-foreground">
                                  {key.split("_").slice(1).join(" ")}
                                </Badge>
                              ))}
                            {permCount > 5 && (
                              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                                +{permCount - 5}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Editar Membro" : "Convidar Membro"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingMember && (
              <div className="flex justify-center">
                <AvatarUpload
                  avatar={memberForm.avatar}
                  initials={getInitials(memberForm.nome || "U")}
                  onUpload={async (base64) => {
                    setMemberForm((prev) => ({ ...prev, avatar: base64 }));
                  }}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="member-nome">Nome *</Label>
              <Input
                id="member-nome"
                value={memberForm.nome}
                onChange={(e) => setMemberForm({ ...memberForm, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="member-email">Email *</Label>
              <Input
                id="member-email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="member-telefone">Telefone</Label>
              <Input
                id="member-telefone"
                value={memberForm.telefone}
                onChange={(e) => setMemberForm({ ...memberForm, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            {isManager && (
            <div className="grid gap-2">
              <Label htmlFor="member-cargo">Cargo</Label>
              <Select
                value={memberForm.cargoId}
                onValueChange={(value) => setMemberForm({ ...memberForm, cargoId: value as string })}
                items={Object.fromEntries(cargos.map((cargo) => [cargo.id, cargo.nome]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMember}
              disabled={!memberForm.nome || !memberForm.email || memberSubmitting}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
            >
              {memberSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMember ? "Salvar" : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cargo Dialog */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCargo ? "Editar Cargo" : "Novo Cargo"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cargo-nome">Nome *</Label>
              <Input
                id="cargo-nome"
                value={cargoForm.nome}
                onChange={(e) => setCargoForm({ ...cargoForm, nome: e.target.value })}
                placeholder="Nome do cargo"
              />
            </div>
            <div className="space-y-4">
              <Label>Permissões</Label>
              {PERMISSION_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{section.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {section.permissions.map((perm) => (
                      <button
                        key={perm.key}
                        type="button"
                        onClick={() => toggleCargoPermission(perm.key)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          cargoForm.permissoes[perm.key]
                            ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                            : "border-border bg-white text-muted-foreground hover:border-muted-foreground/40"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            cargoForm.permissoes[perm.key]
                              ? "border-white bg-white/20"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {cargoForm.permissoes[perm.key] && (
                            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {perm.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCargoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCargo}
              disabled={!cargoForm.nome || cargoSubmitting}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
            >
              {cargoSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCargo ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => { setDeleteConfirmId(null); setDeleteType(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {deleteType === "member"
              ? "Tem certeza que deseja remover este membro? Esta ação não pode ser desfeita."
              : "Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirmId(null); setDeleteType(null); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId && deleteType === "member") handleDeleteMember(deleteConfirmId);
                if (deleteConfirmId && deleteType === "cargo") handleDeleteCargo(deleteConfirmId);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
