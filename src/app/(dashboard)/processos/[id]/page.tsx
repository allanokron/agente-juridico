"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  Clock,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DocumentList } from "@/components/documents/document-list";
import { FileUpload } from "@/components/documents/file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";

type TeamMember = { id: string; nome: string; email?: string; avatar?: string | null };
type Assignment = { id: string; usuario: TeamMember };
type HistoryEntry = {
  id: string;
  descricao: string;
  tipo: string | null;
  detalhes?: Record<string, unknown> | null;
  createdAt: string;
  usuario?: TeamMember | null;
};
type Activity = {
  id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  hora?: string | null;
  tipo: string;
  prioridade: string;
  status: string;
  responsavel?: TeamMember;
};
type Comment = {
  id: string;
  conteudo: string;
  createdAt: string;
  autor: TeamMember;
  mencoes: { usuario: TeamMember }[];
};
type ProcessDetail = {
  id: string;
  numeroProcesso?: string | null;
  tribunal?: string | null;
  vara?: string | null;
  tipoProcesso: string;
  status: string;
  observacoes?: string | null;
  dataCadastro: string;
  cliente: {
    id: string;
    nome: string;
    cpfCnpj?: string | null;
    telefone?: string | null;
    email?: string | null;
  };
  responsavel: TeamMember;
  kanbanCard?: {
    id: string;
    dataRevisao?: string | null;
    hora?: string | null;
    etapa: { id: string; nome: string; cor?: string | null };
  } | null;
  historicos: HistoryEntry[];
  eventos: Activity[];
  atribuicoes: Assignment[];
};

const PROCESS_TYPES = [
  "CIVIL",
  "CRIMINAL",
  "TRABALHISTA",
  "ADMINISTRATIVO",
  "TRIBUTARIO",
  "FAMILIAR",
  "EMPRESARIAL",
  "CONSUMIDOR",
  "AMBIENTAL",
  "PREVIDENCIARIO",
  "OUTRO",
];
const PROCESS_STATUSES = [
  "ATIVO",
  "EM_ANDAMENTO",
  "SUSPENSO",
  "ARQUIVADO",
  "FINALIZADO",
  "GANHO",
  "PERDIDO",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function dateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [processId, setProcessId] = useState("");
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documentsVersion, setDocumentsVersion] = useState(0);
  const [form, setForm] = useState({
    numeroProcesso: "",
    tribunal: "",
    vara: "",
    tipoProcesso: "CIVIL",
    status: "ATIVO",
    observacoes: "",
    responsavelId: "",
    dataRevisao: "",
    hora: "",
  });
  const [commentText, setCommentText] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [activity, setActivity] = useState({
    titulo: "",
    descricao: "",
    data: "",
    hora: "",
    tipo: "PRAZO",
    prioridade: "MEDIA",
    responsavelId: "",
  });

  useEffect(() => {
    params.then(({ id }) => setProcessId(id));
  }, [params]);

  const load = useCallback(async () => {
    if (!processId || !user?.empresaId) return;
    setLoading(true);
    try {
      const [processResponse, commentsResponse, teamResponse] = await Promise.all([
        fetch(`/api/processos/${processId}`),
        fetch(`/api/processos/${processId}/comentarios`),
        fetch(`/api/usuarios?empresaId=${user.empresaId}`),
      ]);
      if (processResponse.status === 403 || processResponse.status === 404) {
        router.replace("/gestao-processos");
        return;
      }
      if (!processResponse.ok) throw new Error("Erro ao carregar processo");
      const data = (await processResponse.json()) as ProcessDetail;
      setProcess(data);
      setForm({
        numeroProcesso: data.numeroProcesso || "",
        tribunal: data.tribunal || "",
        vara: data.vara || "",
        tipoProcesso: data.tipoProcesso,
        status: data.status,
        observacoes: data.observacoes || "",
        responsavelId: data.responsavel.id,
        dataRevisao: dateInput(data.kanbanCard?.dataRevisao),
        hora: data.kanbanCard?.hora || "",
      });
      if (commentsResponse.ok) setComments(await commentsResponse.json());
      if (teamResponse.ok) setTeam(await teamResponse.json());
    } finally {
      setLoading(false);
    }
  }, [processId, router, user?.empresaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProcess = async () => {
    if (!process?.kanbanCard) return;
    setSaving(true);
    try {
      const [processResponse, cardResponse] = await Promise.all([
        fetch(`/api/processos/${process.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numeroProcesso: form.numeroProcesso || null,
            tribunal: form.tribunal || null,
            vara: form.vara || null,
            tipoProcesso: form.tipoProcesso,
            status: form.status,
            observacoes: form.observacoes || null,
            responsavelId: form.responsavelId,
          }),
        }),
        fetch(`/api/kanban/cards/${process.kanbanCard.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataRevisao: form.dataRevisao || null,
            hora: form.hora || null,
          }),
        }),
      ]);
      if (!processResponse.ok || !cardResponse.ok) throw new Error("Erro ao salvar");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignment = async (memberId: string) => {
    if (!process) return;
    const assigned = process.atribuicoes.some((item) => item.usuario.id === memberId);
    const response = await fetch(`/api/processos/${process.id}/atribuicoes`, {
      method: assigned ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: memberId }),
    });
    if (response.ok) await load();
  };

  const addComment = async () => {
    if (!commentText.trim() || !process) return;
    const response = await fetch(`/api/processos/${process.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: commentText, mencoes: mentions }),
    });
    if (response.ok) {
      setCommentText("");
      setMentions([]);
      await load();
    }
  };

  const addActivity = async () => {
    if (!activity.titulo.trim() || !activity.data || !process) return;
    const response = await fetch(`/api/processos/${process.id}/atividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    });
    if (response.ok) {
      setActivity({
        titulo: "",
        descricao: "",
        data: "",
        hora: "",
        tipo: "PRAZO",
        prioridade: "MEDIA",
        responsavelId: "",
      });
      await load();
    }
  };

  const finishActivity = async (eventId: string) => {
    if (!process) return;
    const response = await fetch(`/api/processos/${process.id}/atividades/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDO" }),
    });
    if (response.ok) await load();
  };

  if (loading || !process || !user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/gestao-processos")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{process.numeroProcesso || "Processo sem número"}</h1>
                <Badge>{process.kanbanCard?.etapa.nome || process.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{process.cliente.nome}</p>
            </div>
          </div>
          <Button onClick={saveProcess} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <Card>
              <CardHeader><CardTitle>Dados do processo</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={form.numeroProcesso} onChange={(event) => setForm({ ...form, numeroProcesso: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={form.responsavelId} onValueChange={(value) => setForm({ ...form, responsavelId: value || "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{team.map((member) => <SelectItem key={member.id} value={member.id}>{member.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipoProcesso} onValueChange={(value) => setForm({ ...form, tipoProcesso: value || "CIVIL" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROCESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value || "ATIVO" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROCESS_STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Tribunal</Label><Input value={form.tribunal} onChange={(event) => setForm({ ...form, tribunal: event.target.value })} /></div>
                <div className="space-y-2"><Label>Vara</Label><Input value={form.vara} onChange={(event) => setForm({ ...form, vara: event.target.value })} /></div>
                <div className="space-y-2"><Label>Próxima revisão</Label><Input type="date" value={form.dataRevisao} onChange={(event) => setForm({ ...form, dataRevisao: event.target.value })} /></div>
                <div className="space-y-2"><Label>Hora</Label><Input type="time" value={form.hora} onChange={(event) => setForm({ ...form, hora: event.target.value })} /></div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações gerais</Label>
                  <Textarea className="min-h-28" value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="atividades">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="atividades"><Calendar className="h-4 w-4" /> Atividades</TabsTrigger>
                <TabsTrigger value="documentos"><FileText className="h-4 w-4" /> Documentos</TabsTrigger>
                <TabsTrigger value="equipe"><Users className="h-4 w-4" /> Equipe</TabsTrigger>
                <TabsTrigger value="comentarios"><MessageSquare className="h-4 w-4" /> Comentários</TabsTrigger>
              </TabsList>

              <TabsContent value="atividades" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Nova atividade ou prazo</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <Input placeholder="Título" value={activity.titulo} onChange={(event) => setActivity({ ...activity, titulo: event.target.value })} />
                    <Select value={activity.tipo} onValueChange={(value) => setActivity({ ...activity, tipo: value || "PRAZO" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["PRAZO", "AUDIENCIA", "REUNIAO", "PROTOCOLO", "LEMBRETE", "PERSONALIZADO"].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="date" value={activity.data} onChange={(event) => setActivity({ ...activity, data: event.target.value })} />
                    <Input type="time" value={activity.hora} onChange={(event) => setActivity({ ...activity, hora: event.target.value })} />
                    <Textarea className="md:col-span-2" placeholder="Descrição" value={activity.descricao} onChange={(event) => setActivity({ ...activity, descricao: event.target.value })} />
                    <Button className="md:col-span-2" onClick={addActivity}><Plus className="h-4 w-4" /> Adicionar atividade</Button>
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  {process.eventos.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="flex items-start justify-between gap-4 py-4">
                        <div>
                          <div className="flex items-center gap-2"><strong>{event.titulo}</strong><Badge variant="outline">{event.status}</Badge></div>
                          {event.descricao && <p className="mt-1 text-sm text-muted-foreground">{event.descricao}</p>}
                          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {new Date(event.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                            {event.hora && <><Clock className="ml-2 h-3 w-3" /> {event.hora}</>}
                          </p>
                        </div>
                        {event.status !== "CONCLUIDO" && <Button size="sm" variant="outline" onClick={() => finishActivity(event.id)}><Check className="h-4 w-4" /> Concluir</Button>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="space-y-4">
                <FileUpload
                  processoId={process.id}
                  empresaId={user.empresaId}
                  usuarioId={user.id}
                  onUploadComplete={() => {
                    setDocumentsVersion((value) => value + 1);
                    void load();
                  }}
                />
                <DocumentList key={documentsVersion} processoId={process.id} empresaId={user.empresaId} usuarioId={user.id} isAdmin={user.role === "SUPER_ADMIN" || user.role === "ADMINISTRADOR"} />
              </TabsContent>

              <TabsContent value="equipe">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" /> Pessoas com acesso ao processo</CardTitle></CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2">
                    {team.map((member) => {
                      const checked = process.atribuicoes.some((assignment) => assignment.usuario.id === member.id);
                      return (
                        <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                          <Checkbox checked={checked} onCheckedChange={() => toggleAssignment(member.id)} />
                          <Avatar size="sm"><AvatarImage src={member.avatar || undefined} /><AvatarFallback>{initials(member.nome)}</AvatarFallback></Avatar>
                          <span className="text-sm">{member.nome}</span>
                        </label>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comentarios" className="space-y-4">
                <Card>
                  <CardContent className="space-y-3 py-4">
                    <Textarea placeholder="Escreva um comentário..." value={commentText} onChange={(event) => setCommentText(event.target.value)} />
                    <div>
                      <Label className="mb-2 block text-xs">Mencionar pessoas</Label>
                      <div className="flex flex-wrap gap-2">
                        {team.filter((member) => member.id !== user.id).map((member) => (
                          <Button key={member.id} type="button" size="sm" variant={mentions.includes(member.id) ? "default" : "outline"} onClick={() => setMentions((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])}>
                            @{member.nome.split(" ")[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={addComment}><MessageSquare className="h-4 w-4" /> Publicar comentário</Button>
                  </CardContent>
                </Card>
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="flex gap-3 py-4">
                      <Avatar><AvatarImage src={comment.autor.avatar || undefined} /><AvatarFallback>{initials(comment.autor.nome)}</AvatarFallback></Avatar>
                      <div>
                        <p className="text-sm font-medium">{comment.autor.nome} <span className="font-normal text-muted-foreground">· {formatDateTime(comment.createdAt)}</span></p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{comment.conteudo}</p>
                        {comment.mencoes.length > 0 && <p className="mt-2 text-xs text-primary">{comment.mencoes.map(({ usuario: mentioned }) => `@${mentioned.nome}`).join(" ")}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Timeline completa</CardTitle></CardHeader>
              <CardContent className="max-h-[70vh] space-y-4 overflow-y-auto">
                {process.historicos.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>}
                {process.historicos.map((entry) => (
                  <div key={entry.id} className="relative border-l pl-4">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">{entry.descricao}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.usuario?.nome || "Sistema"} · {formatDateTime(entry.createdAt)}</p>
                    {entry.detalhes && <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">{JSON.stringify(entry.detalhes, null, 2)}</pre>}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 py-4 text-sm">
                <p><strong>Cliente:</strong> {process.cliente.nome}</p>
                <p><strong>Responsável:</strong> {process.responsavel.nome}</p>
                <p className="flex items-center gap-1 text-muted-foreground"><Bell className="h-3 w-3" /> Menções geram notificações internas.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
