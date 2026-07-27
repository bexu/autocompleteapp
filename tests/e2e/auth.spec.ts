import { test, expect } from "@playwright/test";

// Golden path auth: signup → dashboard → logout → rută protejată redirect →
// login → dashboard. Email unic per rulare ca testul să fie repetabil.
test("signup, logout, login și guard pe ruta protejată", async ({ page }) => {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  // --- Signup ---
  await page.goto("/signup");
  await page.getByTestId("name").fill("Test E2E");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("user-email")).toHaveText(email);
  await expect(page.getByTestId("user-role")).toHaveText("user");

  // --- Logout ---
  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/login/);

  // --- Guard: ruta protejată redirecționează când nu ești logat ---
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  // --- Login ---
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("user-email")).toHaveText(email);
});
