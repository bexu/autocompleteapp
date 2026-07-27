import { test, expect } from "@playwright/test";

// Felia petiție universală: profil → builder petiție → cerere generată + dosar
// „de depus" către instituția aleasă.
test("builder petiție: generează cerere + dosar", async ({ page }) => {
  const email = `e2e_petitie_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Petitie Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (petent).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Builder petiție.
  await page.goto("/dashboard/petitii");
  await page.getByTestId("subiect").fill("Produs defect");
  await page.getByTestId("continut").fill("Am cumpărat un produs care nu funcționează conform specificațiilor.");
  await page.getByTestId("solicitare").fill("Solicit înlocuirea produsului.");
  await page.getByTestId("genereaza-petitie").click();

  await expect(page.getByTestId("dosar-petitie")).toBeVisible();
  await page.getByTestId("dosar-petitie").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});
