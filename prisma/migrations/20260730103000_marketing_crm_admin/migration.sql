CREATE TYPE "LeadStatus" AS ENUM (
  'NOVO',
  'EM_CONTATO',
  'QUALIFICADO',
  'PROPOSTA',
  'GANHO',
  'PERDIDO',
  'ARQUIVADO'
);

CREATE TYPE "ProvisionamentoStatus" AS ENUM (
  'RASCUNHO',
  'PROCESSANDO',
  'PRONTO',
  'FALHA'
);

ALTER TABLE "empresas"
  ADD COLUMN "provisionamentoStatus" "ProvisionamentoStatus" NOT NULL DEFAULT 'PRONTO',
  ADD COLUMN "provisionamentoErro" TEXT,
  ADD COLUMN "masterUserId" TEXT,
  ADD COLUMN "leadOrigemId" TEXT;

CREATE TABLE "leads" (
  "id" TEXT NOT NULL,
  "nomeContato" TEXT NOT NULL,
  "escritorio" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailNormalizado" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "whatsappNormalizado" TEXT NOT NULL,
  "cidade" TEXT,
  "uf" TEXT,
  "tamanhoEquipe" TEXT,
  "volumeProcessos" TEXT,
  "mensagem" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NOVO',
  "responsavelId" TEXT,
  "origem" TEXT NOT NULL DEFAULT 'home',
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "consentimentoLgpd" BOOLEAN NOT NULL,
  "consentimentoEm" TIMESTAMP(3) NOT NULL,
  "ultimoContatoEm" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_atividades" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "autorId" TEXT,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "detalhes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_atividades_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "empresas_masterUserId_key" ON "empresas"("masterUserId");
CREATE UNIQUE INDEX "empresas_leadOrigemId_key" ON "empresas"("leadOrigemId");
CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt");
CREATE INDEX "leads_emailNormalizado_idx" ON "leads"("emailNormalizado");
CREATE INDEX "leads_whatsappNormalizado_idx" ON "leads"("whatsappNormalizado");
CREATE INDEX "leads_responsavelId_idx" ON "leads"("responsavelId");
CREATE INDEX "lead_atividades_leadId_createdAt_idx" ON "lead_atividades"("leadId", "createdAt");
CREATE INDEX "lead_atividades_autorId_idx" ON "lead_atividades"("autorId");

ALTER TABLE "empresas"
  ADD CONSTRAINT "empresas_masterUserId_fkey"
  FOREIGN KEY ("masterUserId") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "empresas"
  ADD CONSTRAINT "empresas_leadOrigemId_fkey"
  FOREIGN KEY ("leadOrigemId") REFERENCES "leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_responsavelId_fkey"
  FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lead_atividades"
  ADD CONSTRAINT "lead_atividades_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_atividades"
  ADD CONSTRAINT "lead_atividades_autorId_fkey"
  FOREIGN KEY ("autorId") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
