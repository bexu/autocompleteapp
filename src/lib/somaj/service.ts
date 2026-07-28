import { generateAndFileForms } from "@/lib/forms/engine";
import { SomajBodySchema } from "@/lib/forms/somaj";
import type { z } from "zod";

// Dosar de șomaj: un eveniment („am rămas fără loc de muncă") → înregistrarea ca
// persoană în căutarea unui loc de muncă (mediere) + cererea de indemnizație.
// Ordinea recomandată: mai întâi înregistrarea (gratuită, fără termen), apoi
// indemnizația. Datele vin din profil + inputuri (nu persistăm date noi).

export type SomajInput = z.infer<typeof SomajBodySchema>;

export interface SomajFormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

export interface SomajCaseResult {
  label: string;
  checklist: string[];
  forms: SomajFormResult[];
}

const FORMS = ["INREGISTRARE-ANOFM", "SOMAJ"] as const;

const CHECKLIST = [
  "Înregistrează-te mai întâi ca persoană în căutarea unui loc de muncă (mediere — gratuit, fără termen) la AJOFM din raza domiciliului",
  "Adună actele: CI, acte de studii/calificare, CV (model european), adeverință medicală",
  "Pentru indemnizație: obține de la fostul angajator adeverința prevăzută la art. 18 (date angajator, data și motivul încetării, stagiul de cotizare) + carnetul de muncă",
  "Depune cererea de indemnizație la AJOFM din raza domiciliului sau reședinței",
  "Verifici, semnezi și depui pe propria răspundere (aplicația nu evaluează eligibilitatea sau cuantumul)",
];

export async function generateSomajCase(
  userId: string,
  input: SomajInput,
): Promise<SomajCaseResult> {
  const optsFor = (formCode: string) => ({
    formCode,
    jurisdiction: "national",
    inputs: input as Record<string, unknown>,
  });

  // Generare atomică: validează tot, apoi persistă într-o singură tranzacție.
  const filed = await generateAndFileForms(userId, FORMS.map(optsFor));
  const forms: SomajFormResult[] = filed.map((f) => ({
    formCode: f.formCode,
    title: f.manifest.title,
    dossierId: f.dossierId,
  }));

  return { label: "Am rămas fără loc de muncă", checklist: CHECKLIST, forms };
}
