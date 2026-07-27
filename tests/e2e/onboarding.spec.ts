import { test, expect } from "@playwright/test";

// Felie onboarding: signup → upload CI (fișier cu MRZ) → OCR extrage câmpurile →
// user confirmă → datele ajung criptate în profil (mască pe CNP).
const MRZ = [
  "IDROUTR123456<51960101223143<<",
  "9601019M3001019ROU<<<<<<<<<<<7",
  "IONESCU<<ANA<MARIA<<<<<<<<<<<<",
].join("\n");

test("upload CI → OCR → confirmare → profil pre-completat", async ({ page }) => {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Onb Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByTestId("link-onboarding").click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Încarcă un „scan" cu MRZ (fișier text).
  await page.getByTestId("file").setInputFiles({
    name: "buletin.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(MRZ, "utf8"),
  });
  await page.getByTestId("upload").click();

  // OCR a extras câmpurile → sunt pre-completate în formularul de confirmare.
  await expect(page.getByTestId("f-cnp")).toHaveValue("1960101223143");
  await expect(page.getByTestId("f-nume")).toHaveValue("IONESCU");
  await expect(page.getByTestId("f-serie")).toHaveValue("TR");
  await expect(page.getByTestId("f-dob")).toHaveValue("1996-01-01");

  // Confirmă (cu consimțământ) → salvare în profil → redirect la profil.
  await page.getByTestId("consent").check();
  await page.getByTestId("confirm").click();
  await expect(page).toHaveURL(/\/dashboard\/profil/);
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");
});
