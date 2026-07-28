import { test, expect } from "@playwright/test";

// Felia dosar șomaj: profil → wizard „am rămas fără loc de muncă" → înregistrare
// ANOFM (mediere) + cerere indemnizație, fiecare cu dosar „de depus".
test("wizard șomaj: înregistrare ANOFM + indemnizație + checklist", async ({ page }) => {
  const email = `e2e_somaj_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Somaj Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (solicitant).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Andrei");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Wizard șomaj.
  await page.goto("/dashboard/somaj");
  await page.getByTestId("ultima-forma").fill("Studii superioare");
  await page.getByTestId("act-absolvire").fill("Diplomă X 123, 2015, UBB");
  await page.getByTestId("stare-civila").fill("Necăsătorit");
  await page.getByTestId("cetatenie").fill("Română");
  await page.getByTestId("capacitate-munca").fill("Aptă, fără restricții");
  await page.getByTestId("ultimul-angajator").fill("ACME SRL");
  await page.getByTestId("data-incetare").fill("2026-07-01");
  await page.getByTestId("motiv-incetare").fill("Concediere (art. 65)");
  await page.getByTestId("adeverinta-medicala").fill("Nr. 55 / 2026-07-05");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-INREGISTRARE-ANOFM")).toBeVisible();
  await expect(page.getByTestId("form-SOMAJ")).toBeVisible();
  await expect(page.getByTestId("somaj-checklist")).toContainText("AJOFM");

  await page.getByTestId("dosar-SOMAJ").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Validare de input: dată de încetare imposibilă → eroare, nu generare.
test("wizard șomaj: dată de încetare invalidă e respinsă", async ({ page }) => {
  const email = `e2e_somaj_bad_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Somaj Bad");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Andrei");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  await page.goto("/dashboard/somaj");
  await page.getByTestId("ultima-forma").fill("Studii superioare");
  await page.getByTestId("act-absolvire").fill("Diplomă X 123");
  await page.getByTestId("stare-civila").fill("Necăsătorit");
  await page.getByTestId("cetatenie").fill("Română");
  await page.getByTestId("capacitate-munca").fill("Aptă");
  await page.getByTestId("ultimul-angajator").fill("ACME SRL");
  await page.getByTestId("data-incetare").fill("2026-02-30"); // 30 feb — imposibil
  await page.getByTestId("motiv-incetare").fill("Concediere");
  await page.getByTestId("adeverinta-medicala").fill("Nr. 55");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("error")).toBeVisible();
  await expect(page.getByTestId("error")).toContainText("dataIncetare");
});
