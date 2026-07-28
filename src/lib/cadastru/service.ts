import { generateAndFileForm, previewForm } from "@/lib/forms/engine";
import { CadastruBodySchema } from "@/lib/forms/cadastru";
import type { z } from "zod";

// Dosar cadastru/CF: un eveniment („vreau să înscriu ceva în cartea funciară")
// → cererea de înscriere (Anexa 5) + o cerere de extras CF pentru pre-verificare.
// Solicitantul din profil, imobilul din entitatea Imobil (imobilId), restul ca
// inputuri. Atomic: validează ambele înainte de a persista.

export type CadastruInput = z.infer<typeof CadastruBodySchema>;

export interface CadastruFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface CadastruCaseResult {
  label: string;
  checklist: string[];
  forms: CadastruFormResult[];
}

const FORMS = ["EXTRAS-CF", "CERERE-INSCRIERE-CF"] as const;

const CHECKLIST = [
  "Pre-verifică situația imobilului cu un extras CF pentru informare (gratuit prin MyEterra dacă ești proprietar tabular)",
  "Confirmă datele imobilului: județ, UAT/localitate și nr. cadastral sau nr. carte funciară",
  "Alege felul înscrierii corect (intabulare / notare / radiere / înscriere provizorie / actualizare / îndreptare eroare)",
  "Atașează actul justificativ în original sau copie legalizată (act notarial, hotărâre, certificat de moștenitor, act administrativ)",
  "Atașează dovada plății tarifului ANCPI și copia actului de identitate",
  "Depune cererea la BCPI/OCPI în raza căruia se află imobilul; verifici și semnezi pe propria răspundere",
];

export async function generateCadastruCase(
  userId: string,
  input: CadastruInput,
): Promise<CadastruCaseResult> {
  const { imobilId, ...inputs } = input;
  const optsFor = (formCode: string) => ({
    formCode,
    jurisdiction: "national",
    imobilId,
    inputs: inputs as Record<string, unknown>,
  });

  // Faza 1 — validează ambele formulare înainte de a persista ceva (atomic).
  for (const formCode of FORMS) {
    await previewForm(userId, optsFor(formCode));
  }

  // Faza 2 — generează + arhivează + deschide dosare.
  const forms: CadastruFormResult[] = [];
  for (const formCode of FORMS) {
    const filed = await generateAndFileForm(userId, optsFor(formCode));
    forms.push({
      formCode: filed.formCode,
      title: filed.manifest.title,
      dossierId: filed.dossierId,
    });
  }

  return { label: "Înscriere în cartea funciară", checklist: CHECKLIST, forms };
}
