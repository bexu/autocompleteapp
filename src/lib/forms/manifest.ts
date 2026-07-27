// Manifest versionat de formular (ADR 0003). Adăugarea unui formular = date,
// nu cod de business. Selecția se face după cod + jurisdicție + dată, ca două
// revizii ale aceluiași formular să coexiste (ex. ITL-005 Cluj 2026).

export type FieldSource =
  | { from: "profile"; path: string } // ex. "nume", "cnp", "addresses.0.localitate"
  | { from: "input"; key: string } // valoare specifică formularului, dată de user
  | { from: "const"; value: string };

export type ValidationRule = "cnp" | "iban" | "percent" | "text";

export interface FieldDef {
  key: string;
  label: string;
  source: FieldSource;
  required?: boolean;
  validate?: ValidationRule;
}

export interface InputDef {
  key: string;
  label: string;
  required?: boolean;
  validate?: ValidationRule;
  type?: "text" | "checkbox";
}

export type FormWorkflow =
  | "generated" // PDF generat de noi (până la template oficial)
  | "acroform_fill"
  | "pdf_overlay"
  | "dossier"
  | "deep_link";

export type SignatureType = "none" | "qualified" | "counter";

export interface SubmissionChannel {
  id: string;
  label: string;
  // URL oficial — null până la verificare (guardrail: nu inventa link-uri).
  url: string | null;
  instructions: string;
}

export interface FormManifest {
  id: string;
  authority: string; // ex. "ANAF"
  jurisdiction: string; // "national" | cod UAT (ex. "cluj")
  formCode: string; // ex. "230"
  revision: string; // ex. "2024"
  validFrom: string; // ISO (inclusiv)
  validTo?: string; // ISO (exclusiv); absent = fără expirare
  // Sursa oficială — de completat cu link + hash VERIFICATE la obținerea PDF-ului
  // oficial (guardrail: nu inventa). Până atunci workflow = "generated".
  sourceUrl: string | null;
  sourceSha256: string | null;
  workflow: FormWorkflow;
  signature: SignatureType;
  title: string;
  fields: FieldDef[];
  inputs: InputDef[];
  attachments?: string[];
  channels?: SubmissionChannel[];
  deadline?: string; // ex. "25 mai" — termen de depunere (afișare)
  // Regula anuală a termenului, pentru calculul datelor de reminder.
  deadlineRule?: { month: number; day: number };
}

const registry: FormManifest[] = [];

export function registerManifest(m: FormManifest): void {
  if (registry.some((r) => r.id === m.id)) return; // idempotent
  registry.push(m);
}

/** Toate manifestele înregistrate (copie). */
export function allManifests(): FormManifest[] {
  return [...registry];
}

export function getManifestById(id: string): FormManifest | null {
  return registry.find((m) => m.id === id) ?? null;
}

/**
 * Selectează manifestul valid pentru (cod, jurisdicție) la o dată dată.
 * Preferă jurisdicția exactă; cade pe „national". Alege revizia cu `validFrom`
 * cel mai recent care e ≤ dată (și fără `validTo` depășit).
 */
export function selectManifest(
  formCode: string,
  jurisdiction: string,
  at: Date,
): FormManifest | null {
  const t = at.getTime();
  const candidates = registry
    .filter((m) => m.formCode === formCode)
    .filter((m) => m.jurisdiction === jurisdiction || m.jurisdiction === "national")
    .filter((m) => {
      const from = new Date(m.validFrom).getTime();
      const to = m.validTo ? new Date(m.validTo).getTime() : Infinity;
      return from <= t && t < to;
    });
  if (candidates.length === 0) return null;

  // Jurisdicția exactă bate „national"; apoi cea mai recentă validFrom.
  candidates.sort((a, b) => {
    if (a.jurisdiction !== b.jurisdiction) {
      return a.jurisdiction === jurisdiction ? -1 : 1;
    }
    return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
  });
  return candidates[0];
}

/** Doar pentru teste: golește registry-ul. */
export function _clearRegistry(): void {
  registry.length = 0;
}
