import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

// Instanța better-auth (server). Email + parolă în v1; provideri externi mai
// târziu dacă e nevoie. `role` e câmp adițional pe user pentru RBAC (task 1.1).
// Secretul și baseURL vin din mediu (validate în src/lib/config/env.ts).

// Rate limiting anti brute-force / credential-stuffing (T10 threat model).
// Praguri STRICTE în producție pe rutele de auth (better-auth default ~3/fereastră
// e prea strict și pică suita e2e care creează multe conturi de pe același IP).
// `AUTH_RATE_LIMIT_RELAXED=true` (setat DOAR de mediul de test — vezi
// playwright.config.ts) relaxează pragurile pentru e2e; producția rămâne strictă.
// Modulul rulează server-side, deci process.env e citit la runtime.
const relaxed = process.env.AUTH_RATE_LIMIT_RELAXED === "true";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  rateLimit: {
    enabled: true,
    window: 60,
    max: relaxed ? 1000 : 60,
    // Praguri per-IP pe rutele sensibile: login mai strict decât signup.
    customRules: {
      "/sign-up/email": { window: 60, max: relaxed ? 1000 : 20 },
      "/sign-in/email": { window: 60, max: relaxed ? 1000 : 10 },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // rolul nu se poate seta de client la signup
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
