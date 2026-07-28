import { generateAndFileForms } from "@/lib/forms/engine";
import { UrbanismBodySchema, URBANISM_EVENT_FORMS } from "@/lib/forms/urbanism";
import type { z } from "zod";

// Urbanism/construcții: eveniment → formularul potrivit. „Certificat" = F.1
// (act prealabil); „Autorizație" = F.8. Solicitantul din profil, imobilul din
// entitatea Imobil. Generate, don't submit — userul depune la primărie.

export type UrbanismInput = z.infer<typeof UrbanismBodySchema>;

export interface UrbanismFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface UrbanismCaseResult {
  event: string;
  label: string;
  checklist: string[];
  forms: UrbanismFormResult[];
}

const CHECKLIST: Record<string, string[]> = {
  CERTIFICAT: [
    "Obține de la OCPI extrasul de carte funciară pentru informare și planul cadastral/topografic actualizat",
    "Depune cererea de certificat de urbanism (F.1) la primăria/consiliul județean competent",
    "Certificatul de urbanism e act prealabil obligatoriu: stabilește avizele necesare, dar NU dă dreptul de a executa lucrări",
    "Verifici, semnezi și depui pe propria răspundere (aplicația nu dă avize și nu calculează taxe)",
  ],
  AUTORIZATIE: [
    "Comandă la un proiectant autorizat documentația tehnică (D.T.A.C. la construire / D.T.A.D. la desființare) cu verificările pe cerințele de calitate",
    "Obține avizele și acordurile cerute prin certificatul de urbanism",
    "Depune cererea de autorizație (F.8) cu anexa completată de proiectant și dosarul complet; achită taxele de autorizare",
    "Înainte de începerea lucrărilor: comunică începerea execuției către autoritatea emitentă și ISC (cu min. 10 zile înainte)",
    "La finalizare: comunică încheierea execuției și fă recepția la terminarea lucrărilor",
  ],
};

export async function generateUrbanismCase(
  userId: string,
  input: UrbanismInput,
): Promise<UrbanismCaseResult> {
  const { event, imobilId, ...inputs } = input;
  const forms = URBANISM_EVENT_FORMS[event];
  const label = event === "CERTIFICAT" ? "Certificat de urbanism" : "Autorizație de construire/desființare";

  const optsFor = (formCode: string) => ({
    formCode,
    jurisdiction: "national",
    imobilId,
    inputs: inputs as Record<string, unknown>,
  });

  // Generare atomică: validează tot, apoi persistă într-o singură tranzacție.
  const filed = await generateAndFileForms(userId, forms.map((f) => optsFor(f)));
  const results: UrbanismFormResult[] = filed.map((f) => ({
    formCode: f.formCode,
    title: f.manifest.title,
    dossierId: f.dossierId,
  }));

  return { event, label, checklist: CHECKLIST[event], forms: results };
}
