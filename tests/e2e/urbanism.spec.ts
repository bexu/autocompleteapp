import { test, expect } from "@playwright/test";

async function setup(page: import("@playwright/test").Page, tag: string) {
  const email = `e2e_urb_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Urb Test");
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
  await page.goto("/dashboard/imobile");
  await page.getByTestId("im-tip").selectOption("TEREN");
  await page.getByTestId("im-judet").fill("Cluj");
  await page.getByTestId("im-localitate").fill("Cluj-Napoca");
  await page.getByTestId("im-cadastral").fill("12345");
  await page.getByTestId("im-add").click();
  await expect(page.getByTestId("imobile-list")).toContainText("Cluj-Napoca");
}

// Certificat de urbanism → dosar.
test("wizard urbanism: certificat de urbanism", async ({ page }) => {
  await setup(page, "cert");
  await page.goto("/dashboard/urbanism");
  await page.getByTestId("ev-certificat").check();
  await page.getByTestId("scop-solicitare").selectOption("Construire");
  await page.getByTestId("tip-obiect").selectOption("Teren");
  await page.getByTestId("descriere-scop").fill("Construire casă de locuit P+1");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-CERTIFICAT-URBANISM")).toBeVisible();
  await expect(page.getByTestId("urbanism-checklist")).toContainText("OCPI");

  await page.getByTestId("dosar-CERTIFICAT-URBANISM").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Autorizație de construire → dosar.
test("wizard urbanism: autorizație de construire", async ({ page }) => {
  await setup(page, "aut");
  await page.goto("/dashboard/urbanism");
  await page.getByTestId("ev-autorizatie").check();
  await page.getByTestId("tip-lucrare").selectOption("Construire");
  await page.getByTestId("valoare-lucrari").fill("150000");
  await page.getByTestId("descriere-lucrare").fill("Casă de locuit P+1");
  await page.getByTestId("cert-numar").fill("CU-123");
  await page.getByTestId("cert-data").fill("2026-05-10");
  await page.getByTestId("proiectant").fill("Arh. X, OAR Cluj");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-AUTORIZATIE-CONSTRUIRE")).toBeVisible();

  await page.getByTestId("dosar-AUTORIZATIE-CONSTRUIRE").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Validare: valoarea lucrărilor ne-numerică → eroare.
test("wizard urbanism: valoarea lucrărilor ne-numerică e respinsă", async ({ page }) => {
  await setup(page, "badval");
  await page.goto("/dashboard/urbanism");
  await page.getByTestId("ev-autorizatie").check();
  await page.getByTestId("tip-lucrare").selectOption("Construire");
  await page.getByTestId("valoare-lucrari").fill("mult"); // invalid
  await page.getByTestId("descriere-lucrare").fill("Casă");
  await page.getByTestId("cert-numar").fill("CU-123");
  await page.getByTestId("cert-data").fill("2026-05-10");
  await page.getByTestId("proiectant").fill("Arh. X");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("error")).toBeVisible();
  await expect(page.getByTestId("error")).toContainText("valoareLucrari");
});
