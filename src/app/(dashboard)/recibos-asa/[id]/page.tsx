"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer, ToggleLeft } from "lucide-react";

interface Recibo {
  id: string;
  numero: number;
  valor: number;
  dataPagamento: string;
  pagadorNome: string;
  pagadorCpfCnpj: string;
  pagadorTipoDoc: string;
  servicoPrestado: string;
  servicoTipo?: { id: string; nome: string } | null;
  observacao?: string | null;
  cidadePrestacao: string;
  prestadorNome: string;
  prestadorCpfCnpj: string;
  prestadorTipoDoc: string;
  prestadorCep: string;
  prestadorEndereco: string | null;
  prestadorNumero: string | null;
  prestadorComplemento: string | null;
  prestadorBairro: string | null;
  prestadorCidade: string | null;
  prestadorUf: string | null;
  formaPagamento: string;
  pagamentoDetalhes: Record<string, string> | null;
  status: string;
  ativo: boolean;
  createdAt: string;
}

interface Empresa {
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  logo: string | null;
  telefone: string | null;
  email: string | null;
}

const currencyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const UNIDADES = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];

const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];

const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function extensoGrupo(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return DEZENAS[d] + (u ? " e " + UNIDADES[u] : "");
  }
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (resto === 0) {
    if (c === 1) return "cem";
    return CENTENAS[c];
  }
  if (c === 1) return "cento e " + extensoGrupo(resto);
  return CENTENAS[c] + " e " + extensoGrupo(resto);
}

function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let resultado = "";

  if (inteiro === 0) {
    resultado = "zero";
  } else {
    const grupos: string[] = [];
    let temp = inteiro;

    if (temp >= 1_000_000_000) {
      const bilhoes = Math.floor(temp / 1_000_000_000);
      if (bilhoes === 1) {
        grupos.push("um bilhão");
      } else {
        grupos.push(extensoGrupo(bilhoes) + " bilhões");
      }
      temp %= 1_000_000_000;
    }

    if (temp >= 1_000_000) {
      const milhoes = Math.floor(temp / 1_000_000);
      if (milhoes === 1) {
        grupos.push("um milhão");
      } else {
        grupos.push(extensoGrupo(milhoes) + " milhões");
      }
      temp %= 1_000_000;
    }

    if (temp >= 1_000) {
      const mil = Math.floor(temp / 1_000);
      grupos.push(mil === 1 ? "mil" : extensoGrupo(mil) + " mil");
      temp %= 1_000;
    }

    if (temp > 0) {
      grupos.push(extensoGrupo(temp));
    }

    resultado = grupos.join(", ");
  }

  resultado += inteiro === 1 ? " real" : " reais";

  if (centavos > 0) {
    const centavosStr = extensoGrupo(centavos);
    resultado += " e " + centavosStr + (centavos === 1 ? " centavo" : " centavos");
  }

  return resultado;
}

function formatarFormaPagamento(forma: string): string {
  const mapa: Record<string, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "Pix",
    TRANSFERENCIA: "Transferência Bancária",
    CARTAO_CREDITO: "Cartão de Crédito",
    CARTAO_DEBITO: "Cartão de Débito",
    BOLETO: "Boleto Bancário",
  };
  return mapa[forma] ?? forma;
}

function formatarDetalhesPagamento(forma: string, detalhes: Record<string, string> | null): string {
  if (!detalhes) return "";

  const parts: string[] = [];
  if (forma === "PIX") {
    if (detalhes.favorecido) parts.push(`Favorecido: ${detalhes.favorecido}`);
    if (detalhes.instituicaoBancaria) parts.push(`Instituição: ${detalhes.instituicaoBancaria}`);
    if (detalhes.chave) parts.push(`Chave: ${detalhes.chave}`);
  } else if (forma === "TRANSFERENCIA") {
    if (detalhes.favorecido) parts.push(`Favorecido: ${detalhes.favorecido}`);
    if (detalhes.agencia) parts.push(`Agência: ${detalhes.agencia}`);
    if (detalhes.conta) parts.push(`Conta: ${detalhes.conta}`);
    if (detalhes.instituicaoBancaria) parts.push(`Instituição: ${detalhes.instituicaoBancaria}`);
  } else if (forma === "BOLETO") {
    if (detalhes.dataVencimento) parts.push(`Vencimento: ${format(new Date(detalhes.dataVencimento + "T12:00:00"), "dd/MM/yyyy")}`);
    if (detalhes.bancoEmissor) parts.push(`Banco: ${detalhes.bancoEmissor}`);
    if (detalhes.numeroBoleto) parts.push(`Nº: ${detalhes.numeroBoleto}`);
  }
  return parts.join(" | ");
}

export default function ReciboAsaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [reciboId, setReciboId] = useState("");
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setReciboId(id));
  }, [params]);

  const load = useCallback(async () => {
    if (!reciboId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recibos/${reciboId}`);
      if (!res.ok) {
        router.push("/recibos-asa");
        return;
      }
      const data: Recibo = await res.json();
      setRecibo(data);

      try {
        const empRes = await fetch(`/api/auth/me`);
        if (empRes.ok) {
          const me = await empRes.json();
          const empRes2 = await fetch(`/api/empresas/${me.empresaId}`);
          if (empRes2.ok) setEmpresa(await empRes2.json());
        }
      } catch {
        // silent
      }
    } catch {
      router.push("/recibos-asa");
    } finally {
      setLoading(false);
    }
  }, [reciboId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleAtivo = async () => {
    if (!recibo) return;
    const msg = recibo.ativo
      ? "Tem certeza que deseja inativar este recibo? Ele não aparecerá mais nos indicadores."
      : "Deseja reativar este recibo?";
    if (!confirm(msg)) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/recibos/${recibo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !recibo.ativo }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRecibo(updated);
      }
    } finally {
      setToggling(false);
    }
  };

  if (loading || !recibo) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const localEmissao = [
    recibo.prestadorCidade,
    recibo.prestadorUf,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/recibos-asa")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Recibo #{String(recibo.numero).padStart(4, "0")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {recibo.status === "EMITIDO" ? "EMITIDO" : recibo.status}
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.print()}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>

        <div className="recibo-print bg-white border rounded-xl p-5 max-w-[800px] mx-auto shadow-sm print:shadow-none print:border-0 print:p-0 print:max-w-none">
          <div className="flex items-center border-b pb-4 mb-4">
            <div className="flex-shrink-0">
              {empresa?.logo && (
                <img
                  src={empresa.logo}
                  alt="Logo"
                  className="h-14 object-contain"
                />
              )}
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold tracking-tight">RECIBO DE PAGAMENTO</h2>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-bold text-muted-foreground">
                N° {String(recibo.numero).padStart(4, "0")}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Recebemos de <strong className="text-base">{recibo.pagadorNome}</strong>,
              inscrito(a) no {recibo.pagadorTipoDoc} sob o nº{" "}
              <strong>{recibo.pagadorCpfCnpj}</strong>, o valor de{" "}
              <strong className="text-base">{currencyFmt.format(recibo.valor)}</strong>{" "}
              ({valorPorExtenso(recibo.valor)}), referente a{" "}
              <strong>{recibo.servicoTipo?.nome ?? recibo.servicoPrestado}</strong>
              {recibo.servicoPrestado && recibo.servicoTipo ? `, ${recibo.servicoPrestado}` : ""},{" "}
              prestado(a) na cidade de <strong>{recibo.cidadePrestacao}</strong>, na data
              de <strong>{format(parseISO(recibo.dataPagamento.split("T")[0]), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>.
            </p>

            {recibo.observacao && (
              <div className="border-t pt-3">
                <h3 className="font-semibold mb-1 text-sm">Observação</h3>
                <p className="text-sm whitespace-pre-wrap">{recibo.observacao}</p>
              </div>
            )}

            <div className="border-t pt-3">
              <h3 className="font-semibold mb-1 text-sm">Dados do Prestador</h3>
              <p>
                <strong>{recibo.prestadorNome}</strong>,{" "}
                {recibo.prestadorTipoDoc} nº <strong>{recibo.prestadorCpfCnpj}</strong>
              </p>
              {(recibo.prestadorEndereco || recibo.prestadorCidade) && (
                <p className="text-xs text-muted-foreground">
                  {recibo.prestadorEndereco}
                  {recibo.prestadorNumero && `, ${recibo.prestadorNumero}`}
                  {recibo.prestadorComplemento && ` - ${recibo.prestadorComplemento}`}
                  {recibo.prestadorBairro && ` | ${recibo.prestadorBairro}`}
                  {recibo.prestadorCidade && ` | ${recibo.prestadorCidade}`}
                  {recibo.prestadorUf && ` - ${recibo.prestadorUf}`}
                  {recibo.prestadorCep && ` | CEP: ${recibo.prestadorCep}`}
                </p>
              )}
            </div>

            <div className="border-t pt-3">
              <h3 className="font-semibold mb-1 text-sm">Forma de Pagamento</h3>
              <p className="font-medium">
                {formatarFormaPagamento(recibo.formaPagamento)}
              </p>
              {recibo.pagamentoDetalhes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatarDetalhesPagamento(recibo.formaPagamento, recibo.pagamentoDetalhes as Record<string, string>)}
                </p>
              )}
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                {localEmissao
                  ? `${localEmissao}, `
                  : ""}
                {format(parseISO(recibo.createdAt.split("T")[0]), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
              </p>
            </div>
          </div>

          <div className="mt-12 border-t pt-6">
            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-dashed border-foreground/40 mb-2" />
              <p className="text-sm font-medium">{recibo.pagadorNome}</p>
              <p className="text-xs text-muted-foreground">
                {recibo.pagadorTipoDoc}: {recibo.pagadorCpfCnpj}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 no-print pb-8">
          <Button variant="outline" onClick={() => router.push("/recibos-asa")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleAtivo}
            disabled={toggling}
            className={recibo.ativo ? "text-red-600 border-red-200 hover:bg-red-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ToggleLeft className="h-4 w-4 mr-2" />
            )}
            {recibo.ativo ? "Inativar Recibo" : "Reativar Recibo"}
          </Button>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .recibo-print,
          .recibo-print * {
            visibility: visible;
          }
          .recibo-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 12mm !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 12mm;
            size: A4;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
