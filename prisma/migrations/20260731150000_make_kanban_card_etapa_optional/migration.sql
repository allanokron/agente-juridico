-- DropForeignKey
ALTER TABLE "kanban_cards" DROP CONSTRAINT "kanban_cards_etapaId_fkey";

-- AlterTable
ALTER TABLE "kanban_cards" ALTER COLUMN "etapaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_kanban"("id") ON DELETE SetNull ON UPDATE CASCADE;
