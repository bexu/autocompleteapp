import type { FormManifest } from "./manifest";
import { registerManifest } from "./manifest";

// Formularul 230 — „Cerere privind destinația sumei reprezentând până la 3,5%
// din impozitul anual" (redirecționare către o entitate nonprofit).
//
// Câmpurile logice reflectă conținutul real al formularului 230 (identitate
// contribuabil + entitate beneficiară). Sursa oficială (PDF ANAF) + hash se
// completează la obținere; până atunci workflow = "generated" (ADR 0007/0003).

export const F230_MANIFEST: FormManifest = {
  id: "230-national-2024",
  authority: "ANAF",
  jurisdiction: "national",
  formCode: "230",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: null, // TODO: link oficial ANAF, verificat
  sourceSha256: null,
  workflow: "generated",
  signature: "none", // opțională; SEC doar dacă se depune electronic (SPEC)
  title: "Cerere 230 — redirecționare până la 3,5% din impozit",
  fields: [
    { key: "nume", label: "Nume", source: { from: "profile", path: "nume" }, required: true },
    { key: "prenume", label: "Prenume", source: { from: "profile", path: "prenume" }, required: true },
    { key: "cnp", label: "CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
    { key: "judet", label: "Județ", source: { from: "profile", path: "addresses.0.judet" } },
    { key: "localitate", label: "Localitate", source: { from: "profile", path: "addresses.0.localitate" } },
    { key: "strada", label: "Stradă", source: { from: "profile", path: "addresses.0.strada" } },
    { key: "nr", label: "Număr", source: { from: "profile", path: "addresses.0.nr" } },
    // Entitatea beneficiară (input specific formularului).
    { key: "beneficiarDenumire", label: "Denumire entitate", source: { from: "input", key: "beneficiarDenumire" }, required: true },
    { key: "beneficiarCif", label: "CIF entitate", source: { from: "input", key: "beneficiarCif" }, required: true },
    { key: "beneficiarIban", label: "Cont bancar (IBAN) entitate", source: { from: "input", key: "beneficiarIban" }, required: true, validate: "iban" },
    { key: "doiAni", label: "Redirecționare pe 2 ani", source: { from: "input", key: "doiAni" } },
  ],
  inputs: [
    { key: "beneficiarDenumire", label: "Denumire entitate nonprofit", required: true, validate: "text" },
    { key: "beneficiarCif", label: "CIF entitate", required: true, validate: "text" },
    { key: "beneficiarIban", label: "IBAN entitate", required: true, validate: "iban" },
    { key: "doiAni", label: "Redirecționez pe 2 ani", type: "checkbox" },
  ],
  deadline: "25 mai",
  channels: [
    {
      id: "spv",
      label: "Spațiul Privat Virtual (SPV) — ANAF",
      url: null, // deep-link oficial SPV — de completat după verificare
      instructions:
        "Autentifică-te în SPV cu certificatul/credențialele tale și încarcă PDF-ul 230 la secțiunea de depuneri.",
    },
    {
      id: "borderou-ong",
      label: "Predare către ONG (borderou)",
      url: null,
      instructions:
        "Trimite PDF-ul 230 către entitatea beneficiară; aceasta îl depune centralizat prin borderou.",
    },
  ],
};

export function registerF230(): void {
  registerManifest(F230_MANIFEST);
}
