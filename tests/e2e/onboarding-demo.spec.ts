import { test, expect } from "@playwright/test";

// Onboarding cu date de exemplu (demo): fără upload, formularul se pre-completează
// cu date de exemplu valide → consimțământ → salvare în profil.
test("onboarding: date de exemplu → profil pre-completat", async ({ page }) => {
  const email = `e2e_demo_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Demo Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByTestId("link-onboarding").click();
  await page.getByTestId("demo").click();

  // Formularul de confirmare e pre-completat cu date de exemplu valide.
  await expect(page.getByTestId("f-cnp")).toHaveValue("1960101223143");
  await expect(page.getByTestId("f-nume")).toHaveValue("Popescu");
  await expect(page.getByTestId("info")).toBeVisible();

  await page.getByTestId("consent").check();
  await page.getByTestId("confirm").click();
  await expect(page).toHaveURL(/\/dashboard\/profil/);
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");
});
