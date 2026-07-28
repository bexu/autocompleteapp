import { test, expect } from "@playwright/test";

async function signupAndProfile(page: import("@playwright/test").Page, tag: string) {
  const email = `e2e_pfa_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("PFA Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Popescu");
  await page.getByTestId("prenume").fill("Ion");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");
}

// Felia PFA: înființare → rezervare denumire + înregistrare, fiecare cu dosar.
test("wizard PFA: înființare → rezervare + înregistrare", async ({ page }) => {
  await signupAndProfile(page, "new");

  await page.goto("/dashboard/pfa");
  await page.getByTestId("ev-infiintare").check();
  await page.getByTestId("tip-entitate").selectOption("PFA");
  await page.getByTestId("denumire-propusa").fill("Popescu Ion PFA");
  await page.getByTestId("judet-sediu").fill("Cluj");
  await page.getByTestId("sediu-localitate").fill("Cluj-Napoca");
  await page.getByTestId("sediu-strada").fill("Memorandumului");
  await page.getByTestId("sediu-numar").fill("10");
  await page.getByTestId("dovada-spatiu").selectOption("Proprietate");
  await page.getByTestId("caen-principal").fill("6201");
  await page.getByTestId("descriere-caen").fill("Activități de realizare a software-ului la comandă");
  await page.getByTestId("data-inceput").fill("2026-09-01");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-REZERVARE-PFA")).toBeVisible();
  await expect(page.getByTestId("form-INREGISTRARE-PFA")).toBeVisible();
  await expect(page.getByTestId("pfa-checklist")).toContainText("ORCT");

  await page.getByTestId("dosar-INREGISTRARE-PFA").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Mențiune: suspendare → doar cererea de mențiuni.
test("wizard PFA: mențiune (suspendare) → cerere de mențiuni", async ({ page }) => {
  await signupAndProfile(page, "ment");

  await page.goto("/dashboard/pfa");
  await page.getByTestId("ev-mentiune").check();
  await page.getByTestId("denumire-pfa").fill("Popescu Ion PFA");
  await page.getByTestId("nr-ordine").fill("F40/1234/2020");
  await page.getByTestId("cui").fill("12345678");
  await page.getByTestId("orct-judet").fill("Cluj");
  await page.getByTestId("tip-mentiune").selectOption("Suspendare activitate");
  await page.getByTestId("data-suspendare").fill("2027-09-01");
  await page.getByTestId("mod-eliberare").selectOption("Ghișeu");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-MENTIUNI-PFA")).toBeVisible();

  await page.getByTestId("dosar-MENTIUNI-PFA").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Validare: cod CAEN invalid → eroare, nu generare.
test("wizard PFA: cod CAEN invalid e respins", async ({ page }) => {
  await signupAndProfile(page, "badcaen");

  await page.goto("/dashboard/pfa");
  await page.getByTestId("ev-infiintare").check();
  await page.getByTestId("tip-entitate").selectOption("PFA");
  await page.getByTestId("denumire-propusa").fill("Popescu Ion PFA");
  await page.getByTestId("judet-sediu").fill("Cluj");
  await page.getByTestId("sediu-localitate").fill("Cluj-Napoca");
  await page.getByTestId("sediu-strada").fill("Memorandumului");
  await page.getByTestId("sediu-numar").fill("10");
  await page.getByTestId("dovada-spatiu").selectOption("Proprietate");
  await page.getByTestId("caen-principal").fill("62"); // invalid (nu 4 cifre)
  await page.getByTestId("descriere-caen").fill("Programare");
  await page.getByTestId("data-inceput").fill("2026-09-01");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("error")).toBeVisible();
  await expect(page.getByTestId("error")).toContainText("codCaenPrincipal");
});
