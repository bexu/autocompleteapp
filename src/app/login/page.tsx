"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth/client";
import { Brand } from "@/components/Brand";

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
    <main className="container container--auth">
      <div style={{ marginBottom: "1.5rem" }}>
        <Brand href="/" />
      </div>
      <div className="card card--pad">
        <div className="page-head" style={{ marginBottom: "1.1rem" }}>
          <p className="eyebrow">Bine ai revenit</p>
          <h1 className="page-title" style={{ fontSize: "var(--fs-lg)" }}>
            Autentificare
          </h1>
        </div>
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label" htmlFor="li-email">
              Email
            </label>
            <input id="li-email" className="input" name="email" type="email" placeholder="ion@exemplu.ro" required data-testid="email" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="li-pass">
              Parolă
            </label>
            <input id="li-pass" className="input" name="password" type="password" placeholder="parola ta" required data-testid="password" />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading} data-testid="submit">
            {loading ? "Se conectează..." : "Intră în cont"}
          </button>
        </form>
        {error && (
          <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>
      <p className="muted" style={{ marginTop: "1rem", textAlign: "center", fontSize: "var(--fs-sm)" }}>
        Nu ai cont? <Link href="/signup">Creează unul</Link>
      </p>
    </main>
  );
}
