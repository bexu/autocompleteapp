import { test, expect } from "@playwright/test";

// Felia 2.2: upload CIV → OCR pre-completează formularul de vehicul → salvare.
const CIV = [
  "A: CJ 12 ABC",
  "D.1 BMW",
  "D.3 320d",
  "E: WBA3A5C50FF123456",
  "P.2 140",
  "P.3 Motorina",
  "V.9 Euro 6",
].join("\n");

test("upload CIV → pre-completare vehicul → salvare", async ({ page }) => {
  const email = `e2e_civ_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("CIV Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByTestId("link-vehicule").click();
  await page.getByTestId("civ-file").setInputFiles({
    name: "civ.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(CIV, "utf8"),
  });

  // OCR a pre-completat câmpurile.
  await expect(page.getByTestId("v-marca")).toHaveValue("BMW");
  await expect(page.getByTestId("v-vin")).toHaveValue("WBA3A5C50FF123456");
  await expect(page.getByTestId("v-putere")).toHaveValue("140");
  await expect(page.getByTestId("v-norma")).toHaveValue("Euro 6");

  // Salvează → apare în listă.
  await page.getByTestId("v-add").click();
  await expect(page.getByTestId("vehicule-list")).toContainText("BMW 320d");
});
