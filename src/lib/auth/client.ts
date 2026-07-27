"use client";

import { createAuthClient } from "better-auth/react";

// Client better-auth pentru componentele din browser (signup/login/logout).
// baseURL implicit = originul curent.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
