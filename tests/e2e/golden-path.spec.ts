import { test, expect } from "@playwright/test";

// Golden path — felia 230 cap-coadă, într-un singur parcurs (acceptare task 1.9):
// signup → onboarding (upload CI + OCR + consimțământ) → profil pre-completat →
// formular 230 → preview „exact ce semnezi" → semnătură (mock) → dosar → handoff
// (checklist + canal SPV) → marchează depus.

const MRZ = [
  "IDROUTR123456<51960101223143<<",
  "9601019M3001019ROU<<<<<<<<<<<7",
  "IONESCU<<ANA<MARIA<<<<<<<<<<<<",
].join("\n");

test("felia 230 completă: onboarding → 230 → preview → semnat → handoff", async ({ page }) => {
  const email = `e2e_gp_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  // 1) Cont nou
  await page.goto("/signup");
  await page.getByTestId("name").fill("Golden Path");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // 2) Onboarding: upload CI cu MRZ → OCR → consimțământ → confirmare
  await page.getByTestId("link-onboarding").click();
  await page.getByTestId("file").setInputFiles({
    name: "buletin.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(MRZ, "utf8"),
  });
  await page.getByTestId("acord-scan").check();
  await page.getByTestId("upload").click();
  await expect(page.getByTestId("f-cnp")).toHaveValue("1960101223143");
  await expect(page.getByTestId("f-nume")).toHaveValue("IONESCU");
  await page.getByTestId("consent").check();
  await page.getByTestId("confirm").click();

  // 3) Profil pre-completat din OCR (CNP mascat)
  await expect(page).toHaveURL(/\/dashboard\/profil/);
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // 4) Formular 230 → completează entitatea beneficiară → preview
  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Binele");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  await page.getByTestId("benef-doiani").check();
  await page.getByTestId("previzualizeaza").click();

  // 5) Preview „exact ce semnezi" — datele din profil (OCR) + beneficiar
  await expect(page.getByTestId("preview")).toBeVisible();
  await expect(page.getByTestId("pv-nume")).toHaveText("IONESCU");
  await expect(page.getByTestId("pv-cnp")).toHaveText("1960101223143");
  await expect(page.getByTestId("pv-beneficiarDenumire")).toHaveText("Asociația Binele");
  await expect(page.getByTestId("pv-doiAni")).toHaveText("Da");

  // 6) Semnătură (mock) → PDF semnat descărcat + dosar deschis
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("semneaza").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  expect(Buffer.concat(chunks).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await expect(page.getByTestId("signed")).toBeVisible();

  // 7) Handoff: checklist + canal SPV + termen → marchează depus
  await page.getByTestId("vezi-dosar").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
  await expect(page.getByTestId("checklist")).toBeVisible();
  await expect(page.getByTestId("channel-spv")).toContainText("SPV");
  await page.getByTestId("marcheaza-depus").click();
  await expect(page.getByTestId("status-depus")).toBeVisible();

  // 8) Dosarul apare ca depus în listă
  await page.goto("/dashboard/dosare");
  await expect(page.getByTestId("dossier-230")).toBeVisible();
});
