import { test, expect } from "@playwright/test";

// Felia dosar copil: profil → wizard „am devenit părinte" → alocație de stat +
// indemnizație creștere copil, fiecare cu dosar „de depus".
test("wizard copil: alocație + indemnizație + checklist", async ({ page }) => {
  const email = `e2e_copil_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Copil Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (solicitant).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Popescu");
  await page.getByTestId("prenume").fill("Andrei");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Wizard copil.
  await page.goto("/dashboard/copil");
  await page.getByTestId("copil-nume").fill("Popescu");
  await page.getByTestId("copil-prenume").fill("Maria");
  await page.getByTestId("copil-cnp").fill("5000101123457");
  await page.getByTestId("copil-data").fill("2026-06-01");
  await page.getByTestId("angajator").fill("ACME SRL");
  await page.getByTestId("perioada").fill("01.07.2026 – 01.07.2028");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-ALOCATIE")).toBeVisible();
  await expect(page.getByTestId("form-INDEMNIZATIE")).toBeVisible();
  await expect(page.getByTestId("copil-checklist")).toContainText("AJPIS");

  await page.getByTestId("dosar-ALOCATIE").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});
