import { generateAndFileForm } from "@/lib/forms/engine";
import { PetitieBodySchema } from "@/lib/forms/petitii";
import type { z } from "zod";

// Petiție universală: profil + inputuri (instituție/subiect/conținut/solicitare)
// → o cerere generată + un dosar „de depus" către registratura instituției.

export type PetitieInput = z.infer<typeof PetitieBodySchema>;

export interface PetitieResult {
  formCode: string;
  title: string;
  dossierId: string;
  institutie: string;
}

export async function generatePetitie(
  userId: string,
  input: PetitieInput,
): Promise<PetitieResult> {
  const filed = await generateAndFileForm(userId, {
    formCode: "PETITIE",
    jurisdiction: "national",
    inputs: input as Record<string, unknown>,
  });
  return {
    formCode: filed.formCode,
    title: filed.manifest.title,
    dossierId: filed.dossierId,
    institutie: input.institutie,
  };
}
