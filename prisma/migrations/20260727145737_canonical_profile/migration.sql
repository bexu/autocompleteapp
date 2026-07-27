-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('DOMICILIU', 'RESEDINTA');

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nume" TEXT,
    "prenume" TEXT,
    "sex" TEXT,
    "dataNasterii" TIMESTAMP(3),
    "cnpEnc" TEXT,
    "ciSerieEnc" TEXT,
    "ciNrEnc" TEXT,
    "ciEmitent" TEXT,
    "ciExp" TIMESTAMP(3),
    "telefon" TEXT,
    "ibanEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tip" "AddressType" NOT NULL,
    "strada" TEXT,
    "nr" TEXT,
    "localitate" TEXT,
    "uat" TEXT,
    "judet" TEXT,
    "codPostal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
