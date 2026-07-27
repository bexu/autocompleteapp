import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

// Instanța better-auth (server). Email + parolă în v1; provideri externi mai
// târziu dacă e nevoie. `role` e câmp adițional pe user pentru RBAC (task 1.1).
// Secretul și baseURL vin din mediu (validate în src/lib/config/env.ts).

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Rate limiting activ (securitate — T10 threat model). Prag explicit generos
  // (default-ul better-auth e prea strict — ~3/fereastră — și pică suita e2e).
  // 100/60s/IP e protectiv în practică; reglarea fină pe rute sensibile = H.3.
  // NB: nu comuta prin env — Next.js inline-ază process.env la build-time.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    // better-auth are reguli implicite STRICTE pe rutele de auth (~3/fereastră)
    // — le suprascriem cu praguri generoase (protectiv, dar nu blochează e2e).
    customRules: {
      "/sign-up/email": { window: 60, max: 100 },
      "/sign-in/email": { window: 60, max: 100 },
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
