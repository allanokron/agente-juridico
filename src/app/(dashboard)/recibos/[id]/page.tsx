"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";

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
  cidadePrestacao: string;
  prestadorNome: string;
  prestadorCpfCnpj: string;
  prestadorTipoDoc: string;
  prestadorCep: string;
  prestadorEndereco: string | null;
  prestadorCidade: string | null;
  prestadorUf: string | null;
  formaPagamento: string;
  pagamentoDetalhes: Record<string, string> | null;
  status: string;
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
  if (resto === 0) return CENTENAS[c];
  if (c === 1) return "cento e " + extensoGrupo(resto);
  return CENTENAS[c] + " e " + extensoGrupo(resto);
}

function valorPorExtenso(valor: number): string {
  if (valor === 0) return "zero reais";

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  const grupos: string[] = [];
  let temp = inteiro;

  if (temp >= 1_000_000_000) {
    const bilhoes = Math.floor(temp / 1_000_000_000);
    grupos.push(
      bilhoes === 1 ? "um bilhão" : extensoGrupo(bilhoes) + " bilhões"
    );
    temp %= 1_000_000_000;
  }

  if (temp >= 1_000_000) {
    const milhoes = Math.floor(temp / 1_000_000);
    grupos.push(
      milhoes === 1 ? "um milhão" : extensoGrupo(milhoes) + " milhões"
    );
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

  let resultado = grupos.join(", ");
  if (inteiro !== 0) {
    resultado += inteiro === 1 ? " real" : " reais";
  }

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

export default function ReciboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [reciboId, setReciboId] = useState("");
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => setReciboId(id));
  }, [params]);

  const load = useCallback(async () => {
    if (!reciboId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recibos/${reciboId}`);
      if (!res.ok) {
        router.push("/recibos");
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
      router.push("/recibos");
    } finally {
      setLoading(false);
    }
  }, [reciboId, router]);

  useEffect(() => {
    void load();
  }, [load]);

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
            <Button variant="ghost" size="icon" onClick={() => router.push("/recibos")}>
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

        <div className="recibo-print bg-white border rounded-xl p-8 max-w-[800px] mx-auto shadow-sm print:shadow-none print:border-0 print:p-0 print:max-w-none">
          <div className="text-center border-b pb-6 mb-6">
            {empresa?.logo && (
              <img
                src={empresa.logo}
                alt="Logo"
                className="h-16 mx-auto mb-4 object-contain"
              />
            )}
            <h2 className="text-3xl font-bold tracking-tight">RECIBO DE PAGAMENTO</h2>
            <p className="text-lg text-muted-foreground mt-2">
              N° {String(recibo.numero).padStart(4, "0")}
            </p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              Recebi de <strong className="text-base">{recibo.pagadorNome}</strong>,
              inscrito(a) no {recibo.pagadorTipoDoc} sob o nº{" "}
              <strong>{recibo.pagadorCpfCnpj}</strong>, o valor de{" "}
              <strong className="text-base">{currencyFmt.format(recibo.valor)}</strong>{" "}
              ({valorPorExtenso(recibo.valor)}), referente a{" "}
              <strong>{recibo.servicoPrestado}</strong>
              {recibo.servicoTipo ? ` (${recibo.servicoTipo.nome})` : ""},{" "}
              prestado(a) na cidade de <strong>{recibo.cidadePrestacao}</strong>, na data
              de <strong>{format(new Date(recibo.dataPagamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>.
            </p>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Dados do Prestador</h3>
              <p>
                <strong>{recibo.prestadorNome}</strong>,{" "}
                {recibo.prestadorTipoDoc} nº <strong>{recibo.prestadorCpfCnpj}</strong>
              </p>
              {recibo.prestadorEndereco && (
                <p>
                  {recibo.prestadorEndereco}
                  {recibo.prestadorCidade && `, ${recibo.prestadorCidade}`}
                  {recibo.prestadorUf && ` - ${recibo.prestadorUf}`}
                  {recibo.prestadorCep && ` | CEP: ${recibo.prestadorCep}`}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Forma de Pagamento</h3>
              <p className="font-medium">
                {formatarFormaPagamento(recibo.formaPagamento)}
              </p>
              {recibo.pagamentoDetalhes && (
                <p className="text-muted-foreground mt-1">
                  {formatarDetalhesPagamento(recibo.formaPagamento, recibo.pagamentoDetalhes as Record<string, string>)}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-muted-foreground">
                {localEmissao
                  ? `${localEmissao}, `
                  : ""}
                {format(new Date(recibo.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
              </p>
            </div>
          </div>

          <div className="mt-16 border-t pt-8">
            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-dashed border-foreground/40 mb-2" />
              <p className="text-sm font-medium">{recibo.pagadorNome}</p>
              <p className="text-xs text-muted-foreground">
                {recibo.pagadorTipoDoc}: {recibo.pagadorCpfCnpj}
              </p>
            </div>
          </div>

          {empresa && (
            <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-sm">{empresa.nome}</p>
              {empresa.cnpj && <p>CNPJ: {empresa.cnpj}</p>}
              {empresa.endereco && <p>{empresa.endereco}{empresa.cidade ? `, ${empresa.cidade}` : ""}{empresa.uf ? ` - ${empresa.uf}` : ""}</p>}
              {empresa.telefone && <p>Tel: {empresa.telefone}</p>}
              {empresa.email && <p>{empresa.email}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 no-print pb-8">
          <Button variant="outline" onClick={() => router.push("/recibos")}>
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
            padding: 20mm !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
