import { test, expect } from "@playwright/test";

// Felia vehicule (2.1): signup → adaugă un vehicul → apare în listă → șterge.
test("gestionare vehicule: adaugă și șterge", async ({ page }) => {
  const email = `e2e_veh_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Veh Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByTestId("link-vehicule").click();
  await expect(page).toHaveURL(/\/dashboard\/vehicule/);

  await page.getByTestId("v-marca").fill("BMW");
  await page.getByTestId("v-model").fill("320d");
  await page.getByTestId("v-nr").fill("CJ 12 ABC");
  await page.getByTestId("v-norma").fill("Euro 6");
  await page.getByTestId("v-co2").fill("120");
  await page.getByTestId("v-combustibil").selectOption("HIBRID");
  await page.getByTestId("v-add").click();

  await expect(page.getByTestId("vehicule-list")).toContainText("BMW 320d");

  // șterge
  await page.getByTestId("vehicule-list").getByRole("button", { name: "șterge" }).first().click();
  await expect(page.getByTestId("vehicule-list")).not.toContainText("BMW 320d");
});

// Regresie: combustibilul e opțional — a-l lăsa pe „Alege..." NU trebuie să
// blocheze salvarea (un <select> gol trimite "", nu undefined).
test("gestionare vehicule: salvează fără combustibil ales", async ({ page }) => {
  const email = `e2e_veh_nofuel_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Veh NoFuel");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/vehicule");
  await page.getByTestId("v-marca").fill("Dacia");
  await page.getByTestId("v-model").fill("Sandero");
  await page.getByTestId("v-nr").fill("CJ 99 XYZ");
  // NU alegem combustibil — rămâne pe „Alege...".
  await page.getByTestId("v-add").click();

  await expect(page.getByTestId("vehicule-list")).toContainText("Dacia Sandero");
});
