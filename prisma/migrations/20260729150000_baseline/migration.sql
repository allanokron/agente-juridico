-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'ADMINISTRADOR', 'ADVOGADO', 'ASSISTENTE', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "public"."StatusEvento" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'REAGENDADO');

-- CreateEnum
CREATE TYPE "public"."StatusProcesso" AS ENUM ('ATIVO', 'SUSPENSO', 'ARQUIVADO', 'EM_ANDAMENTO', 'FINALIZADO', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "public"."TipoArquivo" AS ENUM ('PDF', 'IMAGEM', 'WORD', 'EXCEL', 'ZIP', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."TipoEvento" AS ENUM ('AUDIENCIA', 'PRAZO', 'REUNIAO', 'PROTOCOLO', 'LEMBRETE', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "public"."TipoProcesso" AS ENUM ('CIVIL', 'CRIMINAL', 'TRABALHISTA', 'ADMINISTRATIVO', 'TRIBUTARIO', 'FAMILIAR', 'EMPRESARIAL', 'CONSUMIDOR', 'AMBIENTAL', 'PREVIDENCIARIO', 'OUTRO');

-- CreateTable
CREATE TABLE "public"."anotacoes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "titulo" TEXT,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cargos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "permissoes" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clientes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documentos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "processoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoArquivo" "public"."TipoArquivo" NOT NULL,
    "url" TEXT NOT NULL,
    "conteudo" TEXT,
    "tamanho" INTEGER,
    "tamanhoKb" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "logo" TEXT,
    "plano" TEXT NOT NULL DEFAULT 'free',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."etapas_kanban" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "ordem" INTEGER NOT NULL,
    "fixa" BOOLEAN NOT NULL DEFAULT false,
    "obrigatorioData" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapas_kanban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."eventos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "processoId" TEXT,
    "clienteId" TEXT,
    "responsavelId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "hora" TEXT,
    "tipo" "public"."TipoEvento" NOT NULL,
    "prioridade" "public"."Prioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "public"."StatusEvento" NOT NULL DEFAULT 'PENDENTE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historicos" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT,
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kanban_cards" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "dataRevisao" TIMESTAMP(3),
    "hora" TEXT,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."logs" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "detalhes" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificacoes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "limiteUsuarios" INTEGER NOT NULL,
    "limiteProcessos" INTEGER,
    "limiteArmazenamento" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processo_atribuicoes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processo_atribuicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "numeroProcesso" TEXT,
    "tribunal" TEXT,
    "vara" TEXT,
    "status" "public"."StatusProcesso" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipoProcesso" TEXT NOT NULL,

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tipos_processo_custom" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_processo_custom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clerkId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "telefone" TEXT,
    "avatar" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'ADVOGADO',
    "cargoId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anotacoes_processoId_idx" ON "public"."anotacoes"("processoId" ASC);

-- CreateIndex
CREATE INDEX "cargos_empresaId_idx" ON "public"."cargos"("empresaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "cargos_empresaId_nome_key" ON "public"."cargos"("empresaId" ASC, "nome" ASC);

-- CreateIndex
CREATE INDEX "clientes_cpfCnpj_idx" ON "public"."clientes"("cpfCnpj" ASC);

-- CreateIndex
CREATE INDEX "clientes_empresaId_idx" ON "public"."clientes"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "documentos_empresaId_idx" ON "public"."documentos"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "documentos_processoId_idx" ON "public"."documentos"("processoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "public"."empresas"("cnpj" ASC);

-- CreateIndex
CREATE INDEX "etapas_kanban_empresaId_idx" ON "public"."etapas_kanban"("empresaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "etapas_kanban_empresaId_nome_key" ON "public"."etapas_kanban"("empresaId" ASC, "nome" ASC);

-- CreateIndex
CREATE INDEX "eventos_data_idx" ON "public"."eventos"("data" ASC);

-- CreateIndex
CREATE INDEX "eventos_empresaId_idx" ON "public"."eventos"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "eventos_processoId_idx" ON "public"."eventos"("processoId" ASC);

-- CreateIndex
CREATE INDEX "eventos_responsavelId_idx" ON "public"."eventos"("responsavelId" ASC);

-- CreateIndex
CREATE INDEX "historicos_processoId_idx" ON "public"."historicos"("processoId" ASC);

-- CreateIndex
CREATE INDEX "historicos_usuarioId_idx" ON "public"."historicos"("usuarioId" ASC);

-- CreateIndex
CREATE INDEX "kanban_cards_empresaId_idx" ON "public"."kanban_cards"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "kanban_cards_etapaId_idx" ON "public"."kanban_cards"("etapaId" ASC);

-- CreateIndex
CREATE INDEX "kanban_cards_processoId_idx" ON "public"."kanban_cards"("processoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "kanban_cards_processoId_key" ON "public"."kanban_cards"("processoId" ASC);

-- CreateIndex
CREATE INDEX "logs_createdAt_idx" ON "public"."logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "logs_empresaId_idx" ON "public"."logs"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "logs_usuarioId_idx" ON "public"."logs"("usuarioId" ASC);

-- CreateIndex
CREATE INDEX "notificacoes_empresaId_idx" ON "public"."notificacoes"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "notificacoes_usuarioId_idx" ON "public"."notificacoes"("usuarioId" ASC);

-- CreateIndex
CREATE INDEX "processo_atribuicoes_processoId_idx" ON "public"."processo_atribuicoes"("processoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "processo_atribuicoes_processoId_usuarioId_key" ON "public"."processo_atribuicoes"("processoId" ASC, "usuarioId" ASC);

-- CreateIndex
CREATE INDEX "processo_atribuicoes_usuarioId_idx" ON "public"."processo_atribuicoes"("usuarioId" ASC);

-- CreateIndex
CREATE INDEX "processos_clienteId_idx" ON "public"."processos"("clienteId" ASC);

-- CreateIndex
CREATE INDEX "processos_empresaId_idx" ON "public"."processos"("empresaId" ASC);

-- CreateIndex
CREATE INDEX "processos_responsavelId_idx" ON "public"."processos"("responsavelId" ASC);

-- CreateIndex
CREATE INDEX "tipos_processo_custom_empresaId_idx" ON "public"."tipos_processo_custom"("empresaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_processo_custom_empresaId_valor_key" ON "public"."tipos_processo_custom"("empresaId" ASC, "valor" ASC);

-- CreateIndex
CREATE INDEX "usuarios_cargoId_idx" ON "public"."usuarios"("cargoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_clerkId_key" ON "public"."usuarios"("clerkId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email" ASC);

-- CreateIndex
CREATE INDEX "usuarios_empresaId_idx" ON "public"."usuarios"("empresaId" ASC);

-- AddForeignKey
ALTER TABLE "public"."anotacoes" ADD CONSTRAINT "anotacoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cargos" ADD CONSTRAINT "cargos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentos" ADD CONSTRAINT "documentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentos" ADD CONSTRAINT "documentos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentos" ADD CONSTRAINT "documentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."etapas_kanban" ADD CONSTRAINT "etapas_kanban_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eventos" ADD CONSTRAINT "eventos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eventos" ADD CONSTRAINT "eventos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eventos" ADD CONSTRAINT "eventos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eventos" ADD CONSTRAINT "eventos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historicos" ADD CONSTRAINT "historicos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historicos" ADD CONSTRAINT "historicos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kanban_cards" ADD CONSTRAINT "kanban_cards_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kanban_cards" ADD CONSTRAINT "kanban_cards_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "public"."etapas_kanban"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kanban_cards" ADD CONSTRAINT "kanban_cards_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs" ADD CONSTRAINT "logs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs" ADD CONSTRAINT "logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacoes" ADD CONSTRAINT "notificacoes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processo_atribuicoes" ADD CONSTRAINT "processo_atribuicoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processo_atribuicoes" ADD CONSTRAINT "processo_atribuicoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processos" ADD CONSTRAINT "processos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processos" ADD CONSTRAINT "processos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processos" ADD CONSTRAINT "processos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "public"."cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
