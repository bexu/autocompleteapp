import { test, expect } from "@playwright/test";

// Felia 230 completă: profil → completare beneficiar → preview „exact ce
// semnezi" → semnătură (mock) → PDF semnat descărcat + arhivat.
test("230: profil → preview → semnătură + arhivare", async ({ page }) => {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("F230 Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Fără profil → preview respins.
  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Test");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  await page.getByTestId("previzualizeaza").click();
  await expect(page.getByTestId("error")).toContainText("profilul");

  // Completează profilul.
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Preview: datele din profil + beneficiar sunt afișate „exact ce semnezi".
  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Test");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  await page.getByTestId("previzualizeaza").click();

  await expect(page.getByTestId("preview")).toBeVisible();
  await expect(page.getByTestId("pv-nume")).toHaveText("Ionescu");
  await expect(page.getByTestId("pv-cnp")).toHaveText("1960101223143");
  await expect(page.getByTestId("pv-beneficiarDenumire")).toHaveText("Asociația Test");

  // Semnează → descarcă PDF semnat.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("semneaza").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  const pdf = Buffer.concat(chunks);
  expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await expect(page.getByTestId("signed")).toBeVisible();

  // Handoff: mergi la dosar → checklist + canale (SPV) → marchează depus.
  await page.getByTestId("vezi-dosar").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
  await expect(page.getByTestId("checklist")).toBeVisible();
  await expect(page.getByTestId("channel-spv")).toContainText("SPV");
  await page.getByTestId("marcheaza-depus").click();
  await expect(page.getByTestId("status-depus")).toBeVisible();
});
