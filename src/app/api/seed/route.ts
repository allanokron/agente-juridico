import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

export async function POST() {
  try {
    // Delete all data in dependency order
    await prisma.historico.deleteMany();
    await prisma.evento.deleteMany();
    await prisma.kanbanCard.deleteMany();
    await prisma.processoAtribuicao.deleteMany();
    await prisma.documento.deleteMany();
    await prisma.processo.deleteMany();
    await prisma.anotacao.deleteMany();
    await prisma.log.deleteMany();
    await prisma.notificacao.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.etapasKanban.deleteMany();
    await prisma.cargo.deleteMany();
    await prisma.empresa.deleteMany();

    // Create empresa
    await prisma.empresa.create({
      data: {
        id: "empresa-1",
        nome: "Silva & Associados",
        cnpj: "12.345.678/0001-90",
        email: "contato@silva.com",
        telefone: "(11) 3333-4567",
      },
    });

    // Create cargo
    await prisma.cargo.create({
      data: {
        id: "cargo-1",
        empresaId: "empresa-1",
        nome: "Administrador",
        permissoes: {
          processos: { criar: true, editar: true, excluir: true, moverKanban: true },
          clientes: { criar: true, editar: true, excluir: true },
          documentos: { anexar: true, excluir: true },
          equipe: { gerenciar: true },
          etapas: { gerenciar: true },
          geral: { alterarDatas: true, visualizarRelatorios: true },
        },
      },
    });

    // Create usuario
    await prisma.usuario.create({
      data: {
        id: "user-1",
        empresaId: "empresa-1",
        cargoId: "cargo-1",
        nome: "Dr. João Silva",
        email: "teste@agentejuridico",
        senha: hashSync("123456", 10),
        role: "ADMINISTRADOR",
      },
    });

    // Create kanban etapas
    const etapas = await Promise.all([
      prisma.etapasKanban.create({
        data: {
          id: "etapa-novo",
          empresaId: "empresa-1",
          nome: "Novo Processo",
          cor: "#6b7280",
          ordem: 0,
          fixa: true,
          obrigatorioData: true,
        },
      }),
      prisma.etapasKanban.create({
        data: {
          id: "etapa-1",
          empresaId: "empresa-1",
          nome: "Triagem",
          cor: "#6366f1",
          ordem: 1,
        },
      }),
      prisma.etapasKanban.create({
        data: {
          id: "etapa-2",
          empresaId: "empresa-1",
          nome: "Análise",
          cor: "#f59e0b",
          ordem: 2,
        },
      }),
      prisma.etapasKanban.create({
        data: {
          id: "etapa-3",
          empresaId: "empresa-1",
          nome: "Audiência",
          cor: "#ef4444",
          ordem: 3,
        },
      }),
      prisma.etapasKanban.create({
        data: {
          id: "etapa-4",
          empresaId: "empresa-1",
          nome: "Protocolo",
          cor: "#3b82f6",
          ordem: 4,
        },
      }),
      prisma.etapasKanban.create({
        data: {
          id: "etapa-5",
          empresaId: "empresa-1",
          nome: "Finalizado",
          cor: "#22c55e",
          ordem: 5,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Seed executado com sucesso!",
      data: {
        empresas: 1,
        cargos: 1,
        usuarios: 1,
        etapas: etapas.length,
      },
    });
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    return NextResponse.json(
      { error: "Erro ao executar seed", details: String(error) },
      { status: 500 }
    );
  }
}
