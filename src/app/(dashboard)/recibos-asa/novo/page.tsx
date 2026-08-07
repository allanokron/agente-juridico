"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";
import { CpfCnpjInput } from "@/components/shared/cpf-cnpj-input";

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string | null;
}

interface ServicoTipo {
  id: string;
  nome: string;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
}

type FormaPgto = "DINHEIRO" | "PIX" | "TRANSFERENCIA" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "BOLETO";

interface PagamentoDetalhes {
  favorecido?: string;
  instituicaoBancaria?: string;
  chave?: string;
  agencia?: string;
  conta?: string;
  dataVencimento?: string;
  bancoEmissor?: string;
  numeroBoleto?: string;
}

export default function NovoReciboAsaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicosTipo, setServicosTipo] = useState<ServicoTipo[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [pagadorModo, setPagadorModo] = useState<"cadastrado" | "manual">("cadastrado");
  const [clienteId, setClienteId] = useState("");
  const [pagadorNome, setPagadorNome] = useState("");
  const [pagadorCpfCnpj, setPagadorCpfCnpj] = useState("");
  const [pagadorTipoDoc, setPagadorTipoDoc] = useState<"CPF" | "CNPJ">("CPF");

  const [observacaoServico, setObservacaoServico] = useState("");
  const [observacao, setObservacao] = useState("");
  const [servicoTipoId, setServicoTipoId] = useState("");
  const [cidadePrestacao, setCidadePrestacao] = useState("");
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [valor, setValor] = useState("");

  const [prestadorNome, setPrestadorNome] = useState("");
  const [prestadorCpfCnpj, setPrestadorCpfCnpj] = useState("");
  const [prestadorTipoDoc, setPrestadorTipoDoc] = useState<"CPF" | "CNPJ">("CNPJ");
  const [prestadorCep, setPrestadorCep] = useState("");
  const [prestadorEndereco, setPrestadorEndereco] = useState("");
  const [prestadorNumero, setPrestadorNumero] = useState("");
  const [prestadorComplemento, setPrestadorComplemento] = useState("");
  const [prestadorBairro, setPrestadorBairro] = useState("");
  const [prestadorCidade, setPrestadorCidade] = useState("");
  const [prestadorUf, setPrestadorUf] = useState("");

  const [formaPagamento, setFormaPagamento] = useState<FormaPgto>("DINHEIRO");
  const [pagamentoDetalhes, setPagamentoDetalhes] = useState<PagamentoDetalhes>({});

  const fetchInitialData = useCallback(async () => {
    if (!user?.empresaId) return;
    try {
      const [clientesRes, servicosRes, empresaRes] = await Promise.all([
        fetch(`/api/clientes?empresaId=${user.empresaId}`),
        fetch("/api/servicos-tipo?tipo=EXCLUSIVO"),
        fetch(`/api/empresas/${user.empresaId}`),
      ]);
      if (clientesRes.ok) setClientes(await clientesRes.json());
      if (servicosRes.ok) setServicosTipo(await servicosRes.json());
      if (empresaRes.ok) {
        const emp: Empresa = await empresaRes.json();
        setPrestadorNome(emp.nome);
        setPrestadorCpfCnpj(emp.cnpj ?? "");
      }
    } catch {
      toast.error("Erro ao carregar dados iniciais");
    }
  }, [user?.empresaId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (pagadorModo === "cadastrado" && clienteId) {
      const cliente = clientes.find((c) => c.id === clienteId);
      if (cliente) {
        setPagadorNome(cliente.nome);
        setPagadorCpfCnpj(cliente.cpfCnpj ?? "");
        const doc = cliente.cpfCnpj ?? "";
        setPagadorTipoDoc(doc.length > 14 ? "CNPJ" : "CPF");
      }
    }
  }, [clienteId, clientes, pagadorModo]);

  useEffect(() => {
    if (pagadorModo === "cadastrado") {
      setPagadorNome("");
      setPagadorCpfCnpj("");
    }
  }, [pagadorModo]);

  const handleCepBlur = async () => {
    const cleanCep = prestadorCep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setPrestadorEndereco(data.logradouro || "");
        setPrestadorBairro(data.bairro || "");
        setPrestadorCidade(data.localidade || "");
        setPrestadorUf(data.uf || "");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch {
      toast.error("Erro ao buscar CEP");
    }
  };

  const handleServicoSelect = (id: string | null) => {
    const val = id ?? "";
    setServicoTipoId(val);
  };

  const parseValor = (v: string): number => {
    const cleaned = v.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async () => {
    const parsedValor = parseValor(valor);
    if (!parsedValor || parsedValor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (!pagadorNome.trim()) {
      toast.error("Informe o nome do pagador");
      return;
    }
    if (!pagadorCpfCnpj.trim()) {
      toast.error("Informe o CPF/CNPJ do pagador");
      return;
    }
    if (!servicoTipoId) {
      toast.error("Selecione o tipo de serviço");
      return;
    }
    if (!cidadePrestacao.trim()) {
      toast.error("Informe a cidade da prestação");
      return;
    }
    if (!prestadorNome.trim()) {
      toast.error("Informe o nome do prestador");
      return;
    }
    if (!prestadorCpfCnpj.trim()) {
      toast.error("Informe o CPF/CNPJ do prestador");
      return;
    }
    if (!prestadorCep.trim()) {
      toast.error("Informe o CEP do prestador");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/recibos-exclusivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: parsedValor,
          dataPagamento,
          pagadorNome: pagadorNome.trim(),
          pagadorCpfCnpj: pagadorCpfCnpj.trim(),
          pagadorTipoDoc,
          servicoPrestado: observacaoServico.trim() || null,
          servicoTipoId: servicoTipoId || null,
          observacao: observacao.trim() || null,
          cidadePrestacao: cidadePrestacao.trim(),
          prestadorNome: prestadorNome.trim(),
          prestadorCpfCnpj: prestadorCpfCnpj.trim(),
          prestadorTipoDoc,
          prestadorCep: prestadorCep.replace(/\D/g, ""),
          prestadorEndereco: prestadorEndereco || null,
          prestadorNumero: prestadorNumero || null,
          prestadorComplemento: prestadorComplemento || null,
          prestadorBairro: prestadorBairro || null,
          prestadorCidade: prestadorCidade || null,
          prestadorUf: prestadorUf || null,
          formaPagamento,
          pagamentoDetalhes:
            formaPagamento !== "DINHEIRO" &&
            formaPagamento !== "CARTAO_CREDITO" &&
            formaPagamento !== "CARTAO_DEBITO"
              ? pagamentoDetalhes
              : null,
        }),
      });

      if (res.ok) {
        const recibo = await res.json();
        toast.success("Recibo emitido com sucesso!");
        router.push(`/recibos-asa/${recibo.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao emitir recibo");
      }
    } catch {
      toast.error("Erro ao emitir recibo");
    } finally {
      setSubmitting(false);
    }
  };

  const updateDetalhes = (key: keyof PagamentoDetalhes, value: string) => {
    setPagamentoDetalhes((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/recibos-asa")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Novo Recibo Exclusivo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados para emitir um recibo de pagamento exclusivo
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Pagador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select
                value={pagadorModo}
                onValueChange={(v) => setPagadorModo(v as "cadastrado" | "manual")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cadastrado">Selecionar cliente cadastrado</SelectItem>
                  <SelectItem value="manual">Preencher manualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pagadorModo === "cadastrado" && (
              <div className="grid gap-2">
                <Label>Selecionar Cliente</Label>
                <Select
                  value={clienteId}
                  onValueChange={(v) => setClienteId(v ?? "")}
                  items={clientes.map((c) => ({
                    value: c.id,
                    label: `${c.nome}${c.cpfCnpj ? ` - ${c.cpfCnpj}` : ""}`,
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.cpfCnpj ? `- ${c.cpfCnpj}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nome do Pagador *</Label>
                <Input
                  value={pagadorNome}
                  onChange={(e) => setPagadorNome(e.target.value)}
                  placeholder="Nome completo"
                  disabled={pagadorModo === "cadastrado" && !!clienteId}
                />
              </div>
              <div className="grid gap-2">
                <Label>CPF/CNPJ *</Label>
                <div className="flex gap-2">
                  <Select
                    value={pagadorTipoDoc}
                    onValueChange={(v) => setPagadorTipoDoc(v as "CPF" | "CNPJ")}
                  >
                    <SelectTrigger className="w-[100px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                  <CpfCnpjInput
                    tipo={pagadorTipoDoc}
                    value={pagadorCpfCnpj}
                    onChange={setPagadorCpfCnpj}
                    disabled={pagadorModo === "cadastrado" && !!clienteId}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tipo de Serviço *</Label>
              <Select
                value={servicoTipoId}
                onValueChange={handleServicoSelect}
                items={servicosTipo.map((s) => ({
                  value: s.id,
                  label: s.nome,
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicosTipo.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Observação</Label>
              <textarea
                value={observacaoServico}
                onChange={(e) => setObservacaoServico(e.target.value)}
                placeholder="Observações adicionais sobre o serviço (opcional)"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-2">
              <Label>Observação no Recibo</Label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Texto livre que aparecerá no recibo (opcional)"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cidade da Prestação *</Label>
                <Input
                  value={cidadePrestacao}
                  onChange={(e) => setCidadePrestacao(e.target.value)}
                  placeholder="Cidade/UF"
                />
              </div>
              <div className="grid gap-2">
                <Label>Data do Pagamento *</Label>
                <Input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2 md:w-1/2">
              <Label>Valor (R$) *</Label>
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                type="text"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Prestador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input
                  value={prestadorNome}
                  onChange={(e) => setPrestadorNome(e.target.value)}
                  placeholder="Nome do prestador"
                />
              </div>
              <div className="grid gap-2">
                <Label>CPF/CNPJ *</Label>
                <div className="flex gap-2">
                  <Select
                    value={prestadorTipoDoc}
                    onValueChange={(v) => setPrestadorTipoDoc(v as "CPF" | "CNPJ")}
                  >
                    <SelectTrigger className="w-[100px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                  <CpfCnpjInput
                    tipo={prestadorTipoDoc}
                    value={prestadorCpfCnpj}
                    onChange={setPrestadorCpfCnpj}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>CEP *</Label>
                <Input
                  value={prestadorCep}
                  onChange={(e) => setPrestadorCep(e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Rua</Label>
                <Input
                  value={prestadorEndereco}
                  onChange={(e) => setPrestadorEndereco(e.target.value)}
                  placeholder="Logradouro"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label>Bairro</Label>
                <Input
                  value={prestadorBairro}
                  onChange={(e) => setPrestadorBairro(e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="grid gap-2">
                <Label>Número</Label>
                <Input
                  value={prestadorNumero}
                  onChange={(e) => setPrestadorNumero(e.target.value)}
                  placeholder="Nº"
                />
              </div>
              <div className="grid gap-2">
                <Label>Complemento</Label>
                <Input
                  value={prestadorComplemento}
                  onChange={(e) => setPrestadorComplemento(e.target.value)}
                  placeholder="Apto, Sala, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label>Cidade</Label>
                <Input
                  value={prestadorCidade}
                  onChange={(e) => setPrestadorCidade(e.target.value)}
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label>UF</Label>
                <Input
                  value={prestadorUf}
                  onChange={(e) => setPrestadorUf(e.target.value)}
                  placeholder="UF"
                  className="w-16"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 grid-cols-3 md:grid-cols-6">
              {([
                { value: "DINHEIRO", label: "Dinheiro" },
                { value: "PIX", label: "Pix" },
                { value: "TRANSFERENCIA", label: "Transferência" },
                { value: "CARTAO_CREDITO", label: "Cartão Crédito" },
                { value: "CARTAO_DEBITO", label: "Cartão Débito" },
                { value: "BOLETO", label: "Boleto" },
              ] as const).map((fp) => (
                <Button
                  key={fp.value}
                  variant={formaPagamento === fp.value ? "default" : "outline"}
                  onClick={() => setFormaPagamento(fp.value)}
                  className={
                    formaPagamento === fp.value
                      ? "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                      : ""
                  }
                >
                  {fp.label}
                </Button>
              ))}
            </div>

            <Separator />

            {formaPagamento === "PIX" && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Favorecido</Label>
                  <Input
                    value={pagamentoDetalhes.favorecido ?? ""}
                    onChange={(e) => updateDetalhes("favorecido", e.target.value)}
                    placeholder="Nome do favorecido"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Instituição Bancária</Label>
                  <Input
                    value={pagamentoDetalhes.instituicaoBancaria ?? ""}
                    onChange={(e) => updateDetalhes("instituicaoBancaria", e.target.value)}
                    placeholder="Ex: Banco do Brasil"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Chave Pix</Label>
                  <Input
                    value={pagamentoDetalhes.chave ?? ""}
                    onChange={(e) => updateDetalhes("chave", e.target.value)}
                    placeholder="Chave Pix"
                  />
                </div>
              </div>
            )}

            {formaPagamento === "TRANSFERENCIA" && (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Favorecido</Label>
                  <Input
                    value={pagamentoDetalhes.favorecido ?? ""}
                    onChange={(e) => updateDetalhes("favorecido", e.target.value)}
                    placeholder="Nome do favorecido"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Agência</Label>
                  <Input
                    value={pagamentoDetalhes.agencia ?? ""}
                    onChange={(e) => updateDetalhes("agencia", e.target.value)}
                    placeholder="0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Conta</Label>
                  <Input
                    value={pagamentoDetalhes.conta ?? ""}
                    onChange={(e) => updateDetalhes("conta", e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Instituição Bancária</Label>
                  <Input
                    value={pagamentoDetalhes.instituicaoBancaria ?? ""}
                    onChange={(e) => updateDetalhes("instituicaoBancaria", e.target.value)}
                    placeholder="Ex: Itaú Unibanco"
                  />
                </div>
              </div>
            )}

            {formaPagamento === "BOLETO" && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={pagamentoDetalhes.dataVencimento ?? ""}
                    onChange={(e) => updateDetalhes("dataVencimento", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Banco Emissor</Label>
                  <Input
                    value={pagamentoDetalhes.bancoEmissor ?? ""}
                    onChange={(e) => updateDetalhes("bancoEmissor", e.target.value)}
                    placeholder="Ex: Bradesco"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Número do Boleto</Label>
                  <Input
                    value={pagamentoDetalhes.numeroBoleto ?? ""}
                    onChange={(e) => updateDetalhes("numeroBoleto", e.target.value)}
                    placeholder="Número"
                  />
                </div>
              </div>
            )}

            {(formaPagamento === "DINHEIRO" ||
              formaPagamento === "CARTAO_CREDITO" ||
              formaPagamento === "CARTAO_DEBITO") && (
              <p className="text-sm text-muted-foreground">
                Nenhum campo adicional necessário para esta forma de pagamento.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/recibos-asa")}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Gerar Recibo
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
