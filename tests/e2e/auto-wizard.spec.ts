import { test, expect } from "@playwright/test";

const CIV = [
  "A: CJ 12 ABC",
  "D.1 BMW",
  "D.3 320d",
  "E: WBA3A5C50FF123456",
  "P.2 140",
  "P.3 Motorina",
  "V.9 Euro 6",
].join("\n");

// Felia dosar auto (2.4/2.5): profil + vehicul → wizard „am vândut" → set de
// documente (ITL-010/054/016) + checklist per instituție.
test("wizard auto: vânzare → set de documente + checklist", async ({ page }) => {
  const email = `e2e_auto_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Auto Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (nume + CNP, necesare pe formularele auto).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Vehicul din CIV.
  await page.goto("/dashboard/vehicule");
  await page.getByTestId("civ-file").setInputFiles({
    name: "civ.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(CIV, "utf8"),
  });
  await expect(page.getByTestId("v-marca")).toHaveValue("BMW");
  await page.getByTestId("v-add").click();
  await expect(page.getByTestId("vehicule-list")).toContainText("BMW 320d");

  // Wizard: am vândut → generează setul de documente.
  await page.goto("/dashboard/auto");
  await page.getByTestId("ev-vanzare").check();
  await page.getByTestId("contraparta-nume").fill("Popescu Dan");
  await page.getByTestId("contraparta-cnp").fill("5000101123457");
  await page.getByTestId("pret").fill("15000");
  await page.getByTestId("data").fill("2026-03-01");
  await page.getByTestId("genereaza-dosar").click();

  // Setul corect + checklist.
  await expect(page.getByTestId("form-ITL-010")).toBeVisible();
  await expect(page.getByTestId("form-ITL-054")).toBeVisible();
  await expect(page.getByTestId("form-ITL-016")).toBeVisible();
  await expect(page.getByTestId("auto-checklist")).toContainText("taxe locale");

  // Un dosar generat se poate deschide (handoff).
  await page.getByTestId("dosar-ITL-016").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("dossier-status")).toHaveText("De depus");
});
