-- CreateTable
CREATE TABLE "imobil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "judet" TEXT,
    "localitate" TEXT,
    "strada" TEXT,
    "nr" TEXT,
    "bloc" TEXT,
    "scara" TEXT,
    "etaj" TEXT,
    "apartament" TEXT,
    "codPostal" TEXT,
    "suprafataMp" INTEGER,
    "nrCadastral" TEXT,
    "nrCarteFunciara" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imobil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imobil_userId_idx" ON "imobil"("userId");

-- AddForeignKey
ALTER TABLE "imobil" ADD CONSTRAINT "imobil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
