import { test, expect } from "@playwright/test";

// Felie profil: signup → completează profil cu CNP valid → salvat + mască →
// reload dovedește persistența (round-trip prin DB + criptare) → CNP invalid
// e respins la validare.
test("completare profil, persistență și validare CNP", async ({ page }) => {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Test Profil");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByTestId("link-profil").click();
  await expect(page).toHaveURL(/\/dashboard\/profil/);

  // CNP invalid → eroare de validare, fără persistență.
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("cnp").fill("1111111111111");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("error")).toContainText("cnp");

  // CNP valid → salvat + mască pe ultimele 4.
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Reload: masca persistă (datele au fost scrise criptat și recitite).
  await page.reload();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");
  await expect(page.getByTestId("nume")).toHaveValue("Ionescu");
});
