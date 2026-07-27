import { prisma } from "@/lib/db/prisma";
import { ImobilInput } from "./schema";

// Repository imobile. Toate operațiile verifică proprietatea (userId). Datele
// de imobil nu sunt criptate (nu sunt „date protejate" ca CNP/CI).

export interface Imobil {
  id: string;
  tip: string;
  judet: string | null;
  localitate: string | null;
  strada: string | null;
  nr: string | null;
  bloc: string | null;
  scara: string | null;
  etaj: string | null;
  apartament: string | null;
  codPostal: string | null;
  suprafataMp: number | null;
  nrCadastral: string | null;
  nrCarteFunciara: string | null;
}

function normalize(input: ImobilInput) {
  return {
    tip: input.tip,
    judet: input.judet ?? null,
    localitate: input.localitate ?? null,
    strada: input.strada ?? null,
    nr: input.nr ?? null,
    bloc: input.bloc ?? null,
    scara: input.scara ?? null,
    etaj: input.etaj ?? null,
    apartament: input.apartament ?? null,
    codPostal: input.codPostal ?? null,
    suprafataMp: input.suprafataMp ?? null,
    nrCadastral: input.nrCadastral ?? null,
    nrCarteFunciara: input.nrCarteFunciara ?? null,
  };
}

export async function createImobil(userId: string, rawInput: unknown): Promise<Imobil> {
  const input = ImobilInput.parse(rawInput);
  const row = await prisma.imobil.create({ data: { userId, ...normalize(input) } });
  return toImobil(row);
}

export async function listImobile(userId: string): Promise<Imobil[]> {
  const rows = await prisma.imobil.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map(toImobil);
}

export async function getImobil(userId: string, id: string): Promise<Imobil | null> {
  const row = await prisma.imobil.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return toImobil(row);
}

export async function updateImobil(
  userId: string,
  id: string,
  rawInput: unknown,
): Promise<Imobil | null> {
  const existing = await prisma.imobil.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return null;
  const input = ImobilInput.parse(rawInput);
  const row = await prisma.imobil.update({ where: { id }, data: normalize(input) });
  return toImobil(row);
}

export async function deleteImobil(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.imobil.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return false;
  await prisma.imobil.delete({ where: { id } });
  return true;
}

function toImobil(row: Imobil & { userId: string }): Imobil {
  return {
    id: row.id,
    tip: row.tip,
    judet: row.judet,
    localitate: row.localitate,
    strada: row.strada,
    nr: row.nr,
    bloc: row.bloc,
    scara: row.scara,
    etaj: row.etaj,
    apartament: row.apartament,
    codPostal: row.codPostal,
    suprafataMp: row.suprafataMp,
    nrCadastral: row.nrCadastral,
    nrCarteFunciara: row.nrCarteFunciara,
  };
}
