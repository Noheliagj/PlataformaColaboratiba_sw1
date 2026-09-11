-- AlterTable: se agregan como nullable primero para poder rellenar (backfill)
-- las filas existentes antes de exigir NOT NULL.
ALTER TABLE "projects" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "projects" ADD COLUMN "invitePassword" TEXT;

-- Backfill: genera código de invitación (8 alfanumérico) y password (6 dígitos)
-- para los proyectos creados antes de RF4.
UPDATE "projects"
SET
  "inviteCode" = upper(substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 8)),
  "invitePassword" = lpad(floor(random() * 900000 + 100000)::text, 6, '0')
WHERE "inviteCode" IS NULL;

-- Ahora que todas las filas tienen valor, se exige NOT NULL.
ALTER TABLE "projects" ALTER COLUMN "inviteCode" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "invitePassword" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "projects_inviteCode_key" ON "projects"("inviteCode");

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
