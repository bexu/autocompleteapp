-- CreateTable
CREATE TABLE "signed_form" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "contentEnc" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signed_form_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signed_form_userId_idx" ON "signed_form"("userId");

-- AddForeignKey
ALTER TABLE "signed_form" ADD CONSTRAINT "signed_form_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
