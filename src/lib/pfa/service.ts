import { generateAndFileForms } from "@/lib/forms/engine";
import { PfaBodySchema, PFA_EVENT_FORMS } from "@/lib/forms/pfa";
import type { z } from "zod";

// Ciclul PFA: eveniment → setul corect de formulare ONRC. „Înființare" =
// rezervare denumire + înregistrare; „Mențiune" = cererea de mențiuni.
// Titularul din profil; restul ca inputuri. Atomic: validează tot înainte de a
// persista. Generate, don't submit — userul depune la ONRC cu semnătura proprie.

export type PfaInput = z.infer<typeof PfaBodySchema>;

export interface PfaFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface PfaCaseResult {
  event: string;
  label: string;
  checklist: string[];
  forms: PfaFormResult[];
}

const CHECKLIST: Record<string, string[]> = {
  INFIINTARE: [
    "Pas 1 — rezervă denumirea (3 opțiuni în ordinea preferinței); dovada e valabilă 1 lună",
    "Pas 2 — după rezervare, depune dosarul de înregistrare la ORCT din județul sediului profesional",
    "Atașează: act de identitate (copie certificată), dovada dreptului de folosință a sediului, declarația-tip pe propria răspundere",
    "Dacă activitatea CAEN e reglementată, atașează dovada pregătirii/experienței profesionale",
    "Specimenul de semnătură se dă la ghișeu sau prin semnătură electronică calificată; cazierul fiscal e obținut automat de ORCT",
    "Verifici, semnezi și depui pe propria răspundere (aplicația nu dă consultanță și nu calculează taxe)",
  ],
  MENTIUNE: [
    "Completează datele de identificare ale PFA (denumire, nr. ordine, CUI, ORCT)",
    "Alege tipul mențiunii și atașează dovada specifică (noul sediu, dovezi CAEN, motivul radierii)",
    "Depune cererea la ORCT-ul unde e înregistrată PFA; verifici și semnezi pe propria răspundere",
  ],
};

export async function generatePfaCase(
  userId: string,
  input: PfaInput,
): Promise<PfaCaseResult> {
  const forms = PFA_EVENT_FORMS[input.event];
  const label = input.event === "INFIINTARE" ? "Îmi deschid un PFA" : "Modific / închid un PFA";

  const optsFor = (formCode: string) => ({
    formCode,
    jurisdiction: "national",
    inputs: input as Record<string, unknown>,
  });

  // Generare atomică: validează tot, apoi persistă într-o singură tranzacție.
  const filed = await generateAndFileForms(userId, forms.map((f) => optsFor(f)));
  const results: PfaFormResult[] = filed.map((f) => ({
    formCode: f.formCode,
    title: f.manifest.title,
    dossierId: f.dossierId,
  }));

  return { event: input.event, label, checklist: CHECKLIST[input.event], forms: results };
}
