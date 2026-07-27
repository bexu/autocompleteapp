import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

// Toate rutele better-auth (sign-up, sign-in, sign-out, session, ...).
export const { GET, POST } = toNextJsHandler(auth);
