import { generateAndFileForm } from "@/lib/forms/engine";
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

  const forms: AutoFormResult[] = [];
  for (const ref of def.forms) {
    const filed = await generateAndFileForm(userId, {
      formCode: ref.formCode,
      jurisdiction: ref.jurisdiction,
      vehicleId: input.vehicleId,
      inputs: def.buildInputs(input, ref.formCode),
    });
    forms.push({
      formCode: filed.formCode,
      title: filed.manifest.title,
      dossierId: filed.dossierId,
    });
  }

  return { event: input.event, label: def.label, checklist: def.checklist, forms };
}
