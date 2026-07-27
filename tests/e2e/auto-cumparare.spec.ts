import { test, expect } from "@playwright/test";

const CIV = [
  "A: B 123 XYZ",
  "D.1 Dacia",
  "D.3 Sandero",
  "E: UU1DJF00765432109",
  "P.2 66",
  "P.3 Benzina",
  "V.9 Euro 6",
].join("\n");

// Felia dosar auto — cumpărare (2.6): profil + vehicul → wizard „am cumpărat" →
// set de documente pentru cumpărător (ITL-005 declarare + DGPCI transcriere).
test("wizard auto: cumpărare → declarare taxe + transcriere DGPCI", async ({ page }) => {
  const email = `e2e_cump_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Cump Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Georgescu");
  await page.getByTestId("prenume").fill("Ion");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  await page.goto("/dashboard/vehicule");
  await page.getByTestId("civ-file").setInputFiles({
    name: "civ.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(CIV, "utf8"),
  });
  await expect(page.getByTestId("v-marca")).toHaveValue("Dacia");
  await page.getByTestId("v-add").click();
  await expect(page.getByTestId("vehicule-list")).toContainText("Dacia Sandero");

  // Wizard: am cumpărat (fără câmpuri de contraparte — datele vin din profil+vehicul).
  await page.goto("/dashboard/auto");
  await page.getByTestId("ev-cumparare").check();
  await page.getByTestId("genereaza-dosar").click();

  await expect(page.getByTestId("form-ITL-005")).toBeVisible();
  await expect(page.getByTestId("form-DGPCI")).toBeVisible();
  await expect(page.getByTestId("auto-checklist")).toContainText("DGPCI");

  await page.getByTestId("dosar-ITL-005").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});
