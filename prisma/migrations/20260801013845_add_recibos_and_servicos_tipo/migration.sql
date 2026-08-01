-- CreateEnum
CREATE TYPE "ReciboStatus" AS ENUM ('EMITIDO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'TRANSFERENCIA', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO');

-- CreateTable
CREATE TABLE "recibos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "pagadorNome" TEXT NOT NULL,
    "pagadorCpfCnpj" TEXT NOT NULL,
    "pagadorTipoDoc" TEXT NOT NULL,
    "servicoPrestado" TEXT NOT NULL,
    "servicoTipoId" TEXT,
    "cidadePrestacao" TEXT NOT NULL,
    "prestadorNome" TEXT NOT NULL,
    "prestadorCpfCnpj" TEXT NOT NULL,
    "prestadorTipoDoc" TEXT NOT NULL,
    "prestadorCep" TEXT NOT NULL,
    "prestadorEndereco" TEXT,
    "prestadorCidade" TEXT,
    "prestadorUf" TEXT,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "pagamentoDetalhes" JSONB,
    "status" "ReciboStatus" NOT NULL DEFAULT 'EMITIDO',
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recibos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico_tipos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servico_tipos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recibos_empresaId_numero_key" ON "recibos"("empresaId", "numero");

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_servicoTipoId_fkey" FOREIGN KEY ("servicoTipoId") REFERENCES "servico_tipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_tipos" ADD CONSTRAINT "servico_tipos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
