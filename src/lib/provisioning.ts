import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type ProvisionInput = {
  leadId?: string | null;
  nome: string;
  cnpj?: string | null;
  email: string;
  telefone?: string | null;
  endereco?: string | null;
  masterNome: string;
  masterEmail: string;
  masterTelefone?: string | null;
  origin: string;
  adminId: string;
};

const etapasPadrao = [
  { nome: "Triagem", cor: "#3B82F6", ordem: 1 },
  { nome: "Análise", cor: "#F59E0B", ordem: 2 },
  { nome: "Audiência", cor: "#EF4444", ordem: 3 },
  { nome: "Protocolo", cor: "#8B5CF6", ordem: 4 },
  { nome: "Finalizado", cor: "#10B981", ordem: 5 },
];

export async function provisionarEmpresa(input: ProvisionInput) {
  const email = input.email.trim().toLowerCase();
  const masterEmail = input.masterEmail.trim().toLowerCase();
  const cnpj = input.cnpj?.replace(/\D/g, "") || null;

  const existing = await prisma.empresa.findFirst({
    where: {
      OR: [
        ...(input.leadId ? [{ leadOrigemId: input.leadId }] : []),
        ...(cnpj ? [{ cnpj }] : []),
        { masterUser: { email: masterEmail } },
      ],
    },
    include: { masterUser: true },
  });

  if (existing?.provisionamentoStatus === "PRONTO") {
    throw new Error("Este escritório já possui um ambiente ativo.");
  }

  const empresa =
    existing ||
    (await prisma.$transaction(async (tx) => {
      if (input.leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: input.leadId },
          select: { id: true, empresaConvertida: { select: { id: true } } },
        });
        if (!lead) throw new Error("Lead não encontrado.");
        if (lead.empresaConvertida) {
          throw new Error("Este lead já foi convertido.");
        }
      }

      const created = await tx.empresa.create({
        data: {
          nome: input.nome.trim(),
          cnpj,
          email,
          telefone: input.telefone?.trim() || null,
          endereco: input.endereco?.trim() || null,
          ativo: false,
          provisionamentoStatus: "PROCESSANDO",
          leadOrigemId: input.leadId || null,
        },
      });

      const master = await tx.usuario.create({
        data: {
          empresaId: created.id,
          nome: input.masterNome.trim(),
          email: masterEmail,
          telefone: input.masterTelefone?.trim() || null,
          role: "ADMINISTRADOR",
          ativo: false,
          senha: null,
        },
      });

      await Promise.all([
        tx.empresa.update({
          where: { id: created.id },
          data: { masterUserId: master.id },
        }),
        tx.cargo.create({
          data: {
            empresaId: created.id,
            nome: "Administrador",
            permissoes: {
              processos: { visualizar: true, criar: true, editar: true },
              clientes: { visualizar: true, criar: true, editar: true },
              equipe: { visualizar: true, criar: true, editar: true },
            },
          },
        }),
        tx.etapasKanban.createMany({
          data: etapasPadrao.map((etapa) => ({
            empresaId: created.id,
            ...etapa,
            fixa: etapa.nome === "Finalizado",
          })),
        }),
        tx.log.create({
          data: {
            usuarioId: input.adminId,
            empresaId: created.id,
            acao: "EMPRESA_PROVISIONAMENTO_INICIADO",
            entidade: "Empresa",
            entidadeId: created.id,
          },
        }),
      ]);

      return tx.empresa.findUniqueOrThrow({
        where: { id: created.id },
        include: { masterUser: true },
      });
    }));

  if (!empresa.masterUser) {
    throw new Error("Usuário master não foi configurado.");
  }

  await prisma.empresa.update({
    where: { id: empresa.id },
    data: {
      provisionamentoStatus: "PROCESSANDO",
      provisionamentoErro: null,
    },
  });

  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: empresa.masterUser.email,
      expiresInDays: 30,
      notify: true,
      redirectUrl: `${input.origin}/cadastro`,
      publicMetadata: {
        appUserId: empresa.masterUser.id,
        empresaId: empresa.id,
        master: true,
      },
    });

    return await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: empresa.masterUser!.id },
        data: {
          clerkInvitationId: invitation.id,
          conviteEnviadoEm: new Date(),
        },
      });
      const ready = await tx.empresa.update({
        where: { id: empresa.id },
        data: {
          ativo: true,
          provisionamentoStatus: "PRONTO",
          provisionamentoErro: null,
        },
        include: {
          masterUser: {
            select: { id: true, nome: true, email: true, ativo: true },
          },
        },
      });
      if (empresa.leadOrigemId) {
        await tx.lead.update({
          where: { id: empresa.leadOrigemId },
          data: {
            status: "GANHO",
            atividades: {
              create: {
                autorId: input.adminId,
                tipo: "CONVERSAO",
                descricao: `Ambiente ${empresa.nome} criado e convite enviado ao usuário master.`,
              },
            },
          },
        });
      }
      await tx.log.create({
        data: {
          usuarioId: input.adminId,
          empresaId: empresa.id,
          acao: "EMPRESA_PROVISIONADA",
          entidade: "Empresa",
          entidadeId: empresa.id,
        },
      });
      return ready;
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar convite no Clerk";
    await prisma.empresa.update({
      where: { id: empresa.id },
      data: {
        ativo: false,
        provisionamentoStatus: "FALHA",
        provisionamentoErro: message.slice(0, 2000),
      },
    });
    throw error;
  }
}
