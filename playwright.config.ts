import { defineConfig } from "@playwright/test";

// E2E rulează pe un build de PRODUCȚIE (next build + next start), nu pe `next
// dev`: elimină cursele de hidratare la prima compilare Turbopack și verifică
// și că build-ul trece — mai aproape de ce livrăm.

export default defineConfig({
  testDir: "tests/e2e",
  // Server + DB partajate + hashing de parolă (scrypt) intenționat lent →
  // serializăm ca să nu apară timeout-uri din contenție, nu din bug-uri.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
