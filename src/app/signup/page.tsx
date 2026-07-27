"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/client";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Înregistrare eșuată");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Cont nou</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input name="name" placeholder="Nume" required data-testid="name" />
        <input name="email" type="email" placeholder="Email" required data-testid="email" />
        <input
          name="password"
          type="password"
          placeholder="Parolă (min 8)"
          minLength={8}
          required
          data-testid="password"
        />
        <button type="submit" disabled={loading} data-testid="submit">
          {loading ? "Se creează..." : "Creează cont"}
        </button>
      </form>
      {error && (
        <p role="alert" data-testid="error" style={{ color: "crimson" }}>
          {error}
        </p>
      )}
      <p>
        Ai deja cont? <Link href="/login">Autentifică-te</Link>
      </p>
    </main>
  );
}
