import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Teste de integrare — ating Postgres real (migrat). Rulate separat de unit
// (`npm run test:integration`) fiindcă necesită DB.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/integration/setup.ts"],
    fileParallelism: false, // ating aceeași DB — rulăm serial
  },
});
