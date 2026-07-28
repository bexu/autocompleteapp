import { test, expect } from "@playwright/test";

// Felia deces în familie: profil → wizard → ajutor de deces + pensie de urmaș,
// fiecare cu dosar „de depus".
test("wizard deces: ajutor de deces + pensie de urmaș + checklist", async ({ page }) => {
  const email = `e2e_deces_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Deces Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (solicitant).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("iban").fill("RO49AAAA1B31007593840000"); // pentru plata în cont
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Wizard deces.
  await page.goto("/dashboard/deces");
  await page.getByTestId("decedat-nume").fill("Ionescu Ion");
  await page.getByTestId("decedat-cnp").fill("2980312051007");
  await page.getByTestId("data-deces").fill("2026-06-01");
  await page.getByTestId("decedat-calitate").selectOption("pensionar");
  await page.getByTestId("cert-numar").fill("X-123");
  await page.getByTestId("cert-data").fill("2026-06-03");
  await page.getByTestId("cert-emitent").fill("Primăria Cluj-Napoca");
  await page.getByTestId("calitate-solicitant").selectOption("soț/soție");
  await page.getByTestId("modalitate-plata").selectOption("cont bancar (IBAN)");
  await page.getByTestId("casa-ajutor").fill("Casa Județeană de Pensii Cluj");
  await page.getByTestId("calitate-urmas").selectOption("soț supraviețuitor");
  await page.getByTestId("titulari-urmasi").fill("Ionescu Ana");
  await page.getByTestId("casa-urmas").fill("Casa Județeană de Pensii Cluj");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-AJUTOR-DECES")).toBeVisible();
  await expect(page.getByTestId("form-PENSIE-URMAS")).toBeVisible();
  await expect(page.getByTestId("deces-checklist")).toContainText("casa de pensii");

  await page.getByTestId("dosar-AJUTOR-DECES").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});

// Validare: data decesului imposibilă → eroare, nu generare.
test("wizard deces: data decesului invalidă e respinsă", async ({ page }) => {
  const email = `e2e_deces_bad_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Deces Bad");
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

  await page.goto("/dashboard/deces");
  await page.getByTestId("decedat-nume").fill("Ionescu Ion");
  await page.getByTestId("decedat-cnp").fill("2980312051007");
  await page.getByTestId("data-deces").fill("2026-02-30"); // imposibil
  await page.getByTestId("decedat-calitate").selectOption("pensionar");
  await page.getByTestId("cert-numar").fill("X-123");
  await page.getByTestId("cert-data").fill("2026-06-03");
  await page.getByTestId("cert-emitent").fill("Primăria X");
  await page.getByTestId("calitate-solicitant").selectOption("copil");
  await page.getByTestId("modalitate-plata").selectOption("mandat poștal la domiciliu");
  await page.getByTestId("casa-ajutor").fill("Casa Județeană de Pensii Cluj");
  await page.getByTestId("calitate-urmas").selectOption("copil");
  await page.getByTestId("titulari-urmasi").fill("Ionescu Ana");
  await page.getByTestId("casa-urmas").fill("Casa Județeană de Pensii Cluj");
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("error")).toBeVisible();
  await expect(page.getByTestId("error")).toContainText("dataDeces");
});
