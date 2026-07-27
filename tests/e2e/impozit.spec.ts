import { test, expect } from "@playwright/test";

// Felia impozit imobil (ITL-001): profil + imobil → declarare → preview → dosar.
test("impozit clădire (ITL-001): imobil → preview → generare + dosar", async ({ page }) => {
  const email = `e2e_imp_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("Impozit Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  await page.goto("/dashboard/imobile");
  await page.getByTestId("im-tip").selectOption("APARTAMENT");
  await page.getByTestId("im-localitate").fill("Cluj-Napoca");
  await page.getByTestId("im-cadastral").fill("12345");
  await page.getByTestId("im-add").click();
  await expect(page.getByTestId("imobile-list")).toContainText("APARTAMENT");

  await page.goto("/dashboard/impozit");
  await page.getByTestId("impozit-data").fill("2026-03-01");
  await page.getByTestId("impozit-cota").fill("1/1");
  await page.getByTestId("impozit-valoare").fill("250000");
  await page.getByTestId("impozit-previzualizeaza").click();

  await expect(page.getByTestId("preview")).toBeVisible();
  await expect(page.getByTestId("pv-cnp")).toHaveText("1960101223143");
  await expect(page.getByTestId("pv-imobilLocalitate")).toHaveText("Cluj-Napoca");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("impozit-genereaza").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  expect(Buffer.concat(chunks).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  await page.getByTestId("impozit-vezi-dosar").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);
});
