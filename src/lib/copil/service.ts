import { generateAndFileForm, previewForm } from "@/lib/forms/engine";
import { COPIL_BODY_SCHEMA } from "@/lib/forms/copil";
import type { z } from "zod";

// Dosar „nou-născut": un eveniment → alocație de stat + indemnizație creștere
// copil. Datele copilului/angajatorului vin ca inputuri (nu persistăm copilul).

export type CopilInput = z.infer<typeof COPIL_BODY_SCHEMA>;

export interface CopilFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface CopilCaseResult {
  label: string;
  checklist: string[];
  forms: CopilFormResult[];
}

const FORMS = ["ALOCATIE", "INDEMNIZATIE"] as const;

const CHECKLIST = [
  "Obține certificatul de naștere al copilului de la starea civilă",
  "Depune cererea de alocație de stat (DASM / Primărie) cu actele de identitate",
  "Cere adeverința de venit de la angajator pentru indemnizație",
  "Depune dosarul de indemnizație creștere copil la AJPIS",
];

export async function generateCopilCase(
  userId: string,
  input: CopilInput,
): Promise<CopilCaseResult> {
  const optsFor = (formCode: string) => ({
    formCode,
    jurisdiction: "national",
    inputs: input as Record<string, unknown>,
  });

  // Faza 1 — validează ambele formulare înainte de a persista ceva.
  for (const formCode of FORMS) {
    await previewForm(userId, optsFor(formCode));
  }

  // Faza 2 — generează + arhivează + deschide dosare.
  const forms: CopilFormResult[] = [];
  for (const formCode of FORMS) {
    const filed = await generateAndFileForm(userId, optsFor(formCode));
    forms.push({
      formCode: filed.formCode,
      title: filed.manifest.title,
      dossierId: filed.dossierId,
    });
  }

  return { label: "Am devenit părinte", checklist: CHECKLIST, forms };
}
