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

async function imageToBase64(url: string): Promise<{ base64: string; type: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const type = contentType.includes("png") ? "PNG" : "JPEG";
    return { base64, type };
  } catch {
    return null;
  }
}

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
      tipo: "EXCLUSIVO",
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
      select: { nome: true, cnpj: true, endereco: true, cidade: true, uf: true, logoExclusiva: true },
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
        [`Relatório de Recibos Exclusivos — ${empresa?.nome || ""}`],
        [`Período: ${dataInicio || "Início"} a ${dataFim || "Fim"}`],
        [],
        ["Nº", "Data", "Pagador", "CPF/CNPJ", "Serviço", "Valor", "Forma Pgto"],
        ...tableData,
        [],
        ["", "", "", "", "TOTAL", currencyFmt(totalValor), ""],
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Recibos Exclusivos");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=recibos_exclusivos_${new Date().toISOString().slice(0, 10)}.xlsx`,
        },
      });
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 14;
    const marginRight = 14;

    let yPos = 14;

    if (empresa?.logoExclusiva) {
      const logoData = await imageToBase64(empresa.logoExclusiva);
      if (logoData) {
        try {
          doc.addImage(
            `data:image/${logoData.type.toLowerCase()};base64,${logoData.base64}`,
            logoData.type,
            marginLeft,
            yPos,
            20,
            20
          );
        } catch {
          // logo failed to load, skip
        }
      }
    }

    const titleX = empresa?.logoExclusiva ? marginLeft + 24 : marginLeft;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Recibos Exclusivos", titleX, yPos + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(empresa?.nome || "", titleX, yPos + 15);

    if (empresa?.cnpj) {
      doc.text(`CNPJ: ${empresa.cnpj}`, titleX, yPos + 20);
    }

    const enderecoParts = [empresa?.endereco, empresa?.cidade, empresa?.uf].filter(Boolean);
    if (enderecoParts.length > 0) {
      doc.text(enderecoParts.join(", "), titleX, yPos + 25);
    }

    yPos += 32;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);

    yPos += 6;

    const periodo = `Período: ${dataInicio || "Início"} a ${dataFim || "Fim"}`;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(periodo, marginLeft, yPos);

    const totalText = `Total: ${currencyFmt(totalValor)}`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.setFont("helvetica", "bold");
    doc.text(totalText, pageWidth - marginRight - totalWidth, yPos);

    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Nº", "Data", "Pagador", "CPF/CNPJ", "Serviço", "Valor", "Forma Pgto"]],
      body: tableData,
      foot: [["", "", "", "", "TOTAL", currencyFmt(totalValor), ""]],
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [139, 92, 246], fontSize: 7 },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 20 },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 22 },
      },
      margin: { left: marginLeft, right: marginRight },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageH - 8,
        { align: "center" }
      );
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=recibos_exclusivos_${new Date().toISOString().slice(0, 10)}.pdf`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de recibos exclusivos:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório de recibos exclusivos" },
      { status: 500 }
    );
  }
}
