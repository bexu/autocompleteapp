import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">404</p>
        <h1 className="page-title">Pagina nu există</h1>
        <p className="lead">
          Linkul e greșit sau resursa a fost ștearsă între timp (de exemplu, un dosar
          pe care l-ai șters).
        </p>
      </div>
      <Link href="/dashboard" className="btn btn--primary">Înapoi la panou</Link>
    </main>
  );
}
