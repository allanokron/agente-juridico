"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DocumentList } from "@/components/documents/document-list";
import { FileUpload } from "@/components/documents/file-upload";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenant } from "@/contexts/tenant-context";
import {
  ArrowLeft,
  FileText,
  Calendar,
  History,
  Briefcase,
  User,
  Users,
  Scale,
  MapPin,
  Clock,
  CircleCheck,
  CircleDot,
  AlertCircle,
  Circle,
} from "lucide-react";
import { StatusProcesso, TipoProcesso } from "@/generated/prisma/enums";

interface Historico {
  id: string;
  descricao: string;
  tipo: string | null;
  createdAt: string;
  usuario?: {
    id: string;
    nome: string;
    avatar?: string | null;
  } | null;
}

interface Evento {
  id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  hora?: string | null;
  tipo: string;
  prioridade: string;
  status: string;
}

interface Atribuicao {
  id: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    avatar?: string | null;
  };
}

interface ProcessDetail {
  id: string;
  numeroProcesso?: string | null;
  tribunal?: string | null;
  vara?: string | null;
  tipoProcesso: TipoProcesso;
  status: StatusProcesso;
  observacoes?: string | null;
  dataCadastro: string;
  cliente: {
    id: string;
    nome: string;
    cpfCnpj?: string | null;
    telefone?: string | null;
    email?: string | null;
  };
  responsavel: {
    id: string;
    nome: string;
    email: string;
    avatar?: string | null;
  };
  kanbanCard?: {
    id: string;
    dataRevisao?: string | null;
    etapa: {
      id: string;
      nome: string;
      cor?: string | null;
    };
  } | null;
  historicos: Historico[];
  eventos: Evento[];
  atribuicoes: Atribuicao[];
}

function getStatusColor(status: StatusProcesso) {
  switch (status) {
    case StatusProcesso.ATIVO:
      return "bg-emerald-100 text-emerald-700";
    case StatusProcesso.EM_ANDAMENTO:
      return "bg-blue-100 text-blue-700";
    case StatusProcesso.SUSPENSO:
      return "bg-amber-100 text-amber-700";
    case StatusProcesso.ARQUIVADO:
      return "bg-muted text-muted-foreground";
    case StatusProcesso.FINALIZADO:
      return "bg-purple-100 text-purple-700";
    case StatusProcesso.GANHO:
      return "bg-emerald-100 text-emerald-700";
    case StatusProcesso.PERDIDO:
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: StatusProcesso) {
  switch (status) {
    case StatusProcesso.ATIVO:
      return "Ativo";
    case StatusProcesso.EM_ANDAMENTO:
      return "Em Andamento";
    case StatusProcesso.SUSPENSO:
      return "Suspenso";
    case StatusProcesso.ARQUIVADO:
      return "Arquivado";
    case StatusProcesso.FINALIZADO:
      return "Finalizado";
    case StatusProcesso.GANHO:
      return "Ganho";
    case StatusProcesso.PERDIDO:
      return "Perdido";
    default:
      return status;
  }
}

function getTipoLabel(tipo: TipoProcesso) {
  const labels: Record<TipoProcesso, string> = {
    [TipoProcesso.CIVIL]: "Cível",
    [TipoProcesso.CRIMINAL]: "Criminal",
    [TipoProcesso.TRABALHISTA]: "Trabalhista",
    [TipoProcesso.ADMINISTRATIVO]: "Administrativo",
    [TipoProcesso.TRIBUTARIO]: "Tributário",
    [TipoProcesso.FAMILIAR]: "Familiar",
    [TipoProcesso.EMPRESARIAL]: "Empresarial",
    [TipoProcesso.CONSUMIDOR]: "Consumidor",
    [TipoProcesso.AMBIENTAL]: "Ambiental",
    [TipoProcesso.PREVIDENCIARIO]: "Previdenciário",
    [TipoProcesso.OUTRO]: "Outro",
  };
  return labels[tipo] || tipo;
}

function getHistoricoIcon(tipo: string | null) {
  switch (tipo) {
    case "criacao":
      return <CircleCheck className="h-4 w-4 text-emerald-500" />;
    case "atribuicao":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "remocao_atribuicao":
      return <User className="h-4 w-4 text-amber-500" />;
    case "status":
      return <CircleDot className="h-4 w-4 text-purple-500" />;
    case "edicao":
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/60" />;
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getEventoStatusColor(status: string) {
  switch (status) {
    case "PENDENTE":
      return "bg-amber-100 text-amber-700";
    case "EM_ANDAMENTO":
      return "bg-blue-100 text-blue-700";
    case "CONCLUIDO":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELADO":
      return "bg-muted text-muted-foreground";
    case "REAGENDADO":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getEventoStatusLabel(status: string) {
  switch (status) {
    case "PENDENTE":
      return "Pendente";
    case "EM_ANDAMENTO":
      return "Em Andamento";
    case "CONCLUIDO":
      return "Concluído";
    case "CANCELADO":
      return "Cancelado";
    case "REAGENDADO":
      return "Reagendado";
    default:
      return status;
  }
}

export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { empresaId } = useTenant();
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [processId, setProcessId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setProcessId(p.id));
  }, [params]);

  const fetchProcess = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const response = await fetch(`/api/processos/${id}`);
      if (response.status === 404) {
        setNotFound(true);
        return;
      }
      if (!response.ok) {
        throw new Error("Erro ao buscar processo");
      }
      const data = await response.json();
      setProcess(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (processId) {
      fetchProcess(processId);
    }
  }, [processId, fetchProcess]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-border rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-7 w-64 bg-border rounded animate-pulse" />
              <div className="h-4 w-48 bg-border rounded animate-pulse" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-10 w-full bg-border rounded animate-pulse" />
              <div className="h-64 bg-border rounded animate-pulse" />
            </div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-border rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !process) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/processos")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <EmptyState
            icon={Briefcase}
            title="Processo não encontrado"
            description="O processo solicitado não existe ou foi removido."
            action={{
              label: "Voltar para processos",
              onClick: () => router.push("/processos"),
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/processos")}
              className="mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {process.numeroProcesso || "Sem número"}
                </h1>
                <Badge variant="secondary" className={getStatusColor(process.status)}>
                  {getStatusLabel(process.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {process.cliente.nome}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="documentos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="documentos">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="agenda">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Agenda
                </TabsTrigger>
                <TabsTrigger value="historico">
                  <History className="h-4 w-4 mr-1.5" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documentos">
                <div className="space-y-4">
                  <FileUpload
                    processoId={processId}
                    empresaId={empresaId || ""}
                    usuarioId={process.responsavel.id}
                  />
                  <DocumentList
                    processoId={processId}
                    empresaId={empresaId || ""}
                    usuarioId={process.responsavel.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="agenda">
                <div>
                  {process.eventos.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <EmptyState
                          icon={Calendar}
                          title="Nenhum evento"
                          description="Não há eventos agendados para este processo."
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {process.eventos.map((evento) => (
                        <Card key={evento.id}>
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium text-foreground">
                                  {evento.titulo}
                                </h4>
                                {evento.descricao && (
                                  <p className="text-sm text-muted-foreground">
                                    {evento.descricao}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(evento.data)}
                                  </span>
                                  {evento.hora && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {evento.hora}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {evento.prioridade}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className={getEventoStatusColor(evento.status)}
                              >
                                {getEventoStatusLabel(evento.status)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="historico">
                <div>
                  {process.historicos.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <EmptyState
                          icon={History}
                          title="Sem histórico"
                          description="Ainda não há registros de alterações para este processo."
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-4">
                        <div className="relative">
                          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                          <div className="space-y-6">
                            {process.historicos.map((item) => (
                              <div key={item.id} className="relative flex gap-3">
                                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-border">
                                  {getHistoricoIcon(item.tipo)}
                                </div>
                                <div className="flex-1 pt-1">
                                  <p className="text-sm text-foreground">
                                    {item.descricao}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {item.usuario && (
                                      <span className="text-xs text-muted-foreground">
                                        {item.usuario.nome}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground/60">
                                      {formatDateTime(item.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base">Informações do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Número</span>
                    <span className="text-sm font-medium text-foreground font-mono">
                      {process.numeroProcesso || "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <span className="text-sm font-medium text-foreground">
                      {getTipoLabel(process.tipoProcesso)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tribunal</span>
                    <span className="text-sm font-medium text-foreground">
                      {process.tribunal || "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vara</span>
                    <span className="text-sm font-medium text-foreground">
                      {process.vara || "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(process.status)}
                    >
                      {getStatusLabel(process.status)}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data de cadastro</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(process.dataCadastro)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base">Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <span className="text-sm font-medium text-foreground">
                      {process.cliente.nome}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CPF/CNPJ</span>
                    <span className="text-sm font-medium text-foreground">
                      {process.cliente.cpfCnpj || "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm font-medium text-foreground">
                      {process.cliente.telefone || "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">E-mail</span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                      {process.cliente.email || "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base">Kanban</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.kanbanCard ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Etapa atual</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              process.kanbanCard.etapa.cor || "#94a3b8",
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {process.kanbanCard.etapa.nome}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Data de revisão
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {process.kanbanCard.dataRevisao
                          ? formatDate(process.kanbanCard.dataRevisao)
                          : "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Processo não está no quadro Kanban
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base">Equipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Responsável</span>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={process.responsavel.avatar || undefined} />
                        <AvatarFallback>
                          {getInitials(process.responsavel.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {process.responsavel.nome}
                      </span>
                    </div>
                  </div>
                  {process.atribuicoes.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm text-muted-foreground block mb-2">
                          Atribuídos
                        </span>
                        <div className="space-y-2">
                          {process.atribuicoes.map((atribuicao) => (
                            <div
                              key={atribuicao.id}
                              className="flex items-center gap-2"
                            >
                              <Avatar size="sm">
                                <AvatarImage
                                  src={
                                    atribuicao.usuario.avatar || undefined
                                  }
                                />
                                <AvatarFallback>
                                  {getInitials(atribuicao.usuario.nome)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">
                                {atribuicao.usuario.nome}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
