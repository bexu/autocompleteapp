import { prisma } from "@/lib/db/prisma";
import { VehiculInput } from "./schema";

// Repository vehicule. Toate operațiile verifică proprietatea (userId) — un
// user nu vede/modifică vehiculul altuia. Datele de vehicul nu sunt criptate
// (nu sunt „date protejate" ca CNP/CI).

export interface Vehicul {
  id: string;
  vin: string | null;
  marca: string | null;
  model: string | null;
  nrInmatriculare: string | null;
  civSerie: string | null;
  serieMotor: string | null;
  cilindreeCm3: number | null;
  masaMaximaKg: number | null;
  anFabricatie: number | null;
  combustibil: string | null;
  normaPoluare: string | null;
  emisiiCo2GKm: number | null;
  putereKw: number | null;
  dataDobandire: Date | null;
}

function normalize(input: VehiculInput) {
  return {
    vin: input.vin ? input.vin.toUpperCase() : null,
    marca: input.marca ?? null,
    model: input.model ?? null,
    nrInmatriculare: input.nrInmatriculare ?? null,
    civSerie: input.civSerie ?? null,
    serieMotor: input.serieMotor ?? null,
    cilindreeCm3: input.cilindreeCm3 ?? null,
    masaMaximaKg: input.masaMaximaKg ?? null,
    anFabricatie: input.anFabricatie ?? null,
    combustibil: input.combustibil ?? null,
    normaPoluare: input.normaPoluare ?? null,
    emisiiCo2GKm: input.emisiiCo2GKm ?? null,
    putereKw: input.putereKw ?? null,
    dataDobandire: input.dataDobandire ?? null,
  };
}

export async function createVehicul(userId: string, rawInput: unknown): Promise<Vehicul> {
  const input = VehiculInput.parse(rawInput);
  const row = await prisma.vehicul.create({
    data: { userId, ...normalize(input) },
  });
  return toVehicul(row);
}

export async function listVehicule(userId: string): Promise<Vehicul[]> {
  const rows = await prisma.vehicul.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map(toVehicul);
}

export async function getVehicul(userId: string, id: string): Promise<Vehicul | null> {
  const row = await prisma.vehicul.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return toVehicul(row);
}

export async function updateVehicul(
  userId: string,
  id: string,
  rawInput: unknown,
): Promise<Vehicul | null> {
  const existing = await prisma.vehicul.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return null;
  const input = VehiculInput.parse(rawInput);
  const row = await prisma.vehicul.update({ where: { id }, data: normalize(input) });
  return toVehicul(row);
}

export async function deleteVehicul(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.vehicul.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return false;
  await prisma.vehicul.delete({ where: { id } });
  return true;
}

function toVehicul(row: Vehicul & { userId: string }): Vehicul {
  return {
    id: row.id,
    vin: row.vin,
    marca: row.marca,
    model: row.model,
    nrInmatriculare: row.nrInmatriculare,
    civSerie: row.civSerie,
    serieMotor: row.serieMotor,
    cilindreeCm3: row.cilindreeCm3,
    masaMaximaKg: row.masaMaximaKg,
    anFabricatie: row.anFabricatie,
    combustibil: row.combustibil,
    normaPoluare: row.normaPoluare,
    emisiiCo2GKm: row.emisiiCo2GKm,
    putereKw: row.putereKw,
    dataDobandire: row.dataDobandire,
  };
}
