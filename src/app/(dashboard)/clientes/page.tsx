"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CpfCnpjInput } from "@/components/shared/cpf-cnpj-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EMPRESA_ID = "empresa-1";

interface Client {
  id: string;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  _count?: { processos: number };
}

interface ClientFormData {
  nome: string;
  cpfCnpj: string;
  cpfCnpjTipo: "CPF" | "CNPJ";
  telefone: string;
  email: string;
  endereco: string;
  cep: string;
  numero: string;
  complemento: string;
  cidade: string;
  uf: string;
  observacoes: string;
}

const initialForm: ClientFormData = {
  nome: "",
  cpfCnpj: "",
  cpfCnpjTipo: "CPF",
  telefone: "",
  email: "",
  endereco: "",
  cep: "",
  numero: "",
  complemento: "",
  cidade: "",
  uf: "",
  observacoes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes?empresaId=${EMPRESA_ID}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(
    (client) =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.cpfCnpj ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingClient(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    const isCnpj = (client.cpfCnpj ?? "").replace(/\D/g, "").length > 11;
    setFormData({
      nome: client.nome,
      cpfCnpj: client.cpfCnpj ?? "",
      cpfCnpjTipo: isCnpj ? "CNPJ" : "CPF",
      telefone: client.telefone ?? "",
      email: client.email ?? "",
      endereco: client.endereco ?? "",
      cep: client.cep ?? "",
      numero: client.numero ?? "",
      complemento: client.complemento ?? "",
      cidade: client.cidade ?? "",
      uf: client.uf ?? "",
      observacoes: client.observacoes ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
      }
    } catch {
      // silent
    } finally {
      setCepLoading(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = {
        empresaId: EMPRESA_ID,
        nome: formData.nome,
        cpfCnpj: formData.cpfCnpj || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        endereco: formData.endereco || null,
        cep: formData.cep || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        cidade: formData.cidade || null,
        uf: formData.uf || null,
        observacoes: formData.observacoes || null,
      };

      if (editingClient) {
        const res = await fetch(`/api/clientes/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchClients();
          setIsDialogOpen(false);
        }
      } else {
        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchClients();
          setIsDialogOpen(false);
        }
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
      }
    } catch {
      // silent
    }
    setDeleteConfirmId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Clientes"
          description="Gerencie seus clientes"
          action={{
            label: "Novo Cliente",
            onClick: handleCreate,
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-muted-foreground/60 animate-spin" />
          </div>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Comece cadastrando seu primeiro cliente."
            icon={Users}
            action={{ label: "Novo Cliente", onClick: handleCreate }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Processos</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nome}</TableCell>
                      <TableCell>{client.cpfCnpj ?? "—"}</TableCell>
                      <TableCell>{client.telefone ?? "—"}</TableCell>
                      <TableCell>{client.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{client._count?.processos ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer outline-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(client.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="client-nome">Nome *</Label>
              <Input
                id="client-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid gap-2">
              <Label>CPF/CNPJ</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.cpfCnpjTipo}
                  onValueChange={(val) => setFormData({ ...formData, cpfCnpjTipo: val as "CPF" | "CNPJ", cpfCnpj: "" })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
                <CpfCnpjInput
                  tipo={formData.cpfCnpjTipo}
                  value={formData.cpfCnpj}
                  onChange={(val) => setFormData({ ...formData, cpfCnpj: val })}
                  placeholder={formData.cpfCnpjTipo === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client-telefone">Telefone</Label>
                <Input
                  id="client-telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Endereço</h4>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="client-cep">CEP</Label>
                  <Input
                    id="client-cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {cepLoading && (
                    <p className="text-xs text-muted-foreground">Buscando endereço...</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client-endereco">Endereço</Label>
                  <Input
                    id="client-endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="client-numero">Número</Label>
                    <Input
                      id="client-numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <Label htmlFor="client-complemento">Complemento</Label>
                    <Input
                      id="client-complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Apto, Sala, etc."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-4 grid gap-2">
                    <Label htmlFor="client-cidade">Cidade</Label>
                    <Input
                      id="client-cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="client-uf">UF</Label>
                    <Input
                      id="client-uf"
                      value={formData.uf}
                      onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase().slice(0, 2) })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-observacoes">Observações</Label>
              <Textarea
                id="client-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre o cliente"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.nome || submitting}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingClient ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
