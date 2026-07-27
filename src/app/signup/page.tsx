"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/client";
import { Brand } from "@/components/Brand";

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
    <main className="container container--auth">
      <div style={{ marginBottom: "1.5rem" }}>
        <Brand href="/" />
      </div>
      <div className="card card--pad">
        <div className="page-head" style={{ marginBottom: "1.1rem" }}>
          <p className="eyebrow">Cont nou</p>
          <h1 className="page-title" style={{ fontSize: "var(--fs-lg)" }}>
            Creează-ți contul
          </h1>
        </div>
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label" htmlFor="su-name">
              Nume
            </label>
            <input id="su-name" className="input" name="name" placeholder="Ion Popescu" required data-testid="name" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="su-email">
              Email
            </label>
            <input id="su-email" className="input" name="email" type="email" placeholder="ion@exemplu.ro" required data-testid="email" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="su-pass">
              Parolă
            </label>
            <input
              id="su-pass"
              className="input"
              name="password"
              type="password"
              placeholder="minim 8 caractere"
              minLength={8}
              required
              data-testid="password"
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading} data-testid="submit">
            {loading ? "Se creează..." : "Creează cont"}
          </button>
        </form>
        {error && (
          <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>
      <p className="muted" style={{ marginTop: "1rem", textAlign: "center", fontSize: "var(--fs-sm)" }}>
        Ai deja cont? <Link href="/login">Autentifică-te</Link>
      </p>
    </main>
  );
}
