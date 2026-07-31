import { test, expect } from "@playwright/test";

async function signup(page: import("@playwright/test").Page, tag: string) {
  const email = `e2e_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByTestId("name").fill("Test");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill("parola-tare-123");
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// Constatare high din audit: adresa de domiciliu nu putea fi introdusă nicăieri,
// deși formularele o mapează → actele ieșeau cu adresa goală.
test("profil: adresa de domiciliu se salvează și ajunge în formular", async ({ page }) => {
  await signup(page, "adr");

  await page.goto("/dashboard/profil");
  await page.getByTestId("nume").fill("Ionescu");
  await page.getByTestId("prenume").fill("Ana");
  await page.getByTestId("cnp").fill("1960101223143");
  await page.getByTestId("judet").fill("Cluj");
  await page.getByTestId("localitate").fill("Cluj-Napoca");
  await page.getByTestId("strada").fill("Memorandumului");
  await page.getByTestId("nr").fill("10");
  await page.getByTestId("save").click();
  await expect(page.getByTestId("cnp-mask")).toContainText("3143");

  // persistă după reîncărcare
  await page.reload();
  await expect(page.getByTestId("judet")).toHaveValue("Cluj");
  await expect(page.getByTestId("strada")).toHaveValue("Memorandumului");

  // și ajunge în previzualizarea formularului 230 („exact ce semnezi")
  await page.goto("/dashboard/formulare/230");
  await page.getByTestId("benef-denumire").fill("Asociația Exemplu");
  await page.getByTestId("benef-cif").fill("12345678");
  await page.getByTestId("benef-iban").fill("RO49AAAA1B31007593840000");
  await page.getByTestId("previzualizeaza").click();
  await expect(page.getByTestId("pv-localitate")).toHaveText("Cluj-Napoca");
  await expect(page.getByTestId("pv-strada")).toHaveText("Memorandumului");
  await expect(page.getByTestId("pv-judet")).toHaveText("Cluj");
});

// Constatare high: retragerea consimțământului nu oprea nicio prelucrare.
test("consimțământ retras: încărcarea de scanuri e refuzată (403)", async ({ page }) => {
  await signup(page, "cons");

  // acordă, apoi retrage acordul pentru documente
  await page.request.post("/api/gdpr/consent", { data: { category: "DOCUMENTE", action: "grant" } });
  await page.request.post("/api/gdpr/consent", { data: { category: "DOCUMENTE", action: "withdraw" } });

  const res = await page.request.post("/api/documents", {
    multipart: {
      tip: "CI",
      file: { name: "ci.txt", mimeType: "text/plain", buffer: Buffer.from("date") },
    },
  });
  expect(res.status()).toBe(403);
  expect((await res.json()).error).toContain("consimțământ");
});

// Constatare high: lipsea informarea art. 13-14 GDPR.
test("politica de confidențialitate e publică și accesibilă", async ({ page }) => {
  const res = await page.goto("/confidentialitate");
  expect(res?.status()).toBe(200);
  await expect(page.getByTestId("policy-version")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Politica de confidențialitate" })).toBeVisible();
});
