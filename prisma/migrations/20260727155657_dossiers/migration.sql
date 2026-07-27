-- CreateTable
CREATE TABLE "dossier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "signedFormId" TEXT,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "deadline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dossier_userId_idx" ON "dossier"("userId");

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
