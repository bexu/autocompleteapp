import { FormValidationError, generateAndFileForm, previewForm } from "@/lib/forms/engine";
import { DecesBodySchema } from "@/lib/forms/deces";
import type { z } from "zod";

// Dosar „deces în familie": un eveniment → ajutorul de deces (Anexa 11) +
// cererea de pensie de urmaș (Anexa 7). Solicitantul din profil; datele
// decedatului ca inputuri (nu le persistăm). Atomic: validează ambele înainte
// de a persista.

export type DecesInput = z.infer<typeof DecesBodySchema>;

export interface DecesFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface DecesCaseResult {
  label: string;
  checklist: string[];
  forms: DecesFormResult[];
}

const FORMS = ["AJUTOR-DECES", "PENSIE-URMAS"] as const;

const CHECKLIST = [
  "Obține certificatul de deces de la starea civilă (primăria locului decesului) — documentul de bază al dosarului",
  "Pregătește actul de identitate al solicitantului și actele de stare civilă care dovedesc rudenia (căsătorie/naștere)",
  "Strânge dovada cheltuielilor de înmormântare (factură + chitanță) sau pregătește declarația pe propria răspundere",
  "Dacă decedatul era salariat, cere angajatorului adeverința de asigurat (angajatorul nu mai plătește ajutorul, doar o emite)",
  "Depune cererea de ajutor de deces la casa de pensii de la domiciliul decedatului — termen de 3 ani de la data decesului",
  "Dacă există urmași eligibili, depune separat cererea de pensie de urmaș la casa de pensii de la domiciliul solicitantului",
  "Verifici, semnezi și depui pe propria răspundere (aplicația nu evaluează eligibilitatea sau cuantumul)",
];

export async function generateDecesCase(
  userId: string,
  input: DecesInput,
): Promise<DecesCaseResult> {
  const optsFor = (formCode: string) => ({
    formCode,
    jurisdiction: "national",
    inputs: input as Record<string, unknown>,
  });

  // Faza 1 — validează ambele formulare înainte de a persista ceva (atomic).
  // Verifică și coerența plății: „cont bancar (IBAN)" cere un IBAN în profil,
  // altfel ajutorul de deces s-ar genera cu IBAN gol (formular inutilizabil).
  for (const formCode of FORMS) {
    const { fields } = await previewForm(userId, optsFor(formCode));
    if (formCode === "AJUTOR-DECES") {
      const byKey = Object.fromEntries(fields.map((f) => [f.key, f.value]));
      if (byKey.modalitatePlata === "cont bancar (IBAN)" && !byKey.iban) {
        throw new FormValidationError([
          { key: "iban", message: "Pentru plata în cont adaugă un IBAN în profil sau alege mandat poștal" },
        ]);
      }
    }
  }

  // Faza 2 — generează + arhivează + deschide dosare.
  const forms: DecesFormResult[] = [];
  for (const formCode of FORMS) {
    const filed = await generateAndFileForm(userId, optsFor(formCode));
    forms.push({
      formCode: filed.formCode,
      title: filed.manifest.title,
      dossierId: filed.dossierId,
    });
  }

  return { label: "Deces în familie", checklist: CHECKLIST, forms };
}
