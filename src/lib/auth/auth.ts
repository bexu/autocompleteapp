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
