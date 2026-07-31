import { test, expect } from "@playwright/test";

// Constatări high din audit: nu exista nicio cale de a șterge/reface un dosar
// greșit, „marchează ca depus" era ireversibil, iar reminderele nu se stingeau.
async function dosarNou(page: import("@playwright/test").Page, tag: string): Promise<string> {
  const email = `e2e_life_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Life Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  await page.goto("/dashboard/petitii");
  await page.getByTestId("subiect").fill("Test");
  await page.getByTestId("continut").fill("Conținut");
  await page.getByTestId("solicitare").fill("Solicitare");
  await page.getByTestId("genereaza-petitie").click();
  await page.getByTestId("dosar-petitie").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  return page.url();
}

test("dosar: „depus” se poate anula (nu mai e ireversibil)", async ({ page }) => {
  await dosarNou(page, "undo");

  await page.getByTestId("marcheaza-depus").click();
  await expect(page.getByTestId("status-depus")).toBeVisible();
  await expect(page.getByTestId("dossier-status")).toHaveText("Depus");

  await page.getByTestId("anuleaza-depus").click();
  await expect(page.getByTestId("marcheaza-depus")).toBeVisible();
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

test("dosar: se poate șterge (cu confirmare) și dispare din listă", async ({ page }) => {
  const url = await dosarNou(page, "del");

  await page.getByTestId("sterge-dosar").click();
  await expect(page.getByTestId("confirma-stergere")).toBeVisible();
  await page.getByTestId("sterge-confirma").click();

  await expect(page).toHaveURL(/\/dashboard\/dosare$/);
  await expect(page.getByTestId("empty")).toBeVisible();

  // dosarul chiar nu mai există
  const res = await page.request.get(url);
  expect(res.status()).toBe(404);
});

test("lista de dosare arată titlul și data, nu doar codul", async ({ page }) => {
  await dosarNou(page, "list");
  await page.goto("/dashboard/dosare");
  const lista = page.getByTestId("dossier-list");
  await expect(lista).toContainText("PETITIE");
  await expect(lista).toContainText("Petiție"); // titlul din manifest
  await expect(lista).toContainText("generat 20"); // data generării
});
