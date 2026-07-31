import { test, expect } from "@playwright/test";

// Descărcarea documentului dintr-un dosar: userul trebuie să poată lua PDF-ul
// generat (altfel checklist-ul „descarcă PDF-ul" nu are cum să fie urmat).
test("dosar: butonul de descărcare întoarce PDF-ul generat", async ({ page }) => {
  const email = `e2e_dl_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

  await page.goto("/signup");
  await page.getByTestId("name").fill("Download Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // Generează o petiție → dosar.
  await page.goto("/dashboard/petitii");
  await page.getByTestId("subiect").fill("Produs defect");
  await page.getByTestId("continut").fill("Descrierea situației.");
  await page.getByTestId("solicitare").fill("Solicit înlocuirea.");
  await page.getByTestId("genereaza-petitie").click();
  await page.getByTestId("dosar-petitie").click();
  await expect(page).toHaveURL(/\/dashboard\/dosare\//);

  // Butonul există și livrează un PDF real.
  const link = page.getByTestId("download-pdf");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();

  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["content-disposition"]).toContain("attachment");
  const body = await res.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");
});

// Izolare: un alt user nu poate descărca dosarul altcuiva.
test("dosar: alt user NU poate descărca documentul (404)", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  const emailA = `e2e_dlA_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

  await pageA.goto("/signup");
  await pageA.getByTestId("name").fill("User A");
  await pageA.getByTestId("email").fill(emailA);
  await pageA.getByTestId("password").fill("parola-tare-123");
  await pageA.getByTestId("submit").click();
  await expect(pageA).toHaveURL(/\/dashboard/);

  await pageA.goto("/dashboard/profil");
  await pageA.getByTestId("nume").fill("Ionescu");
  await pageA.getByTestId("prenume").fill("Ana");
  await pageA.getByTestId("cnp").fill("1960101223143");
  await pageA.getByTestId("save").click();
  await expect(pageA.getByTestId("cnp-mask")).toContainText("3143");

  await pageA.goto("/dashboard/petitii");
  await pageA.getByTestId("subiect").fill("X");
  await pageA.getByTestId("continut").fill("Y");
  await pageA.getByTestId("solicitare").fill("Z");
  await pageA.getByTestId("genereaza-petitie").click();
  await pageA.getByTestId("dosar-petitie").click();
  const hrefA = await pageA.getByTestId("download-pdf").getAttribute("href");
  await ctxA.close();

  // User B, sesiune separată, cere URL-ul lui A.
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  const emailB = `e2e_dlB_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await pageB.goto("/signup");
  await pageB.getByTestId("name").fill("User B");
  await pageB.getByTestId("email").fill(emailB);
  await pageB.getByTestId("password").fill("parola-tare-123");
  await pageB.getByTestId("submit").click();
  await expect(pageB).toHaveURL(/\/dashboard/);

  const res = await pageB.request.get(hrefA!);
  expect(res.status()).toBe(404); // fără leak de existență
  await ctxB.close();
});
