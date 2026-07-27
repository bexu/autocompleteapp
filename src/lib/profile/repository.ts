import { prisma } from "@/lib/db/prisma";
import { decryptField, encryptField } from "@/lib/crypto/field-encryption";
import { ProfileInput } from "./schema";

// Repository profil: singura cale prin care datele sensibile intră/ies din DB.
// Câmpurile tari (CNP, serie/nr CI, IBAN) se criptează per-câmp cu AAD legat de
// utilizator (`${userId}:câmp`) — un blob nu poate fi mutat pe alt user.

type Enc = string | null;

// Câmpurile sensibile și contextul lor AAD.
function aad(userId: string, field: string): string {
  return `${userId}:${field}`;
}

function encOptional(value: string | undefined, userId: string, field: string): Enc {
  if (value === undefined || value === "") return null;
  return encryptField(value, aad(userId, field));
}

function decOptional(payload: Enc, userId: string, field: string): string | null {
  if (!payload) return null;
  return decryptField(payload, aad(userId, field));
}

export interface DecryptedAddress {
  tip: "DOMICILIU" | "RESEDINTA";
  strada: string | null;
  nr: string | null;
  localitate: string | null;
  uat: string | null;
  judet: string | null;
  codPostal: string | null;
}

export interface DecryptedProfile {
  nume: string | null;
  prenume: string | null;
  sex: string | null;
  dataNasterii: Date | null;
  cnp: string | null;
  ciSerie: string | null;
  ciNr: string | null;
  ciEmitent: string | null;
  ciExp: Date | null;
  telefon: string | null;
  iban: string | null;
  addresses: DecryptedAddress[];
}

/**
 * Creează/actualizează profilul utilizatorului. Validează inputul (aruncă
 * ZodError la date invalide — apelantul mapează la 400) și criptează câmpurile
 * tari înainte de scriere. Adresele sunt înlocuite integral (set complet).
 */
export async function upsertProfile(
  userId: string,
  rawInput: unknown,
): Promise<DecryptedProfile> {
  const input = ProfileInput.parse(rawInput);

  // Update parțial: includem doar câmpurile furnizate (undefined = neschimbat,
  // "" = șters). Pentru câmpurile tari criptăm; "" → null.
  const set: Record<string, unknown> = {};
  const setPlain = (key: string, v: string | Date | undefined) => {
    if (v !== undefined) set[key] = v === "" ? null : v;
  };
  const setEnc = (col: string, field: string, v: string | undefined) => {
    if (v !== undefined) set[col] = encOptional(v, userId, field);
  };

  setPlain("nume", input.nume);
  setPlain("prenume", input.prenume);
  setPlain("sex", input.sex);
  setPlain("dataNasterii", input.dataNasterii);
  setPlain("ciEmitent", input.ciEmitent);
  setPlain("ciExp", input.ciExp);
  setPlain("telefon", input.telefon);
  setEnc("cnpEnc", "cnp", input.cnp);
  setEnc("ciSerieEnc", "ciSerie", input.ciSerie);
  setEnc("ciNrEnc", "ciNr", input.ciNr);
  setEnc("ibanEnc", "iban", input.iban);

  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.upsert({
      where: { userId },
      create: { userId, ...set },
      update: set,
    });

    // Adresele se înlocuiesc integral doar dacă sunt furnizate.
    if (input.addresses !== undefined) {
      await tx.address.deleteMany({ where: { profileId: profile.id } });
      if (input.addresses.length > 0) {
        await tx.address.createMany({
          data: input.addresses.map((a) => ({ ...a, profileId: profile.id })),
        });
      }
    }
  });

  const result = await getProfile(userId);
  if (!result) throw new Error("Profil inexistent după upsert");
  return result;
}

/** Citește și decriptează profilul utilizatorului (null dacă nu există). */
export async function getProfile(userId: string): Promise<DecryptedProfile | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { addresses: { orderBy: { createdAt: "asc" } } },
  });
  if (!profile) return null;

  return {
    nume: profile.nume,
    prenume: profile.prenume,
    sex: profile.sex,
    dataNasterii: profile.dataNasterii,
    cnp: decOptional(profile.cnpEnc, userId, "cnp"),
    ciSerie: decOptional(profile.ciSerieEnc, userId, "ciSerie"),
    ciNr: decOptional(profile.ciNrEnc, userId, "ciNr"),
    ciEmitent: profile.ciEmitent,
    ciExp: profile.ciExp,
    telefon: profile.telefon,
    iban: decOptional(profile.ibanEnc, userId, "iban"),
    addresses: profile.addresses.map((a) => ({
      tip: a.tip,
      strada: a.strada,
      nr: a.nr,
      localitate: a.localitate,
      uat: a.uat,
      judet: a.judet,
      codPostal: a.codPostal,
    })),
  };
}
