import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Autopilot acte cetățean</h1>
      <p>
        Completează-ți profilul o dată, generează formularele oficiale
        pre-completate, gata de depus.
      </p>
      <p style={{ display: "flex", gap: 12 }}>
        <Link href="/signup">Cont nou</Link>
        <Link href="/login">Autentificare</Link>
      </p>
    </main>
  );
}
