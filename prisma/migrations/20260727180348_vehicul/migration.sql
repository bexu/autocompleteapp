-- CreateTable
CREATE TABLE "vehicul" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vin" TEXT,
    "marca" TEXT,
    "model" TEXT,
    "nrInmatriculare" TEXT,
    "civSerie" TEXT,
    "serieMotor" TEXT,
    "cilindreeCm3" INTEGER,
    "masaMaximaKg" INTEGER,
    "anFabricatie" INTEGER,
    "combustibil" TEXT,
    "normaPoluare" TEXT,
    "emisiiCo2GKm" INTEGER,
    "putereKw" INTEGER,
    "dataDobandire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicul_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicul_userId_idx" ON "vehicul"("userId");

-- AddForeignKey
ALTER TABLE "vehicul" ADD CONSTRAINT "vehicul_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
