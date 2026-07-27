import { test, expect } from "@playwright/test";

// Felie GDPR: consimțământ per categorie, export date, ștergere date.
test("consimțământ, export și ștergere date", async ({ page }) => {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = "parola-tare-123";

  await page.goto("/signup");
  await page.getByTestId("name").fill("GDPR Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Salvează un profil (ca să avem ce exporta/șterge).
  await page.getByTestId("link-profil").click();
  await page.getByTestId("nume").fill("Testescu");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Confidențialitate: acordă un consimțământ.
  await page.goto("/dashboard/confidentialitate");
  const identitate = page.getByTestId("consent-IDENTITATE");
  await identitate.check();
  await expect(identitate).toBeChecked();

  // Export: descarcă JSON și verifică că profilul e inclus.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  const json = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(json.profile?.nume).toBe("Testescu");
  expect(json.profile?.cnp).toBe("1960101223143");
  expect(json.consents.some((c: { category: string; granted: boolean }) => c.category === "IDENTITATE" && c.granted)).toBe(true);

  // Ștergere date: acceptă confirmarea și verifică că profilul a dispărut.
  page.on("dialog", (d) => d.accept());
  await page.getByTestId("delete-data").click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByTestId("link-profil").click();
  await expect(page.getByTestId("cnp-mask")).toHaveCount(0); // profil șters
});
