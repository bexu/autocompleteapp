"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Eroare</p>
        <h1 className="page-title">Ceva n-a mers</h1>
        <p className="lead">
          Reîncearcă. Dacă se repetă, datele tale sunt în siguranță — nimic nu s-a
          pierdut.
        </p>
      </div>
      <button type="button" className="btn btn--primary" onClick={reset} data-testid="reincearca">
        Reîncearcă
      </button>
    </main>
  );
}
