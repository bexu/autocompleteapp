-- AlterTable
ALTER TABLE "dossier" ADD COLUMN     "deadlineAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminder_userId_idx" ON "reminder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_dossierId_kind_key" ON "reminder"("dossierId", "kind");

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
