import { headers } from "next/headers";
import { auth, type Session } from "@/lib/auth/auth";
import { hasRole, type Role } from "./rbac";

// Guard-uri de sesiune pentru Server Components / route handlers.
// `requireUser` / `requireRole` aruncă dacă accesul nu e permis — apelantul
// (pagină/route) tratează prin redirect sau 401/403.

export class UnauthorizedError extends Error {
  constructor() {
    super("Neautentificat");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Acces interzis");
    this.name = "ForbiddenError";
  }
}

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<Session["user"]> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session.user;
}

export async function requireRole(required: Role): Promise<Session["user"]> {
  const user = await requireUser();
  const role = (user as { role?: string }).role ?? "user";
  if (!hasRole(role, required)) throw new ForbiddenError();
  return user;
}
