import { test, expect } from "@playwright/test";

// Felia cadastru/CF: profil + imobil → wizard înscriere → extras CF + cerere de
// înscriere, fiecare cu dosar „de depus".
test("wizard cadastru: extras CF + cerere de înscriere + checklist", async ({ page }) => {
  const email = `e2e_cad_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Cadastru Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (solicitant).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Imobil (cu nr. cadastral + CF).
  await page.goto("/dashboard/imobile");
  await page.getByTestId("im-tip").selectOption("APARTAMENT");
  await page.getByTestId("im-judet").fill("Cluj");
  await page.getByTestId("im-localitate").fill("Cluj-Napoca");
  await page.getByTestId("im-cadastral").fill("12345");
  await page.getByTestId("im-cf").fill("CF999");
  await page.getByTestId("im-add").click();
  await expect(page.getByTestId("imobile-list")).toContainText("Cluj-Napoca");

  // Wizard cadastru.
  await page.goto("/dashboard/cadastru");
  await page.getByTestId("fel-inscriere").selectOption("Intabulare");
  await page.getByTestId("descriere-drept").fill("drept de proprietate");
  await page.getByTestId("act-tip").fill("act notarial");
  await page.getByTestId("act-numar").fill("1234");
  await page.getByTestId("act-data").fill("2026-05-10");
  await page.getByTestId("act-emitent").fill("BNP Exemplu");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-CERERE-INSCRIERE-CF")).toBeVisible();
  await expect(page.getByTestId("form-EXTRAS-CF")).toBeVisible();
  await expect(page.getByTestId("cadastru-checklist")).toContainText("BCPI");

  await page.getByTestId("dosar-CERERE-INSCRIERE-CF").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Validare server (defense in depth): inputul nativ de dată previne deja o dată
// imposibilă în UI, dar API-ul trebuie să o respingă oricum.
test("API cadastru: dată imposibilă e respinsă de server", async ({ page }) => {
  const email = `e2e_cad_api_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Api Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  const res = await page.request.post("/api/cadastru/generate", { data: {
    imobilId: "inexistent", felInscriere: "Intabulare", descriereDrept: "proprietate",
    actTip: "act notarial", actNumar: "1", actData: "2026-02-30", actEmitent: "BNP X",
    modComunicare: "E-mail", scopExtras: "Extras de carte funciară pentru informare",
  } });
  expect(res.status()).toBe(400);
  const b = await res.json();
  expect(b.error).toBe("validare");
  expect(b.fields).toContain("actData");
  expect(JSON.stringify(b.details)).toContain("dată invalidă");
});
