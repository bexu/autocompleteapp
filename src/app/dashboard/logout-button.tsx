"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await signOut();
    router.push("/login");
  }

  return (
    <button type="button" className="btn btn--ghost btn--sm" onClick={onClick} data-testid="logout">
      Deconectează-te
    </button>
  );
}
