import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const currencyFmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString("pt-BR");

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const servicoTipoId = searchParams.get("servicoTipoId");
    const formato = searchParams.get("formato") || "pdf";

    const where: Record<string, unknown> = {
      empresaId: user.empresaId,
      ativo: true,
    };

    if (dataInicio || dataFim) {
      where.dataPagamento = {};
      if (dataInicio) {
        (where.dataPagamento as Record<string, unknown>).gte = new Date(dataInicio);
      }
      if (dataFim) {
        (where.dataPagamento as Record<string, unknown>).lte = new Date(dataFim);
      }
    }

    if (servicoTipoId) {
      where.servicoTipoId = servicoTipoId;
    }

    const recibos = await prisma.recibo.findMany({
      where,
      include: { servicoTipo: true },
      orderBy: { numero: "asc" },
    });

    const totalValor = recibos.reduce((acc, r) => acc + r.valor, 0);

    const empresa = await prisma.empresa.findUnique({
      where: { id: user.empresaId },
      select: { nome: true, cnpj: true, endereco: true, cidade: true, uf: true },
    });

    const tableData = recibos.map((r) => [
      String(r.numero).padStart(4, "0"),
      formatDate(r.dataPagamento),
      r.pagadorNome,
      r.pagadorCpfCnpj,
      r.servicoTipo?.nome ?? r.servicoPrestado ?? "—",
      currencyFmt(r.valor),
      r.formaPagamento.replace("_", " "),
    ]);

    if (formato === "excel") {
      const ws = XLSX.utils.aoa_to_sheet([
        [`Relatório de Recibos — ${empresa?.nome || ""}`],
        [`Período: ${dataInicio || "Início"} a ${dataFim || "Fim"}`],
        [],
        ["Nº", "Data", "Pagador", "CPF/CNPJ", "Serviço", "Valor", "Forma Pgto"],
        ...tableData,
        [],
        ["", "", "", "", "TOTAL", currencyFmt(totalValor), ""],
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Recibos");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=recibos_${new Date().toISOString().slice(0, 10)}.xlsx`,
        },
      });
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Recibos", 14, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${empresa?.nome || ""} ${empresa?.cnpj ? `| CNPJ: ${empresa.cnpj}` : ""}`, 14, 22);

    const periodo = `Período: ${dataInicio || "Início"} a ${dataFim || "Fim"}`;
    doc.text(periodo, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [["Nº", "Data", "Pagador", "CPF/CNPJ", "Serviço", "Valor", "Forma Pgto"]],
      body: tableData,
      foot: [["", "", "", "", "TOTAL", currencyFmt(totalValor), ""]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [139, 92, 246] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=recibos_${new Date().toISOString().slice(0, 10)}.pdf`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
