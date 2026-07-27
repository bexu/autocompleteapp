import { test, expect } from "@playwright/test";

// Felia imobile (3.1): signup → adaugă un imobil → apare în listă → șterge.
test("gestionare imobile: adaugă și șterge", async ({ page }) => {
  const email = `e2e_imo_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Imo Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByTestId("link-imobile").click();
  await expect(page).toHaveURL(/\/dashboard\/imobile/);

  await page.getByTestId("im-tip").selectOption("APARTAMENT");
  await page.getByTestId("im-localitate").fill("Cluj-Napoca");
  await page.getByTestId("im-strada").fill("Memorandumului");
  await page.getByTestId("im-suprafata").fill("65");
  await page.getByTestId("im-add").click();

  await expect(page.getByTestId("imobile-list")).toContainText("APARTAMENT");
  await expect(page.getByTestId("imobile-list")).toContainText("Memorandumului");

  await page.getByTestId("imobile-list").getByRole("button", { name: "șterge" }).first().click();
  await expect(page.getByTestId("imobile-list")).not.toContainText("Memorandumului");
});
