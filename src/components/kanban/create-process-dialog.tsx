"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Search, Upload, FileText, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { FileUpload } from "@/components/documents/file-upload";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function stripMask(value: string): string {
  return value.replace(/\D/g, "");
}

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string | null;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface TipoProcessoOption {
  valor: string;
  label: string;
}

const DEFAULT_TIPOS: TipoProcessoOption[] = [
  { valor: "CIVIL", label: "Cível" },
  { valor: "CRIMINAL", label: "Criminal" },
  { valor: "TRABALHISTA", label: "Trabalhista" },
  { valor: "ADMINISTRATIVO", label: "Administrativo" },
  { valor: "TRIBUTARIO", label: "Tributário" },
  { valor: "FAMILIAR", label: "Familiar" },
  { valor: "EMPRESARIAL", label: "Empresarial" },
  { valor: "CONSUMIDOR", label: "Consumidor" },
  { valor: "AMBIENTAL", label: "Ambiental" },
  { valor: "PREVIDENCIARIO", label: "Previdenciário" },
  { valor: "OUTRO", label: "Outro" },
];

interface CreateProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateProcessDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProcessDialogProps) {
  const { user } = useAuth();
  const empresaId = user?.empresaId || "";
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [isExistingClient, setIsExistingClient] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tiposProcesso, setTiposProcesso] = useState<TipoProcessoOption[]>(DEFAULT_TIPOS);
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [cpfCnpjWarning, setCpfCnpjWarning] = useState("");
  const [numeroProcessoWarning, setNumeroProcessoWarning] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [dataRevisao, setDataRevisao] = useState("");
  const [hora, setHora] = useState("");
  const [atribuicoes, setAtribuicoes] = useState<string[]>([]);
  const [paraTodos, setParaTodos] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [cepLoading, setCepLoading] = useState(false);
  const [createdProcessoId, setCreatedProcessoId] = useState<string | null>(null);
  const [totalSteps, setTotalSteps] = useState(3);

  const cpfCnpjTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numeroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newCliente, setNewCliente] = useState({
    nome: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    numero: "",
    complemento: "",
  });

  const [processo, setProcesso] = useState({
    numeroProcesso: "",
    tipoProcesso: "",
    tribunal: "",
    vara: "",
    observacoes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [clientesRes, usuariosRes, tiposRes] = await Promise.all([
        fetch(`/api/clientes?empresaId=${empresaId}`),
        fetch(`/api/usuarios?empresaId=${empresaId}`),
        fetch(`/api/tipos-processo?empresaId=${empresaId}`),
      ]);

      if (clientesRes.ok) setClientes(await clientesRes.json());
      if (usuariosRes.ok) setUsuarios(await usuariosRes.json());
      if (tiposRes.ok) {
        const data = await tiposRes.json();
        setTiposProcesso(data.map((t: { valor: string; label: string }) => ({ valor: t.valor, label: t.label })));
      }
    } catch {
      // handled silently
    }
  }, [empresaId]);

  useEffect(() => {
    if (open) {
      fetchData();
      setStep(1);
      setIsExistingClient(true);
      setSelectedClienteId("");
      setCpfCnpjWarning("");
      setNumeroProcessoWarning("");
      setResponsavelId("");
      setDataRevisao("");
      setHora("");
      setAtribuicoes([]);
      setParaTodos(false);
      setClienteSearch("");
      setTipoPessoa("PF");
      setCreatedProcessoId(null);
      setTotalSteps(3);
      setNewCliente({ nome: "", cpfCnpj: "", telefone: "", email: "", cep: "", endereco: "", bairro: "", cidade: "", estado: "", numero: "", complemento: "" });
      setProcesso({ numeroProcesso: "", tipoProcesso: "", tribunal: "", vara: "", observacoes: "" });
    }
  }, [open, fetchData]);

  useEffect(() => {
    return () => {
      if (cpfCnpjTimerRef.current) clearTimeout(cpfCnpjTimerRef.current);
      if (numeroTimerRef.current) clearTimeout(numeroTimerRef.current);
    };
  }, []);

  const checkCpfCnpj = async (cpfCnpj: string) => {
    const digits = stripMask(cpfCnpj);
    if (!digits || digits.length < 11) {
      setCpfCnpjWarning("");
      return;
    }
    try {
      const res = await fetch(
        `/api/clientes?empresaId=${empresaId}&cpfCnpj=${encodeURIComponent(digits)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCpfCnpjWarning("Este CPF/CNPJ já está cadastrado.");
        } else {
          setCpfCnpjWarning("");
        }
      }
    } catch {
      setCpfCnpjWarning("");
    }
  };

  const checkNumeroProcesso = async (numero: string) => {
    const digits = stripMask(numero);
    if (!digits || digits.length < 10) {
      setNumeroProcessoWarning("");
      return;
    }
    try {
      const res = await fetch(
        `/api/processos?empresaId=${empresaId}&numero=${encodeURIComponent(digits)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setNumeroProcessoWarning("Este número de processo já existe.");
        } else {
          setNumeroProcessoWarning("");
        }
      }
    } catch {
      setNumeroProcessoWarning("");
    }
  };

  const handleCpfCnpjChange = (value: string) => {
    setNewCliente((prev) => ({ ...prev, cpfCnpj: value }));
    setCpfCnpjWarning("");
    if (cpfCnpjTimerRef.current) clearTimeout(cpfCnpjTimerRef.current);
    cpfCnpjTimerRef.current = setTimeout(() => {
      checkCpfCnpj(value);
    }, 600);
  };

  const handleNumeroChange = (value: string) => {
    setProcesso((prev) => ({ ...prev, numeroProcesso: value }));
    setNumeroProcessoWarning("");
    if (numeroTimerRef.current) clearTimeout(numeroTimerRef.current);
    numeroTimerRef.current = setTimeout(() => {
      checkNumeroProcesso(value);
    }, 600);
  };

  const handleCepLookup = async (cep: string) => {
    const digits = stripMask(cep);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          setNewCliente((prev) => ({
            ...prev,
            endereco: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
        }
      }
    } catch {
      // ViaCEP lookup failed silently
    } finally {
      setCepLoading(false);
    }
  };

  const handleAtribuicaoToggle = (usuarioId: string) => {
    setAtribuicoes((prev) => {
      const updated = prev.includes(usuarioId)
        ? prev.filter((id) => id !== usuarioId)
        : [...prev, usuarioId];
      setParaTodos(false);
      return updated;
    });
  };

  const handleParaTodosToggle = (checked: boolean) => {
    setParaTodos(checked);
    setAtribuicoes(checked ? usuarios.map((u) => u.id) : []);
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      c.cpfCnpj?.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const canProceedStep1 = isExistingClient ? !!selectedClienteId : !!newCliente.nome;
  const canProceedStep2 = !!processo.numeroProcesso && !!processo.tipoProcesso;
  const canSubmit =
    !!responsavelId &&
    !submitting &&
    !(isExistingClient ? false : cpfCnpjWarning !== "") &&
    !numeroProcessoWarning;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let clienteId = selectedClienteId;

      if (!isExistingClient) {
        const enderecoParts = [
          newCliente.endereco,
          newCliente.numero && `nº ${newCliente.numero}`,
          newCliente.complemento,
          newCliente.bairro,
          newCliente.cidade,
          newCliente.estado && newCliente.estado.toUpperCase(),
          newCliente.cep && `CEP: ${stripMask(newCliente.cep)}`,
        ].filter(Boolean).join(", ");

        const clienteRes = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresaId,
            nome: newCliente.nome,
            cpfCnpj: stripMask(newCliente.cpfCnpj) || null,
            telefone: newCliente.telefone || null,
            email: newCliente.email || null,
            endereco: enderecoParts || null,
          }),
        });

        if (!clienteRes.ok) throw new Error("Erro ao criar cliente");
        const clienteData = await clienteRes.json();
        clienteId = clienteData.id;
      }

      const processoRes = await fetch("/api/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          clienteId,
          responsavelId,
          numeroProcesso: processo.numeroProcesso || null,
          tribunal: processo.tribunal || null,
          vara: processo.vara || null,
          tipoProcesso: processo.tipoProcesso,
          observacoes: processo.observacoes || null,
          dataRevisao: dataRevisao || null,
          hora: hora || null,
          atribuicoes: atribuicoes.length > 0 ? atribuicoes : undefined,
        }),
      });

      if (!processoRes.ok) throw new Error("Erro ao criar processo");
      const processoData = await processoRes.json();

      setCreatedProcessoId(processoData.id);
      setTotalSteps(4);
      setStep(4);
    } catch {
      // handled silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Processo</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-[#8B5CF6]" : "bg-border"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={isExistingClient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsExistingClient(true)}
                className={isExistingClient ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white" : ""}
              >
                Cliente Existente
              </Button>
              <Button
                variant={!isExistingClient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsExistingClient(false)}
                className={!isExistingClient ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white" : ""}
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Novo Cliente
              </Button>
            </div>

            {isExistingClient ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    placeholder="Buscar por nome ou CPF/CNPJ..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {filteredClientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-4">
                      Nenhum cliente encontrado
                    </p>
                  ) : (
                    filteredClientes.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedClienteId === c.id
                            ? "bg-muted border border-border"
                            : "hover:bg-muted/30 border border-transparent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cliente"
                          checked={selectedClienteId === c.id}
                          onChange={() => setSelectedClienteId(c.id)}
                          className="h-4 w-4 accent-[#8B5CF6]"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.nome}</p>
                          {c.cpfCnpj && (
                            <p className="text-xs text-muted-foreground">{c.cpfCnpj}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={tipoPessoa === "PF" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTipoPessoa("PF");
                      setNewCliente((prev) => ({ ...prev, cpfCnpj: "" }));
                      setCpfCnpjWarning("");
                    }}
                    className={tipoPessoa === "PF" ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white" : ""}
                  >
                    Pessoa Física
                  </Button>
                  <Button
                    variant={tipoPessoa === "PJ" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTipoPessoa("PJ");
                      setNewCliente((prev) => ({ ...prev, cpfCnpj: "" }));
                      setCpfCnpjWarning("");
                    }}
                    className={tipoPessoa === "PJ" ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white" : ""}
                  >
                    Pessoa Jurídica
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={newCliente.nome}
                    onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                {tipoPessoa === "PF" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="cpfCnpj">CPF *</Label>
                    <Input
                      id="cpfCnpj"
                      value={newCliente.cpfCnpj}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = formatCpf(target.value);
                        handleCpfCnpjChange(target.value);
                      }}
                      onBlur={(e) => checkCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {cpfCnpjWarning && (
                      <p className="text-sm text-amber-600">{cpfCnpjWarning}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="cpfCnpj">CNPJ *</Label>
                    <Input
                      id="cpfCnpj"
                      value={newCliente.cpfCnpj}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = formatCnpj(target.value);
                        handleCpfCnpjChange(target.value);
                      }}
                      onBlur={(e) => checkCpfCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                    {cpfCnpjWarning && (
                      <p className="text-sm text-amber-600">{cpfCnpjWarning}</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={newCliente.telefone}
                      onChange={(e) => setNewCliente({ ...newCliente, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCliente.email}
                      onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={newCliente.cep}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/\D/g, "").slice(0, 8)
                          .replace(/(\d{5})(\d)/, "$1-$2");
                        setNewCliente({ ...newCliente, cep: target.value });
                      }}
                      onBlur={(e) => handleCepLookup(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="flex-1"
                    />
                    {cepLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Logradouro</Label>
                  <Input
                    id="endereco"
                    value={newCliente.endereco}
                    onChange={(e) => setNewCliente({ ...newCliente, endereco: e.target.value })}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={newCliente.bairro}
                      onChange={(e) => setNewCliente({ ...newCliente, bairro: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={newCliente.cidade}
                      onChange={(e) => setNewCliente({ ...newCliente, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={newCliente.estado}
                      onChange={(e) => setNewCliente({ ...newCliente, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={newCliente.numero}
                      onChange={(e) => setNewCliente({ ...newCliente, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="complemento">Compl.</Label>
                    <Input
                      id="complemento"
                      value={newCliente.complemento}
                      onChange={(e) => setNewCliente({ ...newCliente, complemento: e.target.value })}
                      placeholder="Apto, Sala..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="numeroProcesso">Número do Processo *</Label>
              <Input
                id="numeroProcesso"
                value={processo.numeroProcesso}
                onChange={(e) => handleNumeroChange(e.target.value)}
                onBlur={(e) => checkNumeroProcesso(e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
              {numeroProcessoWarning && (
                <p className="text-sm text-amber-600">{numeroProcessoWarning}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Tipo de Processo *</Label>
              <Select
                value={processo.tipoProcesso}
                onValueChange={(value) => setProcesso({ ...processo, tipoProcesso: value ?? "" })}
                items={Object.fromEntries(tiposProcesso.map((t) => [t.valor, t.label]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProcesso.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="tribunal">Tribunal</Label>
                <Input
                  id="tribunal"
                  value={processo.tribunal}
                  onChange={(e) => setProcesso({ ...processo, tribunal: e.target.value })}
                  placeholder="TJSP, TRT2, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vara">Vara</Label>
                <Input
                  id="vara"
                  value={processo.vara}
                  onChange={(e) => setProcesso({ ...processo, vara: e.target.value })}
                  placeholder="1a Vara Cível"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={processo.observacoes}
                onChange={(e) => setProcesso({ ...processo, observacoes: e.target.value })}
                placeholder="Observações sobre o processo..."
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Responsável *</Label>
              <Select
                value={responsavelId}
                onValueChange={(value) => setResponsavelId(value ?? "")}
                items={Object.fromEntries(usuarios.map((u) => [u.id, u.nome]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dataRevisao">Data de Revisão</Label>
              <div className="flex gap-2">
                <Input
                  id="dataRevisao"
                  type="date"
                  value={dataRevisao}
                  onChange={(e) => setDataRevisao(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-32"
                  placeholder="Horário"
                />
              </div>
              <p className="text-xs text-muted-foreground/60">Horário é opcional</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Atribuir para</Label>
                <label className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
                  <Checkbox
                    checked={paraTodos}
                    onCheckedChange={(checked) => handleParaTodosToggle(checked === true)}
                  />
                  Para todos
                </label>
              </div>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {usuarios.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-2 py-1 transition-colors"
                  >
                    <Checkbox
                      checked={atribuicoes.includes(u.id)}
                      onCheckedChange={() => handleAtribuicaoToggle(u.id)}
                    />
                    <span className="text-foreground/70">{u.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="text-center py-2">
              <p className="text-sm text-foreground/70">
                Processo criado com sucesso!
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Opcionalmente, envie documentos para este processo.
              </p>
            </div>
            {createdProcessoId && (
              <FileUpload
                processoId={createdProcessoId}
                empresaId={empresaId}
                usuarioId={user?.id || ""}
              />
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) {
                onOpenChange(false);
              } else if (step === 4) {
                onCreated();
                onOpenChange(false);
              } else {
                setStep(step - 1);
              }
            }}
            disabled={submitting}
          >
            {step === 1 ? "Cancelar" : step === 4 ? "Pular" : "Voltar"}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            >
              Próximo
            </Button>
          ) : step === 3 ? (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Processo"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                onCreated();
                onOpenChange(false);
              }}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            >
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];

const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.zip";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface UploadedFile {
  name: string;
  size: number;
  uploading: boolean;
  done: boolean;
  error?: string;
}

function FileUploadStep({
  processoId,
  empresaId,
}: {
  processoId: string;
  empresaId: string;
}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (selected: FileList) => {
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > 50 * 1024 * 1024) continue;
      newFiles.push({ name: file.name, size: file.size, uploading: true, done: false });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > 50 * 1024 * 1024) continue;

      const idx = files.length + newFiles.findIndex((f) => f.name === file.name && f.size === file.size);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const tipoArquivo = file.type.includes("pdf")
          ? "PDF"
          : file.type.includes("image")
            ? "IMAGEM"
            : file.type.includes("word") || file.type.includes("document")
              ? "WORD"
              : file.type.includes("excel") || file.type.includes("sheet")
                ? "EXCEL"
                : file.type.includes("zip")
                  ? "ZIP"
                  : "OUTRO";

        const res = await fetch("/api/documentos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresaId,
            processoId,
            usuarioId: "user-1",
            nome: file.name,
            conteudo: base64,
            tipoArquivo,
            mimeType: file.type,
            tamanho: file.size,
          }),
        });

        if (!res.ok) throw new Error("Erro ao enviar");

        setFiles((prev) =>
          prev.map((f, i) => (i === idx ? { ...f, uploading: false, done: true } : f))
        );
      } catch {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === idx ? { ...f, uploading: false, error: "Erro ao enviar" } : f
          )
        );
      }
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors"
      >
        <Upload className="h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium text-foreground/70">
          Arraste arquivos ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          PDF, imagens, Word, Excel, ZIP (máx. 50MB)
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-border p-2"
            >
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {f.name}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {formatFileSize(f.size)}
                  {f.done && " — Enviado"}
                  {f.error && ` — ${f.error}`}
                </p>
              </div>
              {f.uploading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />}
              {!f.uploading && !f.done && !f.error && (
                <button onClick={() => removeFile(idx)} className="text-muted-foreground/60 hover:text-foreground/70">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
