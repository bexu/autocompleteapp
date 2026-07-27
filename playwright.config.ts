import { defineConfig } from "@playwright/test";

// E2E rulează pe un build de PRODUCȚIE (next build + next start), nu pe `next
// dev`: elimină cursele de hidratare la prima compilare Turbopack și verifică
// și că build-ul trece — mai aproape de ce livrăm.

export default defineConfig({
  testDir: "tests/e2e",
  // Un flux ratat nu trebuie să treacă din cauza flakiness; dar nici să blocheze.
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
