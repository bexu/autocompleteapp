import { generateAndFileForms } from "@/lib/forms/engine";
import { AUTO_EVENT_DEFS, type AutoWizardInput } from "./event";

// Generează dosarul auto: pentru evenimentul ales, produce setul corect de
// formulare (fiecare arhivat + cu dosar „de depus"). Întoarce lista + checklist.

export interface AutoFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface AutoCaseResult {
  event: string;
  label: string;
  checklist: string[];
  forms: AutoFormResult[];
}

export async function generateAutoCase(
  userId: string,
  input: AutoWizardInput,
): Promise<AutoCaseResult> {
  const def = AUTO_EVENT_DEFS[input.event];

  const optsFor = (formCode: string, jurisdiction: string) => ({
    formCode,
    jurisdiction,
    vehicleId: input.vehicleId,
    inputs: def.buildInputs(input, formCode),
  });

  // Generare atomică: validează toate formularele, apoi le persistă într-o
  // singură tranzacție (niciun dosar orfan/duplicat la eșec).
  const filed = await generateAndFileForms(
    userId,
    def.forms.map((ref) => optsFor(ref.formCode, ref.jurisdiction)),
  );
  const forms: AutoFormResult[] = filed.map((f) => ({
    formCode: f.formCode,
    title: f.manifest.title,
    dossierId: f.dossierId,
  }));

  return { event: input.event, label: def.label, checklist: def.checklist, forms };
}
