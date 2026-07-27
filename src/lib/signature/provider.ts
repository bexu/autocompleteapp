import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Abstracție de semnătură peste QTSP. În dev rulează un provider MOCK care
// ștampilează vizibil documentul; în prod, semnare calificată la distanță prin
// CSC API (certSIGN/Trans Sped), în spatele ACELEIAȘI interfețe — ADR 0010.
// NICIODATĂ nu pretindem că mock-ul e semnătură calificată reală.

export interface SignContext {
  formCode: string;
  signerLabel: string; // etichetă neutră (fără PII) pentru ștampilă
}

export interface SignResult {
  signedPdf: Uint8Array;
  provider: string;
  status: "SIGNED";
  signedAt: Date;
  contentHash: string; // sha256 al PDF-ului semnat
}

export interface SignatureProvider {
  readonly name: string;
  sign(pdf: Uint8Array, ctx: SignContext, now: Date): Promise<SignResult>;
}

// Provider mock: adaugă o ștampilă clară „(mock)" + timestamp + hash și
// calculează sha256. NU e semnătură calificată — doar pentru dev/teste.
export class MockSignatureProvider implements SignatureProvider {
  readonly name = "mock";

  async sign(pdf: Uint8Array, ctx: SignContext, now: Date): Promise<SignResult> {
    const doc = await PDFDocument.load(pdf);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.getPages()[0];

    const stamp = [
      "SEMNAT ELECTRONIC (mock - dev)",
      `Formular: ${ctx.formCode}`,
      `Data: ${now.toISOString()}`,
    ];
    let y = 60;
    for (const line of stamp) {
      page.drawText(line, { x: 50, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 10;
    }

    const signedPdf = await doc.save();
    const contentHash = createHash("sha256").update(signedPdf).digest("hex");
    return { signedPdf, provider: this.name, status: "SIGNED", signedAt: now, contentHash };
  }
}

export function getSignatureProvider(): SignatureProvider {
  // Un singur provider în dev. QTSP real se comută aici prin config, când
  // contractul + integrarea CSC există (task 2.x). Vezi ADR 0010.
  return new MockSignatureProvider();
}
