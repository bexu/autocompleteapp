import { test, expect } from "@playwright/test";

async function signup(page: import("@playwright/test").Page, tag: string) {
  const email = `e2e_plat_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Plat Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// Audit: backend-ul de documente era complet, dar scanurile erau invizibile în UI.
test("seiful de documente: listare, descărcare și ștergere", async ({ page }) => {
  await signup(page, "docs");

  // gol la început
  await page.goto("/dashboard/documente");
  await expect(page.getByTestId("empty")).toBeVisible();

  // urcă un scan prin onboarding (cu acordul cerut)
  await page.goto("/dashboard/onboarding");
  await page.getByTestId("file").setInputFiles({
    name: "ci.txt", mimeType: "text/plain", buffer: Buffer.from("IDROU..."),
  });
  await page.getByTestId("acord-scan").check();
  await page.getByTestId("upload").click();
  await expect(page.getByTestId("f-cnp")).toBeVisible();

  // apare în seif, se descarcă și se poate șterge
  await page.goto("/dashboard/documente");
  const lista = page.getByTestId("documents-list");
  await expect(lista).toContainText("ci.txt");
  await expect(lista).toContainText("se șterge automat pe");

  const link = page.locator('[data-testid^="download-"]').first();
  const res = await page.request.get((await link.getAttribute("href"))!);
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toContain("no-store");

  await page.locator('[data-testid^="delete-"]').first().click();
  await expect(page.getByTestId("empty")).toBeVisible();
});

// Audit: nicio protecție anti-framing și nicio CSP.
test("antete de securitate: CSP + anti-framing", async ({ page }) => {
  const res = await page.goto("/login");
  const h = res!.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
});

// Audit: UI-ul anunța „Semnat" deși providerul de semnătură e mock.
test("230: UI-ul nu pretinde semnătură calificată cât timp providerul e mock", async ({ page }) => {
  await signup(page, "sig");
  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Exemplu");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  await page.getByTestId("previzualizeaza").click();
  await expect(page.getByTestId("nota-semnatura")).toContainText("nu poartă încă o");
});

// Audit: lipsea not-found.tsx → pagina 404 implicită Next, în engleză.
test("404: pagină proprie, în română", async ({ page }) => {
  const res = await page.goto("/ruta-care-nu-exista");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Pagina nu există" })).toBeVisible();
});
