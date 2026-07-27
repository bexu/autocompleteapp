import { test, expect } from "@playwright/test";

// Felia C168 (3.2–3.5): profil + imobil → contract → preview → generare → dosar.
test("C168: imobil + contract → preview → generare + dosar", async ({ page }) => {
  const email = `e2e_c168_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("C168 Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Profil (locator).
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Imobil.
  await page.goto("/dashboard/imobile");
  await page.getByTestId("im-tip").selectOption("APARTAMENT");
  await page.getByTestId("im-localitate").fill("Cluj-Napoca");
  await page.getByTestId("im-strada").fill("Memorandumului");
  await page.getByTestId("im-add").click();
  await expect(page.getByTestId("imobile-list")).toContainText("Memorandumului");

  // C168.
  await page.goto("/dashboard/c168");
  await page.getByTestId("c168-tip").selectOption("Înregistrare");
  await page.getByTestId("c168-chirias-nume").fill("Popescu Dan");
  await page.getByTestId("c168-chirias-cnp").fill("5000101123457");
  await page.getByTestId("c168-chirie").fill("1500");
  await page.getByTestId("c168-moneda").selectOption("RON");
  await page.getByTestId("c168-start").fill("2026-08-01");
  await page.getByTestId("c168-data").fill("2026-07-27");
  await page.getByTestId("c168-previzualizeaza").click();

  // Preview „exact ce declari".
  await expect(page.getByTestId("preview")).toBeVisible();
  await expect(page.getByTestId("pv-locatorNume")).toHaveText("Ionescu");
  await expect(page.getByTestId("pv-imobilLocalitate")).toHaveText("Cluj-Napoca");
  await expect(page.getByTestId("pv-chiriasNume")).toHaveText("Popescu Dan");

  // Generează → dosar.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("c168-genereaza").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  expect(Buffer.concat(chunks).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  await page.getByTestId("c168-vezi-dosar").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
  await expect(page.getByTestId("channel-spv")).toContainText("SPV");
});
