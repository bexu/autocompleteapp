import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function Home() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Brand href="/" />
          <span className="row">
            <Link href="/login" className="btn btn--ghost btn--sm">
              Autentificare
            </Link>
            <Link href="/signup" className="btn btn--primary btn--sm">
              Cont nou
            </Link>
          </span>
        </div>
      </header>

      <main className="container">
        <section style={{ maxWidth: "40ch", padding: "2rem 0 1rem" }}>
          <p className="eyebrow">Actele tale, fără drumuri inutile</p>
          <h1
            style={{
              fontSize: "var(--fs-2xl)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              marginTop: "0.5rem",
            }}
          >
            Completează o dată. Generăm formularele oficiale, pre-completate.
          </h1>
          <p className="lead" style={{ fontSize: "var(--fs-md)", marginTop: "0.9rem" }}>
            Îți ții datele și documentele într-un singur loc, iar aplicația
            produce cererile oficiale gata de semnat și depus.
          </p>
          <div className="row" style={{ marginTop: "1.5rem" }}>
            <Link href="/signup" className="btn btn--primary">
              Începe gratuit
            </Link>
            <Link href="/login" className="btn btn--ghost">
              Am deja cont
            </Link>
          </div>
        </section>

        <p className="section-label">Cum funcționează</p>
        <ol className="steps" style={{ maxWidth: "52ch" }}>
          <li>
            <strong>Îți completezi profilul o dată</strong> — sau îl extragem din
            buletin (zona MRZ) și din certificatul mașinii.
          </li>
          <li>
            <strong>Alegi ce ai de făcut</strong> — redirecționare 3,5%, ai vândut
            sau ai cumpărat o mașină, și altele.
          </li>
          <li>
            <strong>Generăm dosarul complet</strong> — formulare pre-completate,
            checklist și pașii de depunere prin canalul potrivit.
          </li>
        </ol>

        <div className="notice" style={{ marginTop: "1.6rem", maxWidth: "52ch" }}>
          <span aria-hidden="true">🔒</span>
          <span>
            Datele sensibile (CNP, buletin) sunt criptate. Tu verifici, semnezi și
            depui pe propria răspundere — noi ducem dosarul până la butonul de
            trimitere.
          </span>
        </div>
      </main>
    </>
  );
}
