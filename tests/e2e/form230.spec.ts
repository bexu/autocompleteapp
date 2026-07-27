import { test, expect } from "@playwright/test";

// Felie 230: signup → completează profil (nume+CNP) → formular 230 → generează
// PDF (validare + mapare + generare). Cazul incomplet e respins.
test("generare 230 din profil + entitate beneficiară", async ({ page }) => {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("F230 Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Fără profil → generarea e respinsă (câmpuri obligatorii lipsă).
  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Test");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  await page.getByTestId("genereaza").click();
  await expect(page.getByTestId("error")).toContainText("profilul");

  // Completează profilul (nume + prenume + CNP).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Acum generarea reușește și descarcă un PDF.
  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Test");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("genereaza").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  const pdf = Buffer.concat(chunks);
  expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await expect(page.getByTestId("done")).toBeVisible();
});
