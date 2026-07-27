"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Autentificare eșuată");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Autentificare</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input name="email" type="email" placeholder="Email" required data-testid="email" />
        <input
          name="password"
          type="password"
          placeholder="Parolă"
          required
          data-testid="password"
        />
        <button type="submit" disabled={loading} data-testid="submit">
          {loading ? "Se conectează..." : "Intră în cont"}
        </button>
      </form>
      {error && (
        <p role="alert" data-testid="error" style={{ color: "crimson" }}>
          {error}
        </p>
      )}
      <p>
        Nu ai cont? <Link href="/signup">Creează unul</Link>
      </p>
    </main>
  );
}
