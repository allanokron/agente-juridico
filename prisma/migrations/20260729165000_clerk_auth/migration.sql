-- Add Clerk invitation tracking without removing the legacy session data.
ALTER TABLE "usuarios"
ADD COLUMN "clerkInvitationId" TEXT,
ADD COLUMN "conviteEnviadoEm" TIMESTAMP(3);

CREATE UNIQUE INDEX "usuarios_clerkInvitationId_key"
ON "usuarios"("clerkInvitationId");
