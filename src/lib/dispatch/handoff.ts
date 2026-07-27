import type { FormManifest, SubmissionChannel } from "@/lib/forms/manifest";

// Handoff „generate + handoff": ce trebuie userul să facă mai departe. Derivat
// din manifest (canale + termen); NU se stochează. Principiul „generate, don't
// submit" — noi ducem userul până la butonul de trimitere.

export interface ChecklistStep {
  id: string;
  label: string;
}

export interface Handoff {
  formCode: string;
  title: string;
  signature: FormManifest["signature"];
  deadline: string | null;
  channels: SubmissionChannel[];
  checklist: ChecklistStep[];
}

export function buildHandoff(manifest: FormManifest): Handoff {
  const checklist: ChecklistStep[] = [
    { id: "descarca", label: "Descarcă PDF-ul generat (și semnat, dacă e cazul)" },
  ];
  if (manifest.signature === "qualified") {
    checklist.push({ id: "semnatura", label: "Aplică semnătura calificată" });
  }
  const channelHint =
    manifest.channels && manifest.channels.length > 0
      ? `Depune prin unul dintre canale: ${manifest.channels.map((c) => c.label).join(" sau ")}`
      : "Depune la autoritatea competentă";
  checklist.push({ id: "depune", label: channelHint });
  checklist.push({ id: "marcheaza", label: "Marchează dosarul ca depus după ce l-ai trimis" });

  return {
    formCode: manifest.formCode,
    title: manifest.title,
    signature: manifest.signature,
    deadline: manifest.deadline ?? null,
    channels: manifest.channels ?? [],
    checklist,
  };
}
