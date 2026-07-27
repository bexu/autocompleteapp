import { test, expect } from "@playwright/test";

// Exemplu de test E2E. Înlocuiește cu drumul principal al aplicației tale.
test("pagina principală se încarcă", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.*/);
});
