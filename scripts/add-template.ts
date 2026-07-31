/**
 * Adaugă un TIPIZAT OFICIAL în seiful de template-uri.
 *
 *   npx tsx scripts/add-template.ts <manifestId> <sursă> [nume-fișier.pdf]
 *
 * `sursă` = URL oficial sau cale locală către PDF. Unealta:
 *   1. aduce fișierul și îl salvează în `templates/`;
 *   2. calculează SHA-256 (integritate — se pune în definiția template-ului);
 *   3. inspectează PDF-ul: câte pagini, ce dimensiuni, ce câmpuri AcroForm are;
 *   4. tipărește definiția `FormTemplate` gata de lipit în src/lib/forms/templates/.
 *
 * Formularele oficiale RO sunt adesea .doc/.docx — convertește-le o singură dată
 * în PDF (ex. LibreOffice: `soffice --headless --convert-to pdf fișier.doc`) și
 * dă calea PDF-ului rezultat. Nu convertim automat: pasul trebuie să fie
 * conștient și verificabil (documentul oficial e sursa de adevăr).
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

async function fetchBytes(src: string): Promise<Uint8Array> {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Descărcare eșuată: HTTP ${res.status} pentru ${src}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  return new Uint8Array(await readFile(src));
}

async function main(): Promise<void> {
  const [manifestId, src, nameArg] = process.argv.slice(2);
  if (!manifestId || !src) {
    console.error("Utilizare: npx tsx scripts/add-template.ts <manifestId> <url|cale> [nume.pdf]");
    process.exit(1);
  }

  const bytes = await fetchBytes(src);
  if (Buffer.from(bytes.subarray(0, 5)).toString("latin1") !== "%PDF-") {
    console.error(
      "Fișierul nu e PDF (probabil .doc/.docx). Convertește-l întâi în PDF și reia cu calea locală.",
    );
    process.exit(2);
  }

  const dir = path.join(process.cwd(), "templates");
  await mkdir(dir, { recursive: true });
  const file = nameArg ?? `${manifestId}.pdf`;
  await writeFile(path.join(dir, file), bytes);

  const hash = createHash("sha256").update(bytes).digest("hex");
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();

  let acro: string[] = [];
  try {
    acro = doc.getForm().getFields().map((f) => f.getName());
  } catch {
    acro = [];
  }

  console.log(`\nSalvat: templates/${file}`);
  console.log(`SHA-256: ${hash}`);
  console.log(`Pagini: ${pages.length}`);
  pages.forEach((p, i) => {
    const { width, height } = p.getSize();
    console.log(`  pagina ${i}: ${Math.round(width)} x ${Math.round(height)}`);
  });
  console.log(`Câmpuri AcroForm: ${acro.length ? acro.length : "niciunul (folosește overlay)"}`);
  acro.forEach((n) => console.log(`  - ${n}`));

  const stub =
    acro.length > 0
      ? {
          manifestId,
          file,
          sha256: hash,
          mode: "acroform",
          fieldMap: Object.fromEntries(acro.slice(0, 8).map((n) => [`CHEIA_NOASTRA_${n}`, n])),
        }
      : {
          manifestId,
          file,
          sha256: hash,
          mode: "overlay",
          placements: [{ key: "nume", page: 0, x: 120, y: 700, size: 10, maxWidth: 300 }],
        };

  console.log("\n--- Definiție (completează cheile/coordonatele) ---");
  console.log(JSON.stringify(stub, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
