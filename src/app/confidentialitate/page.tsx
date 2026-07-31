import Link from "next/link";
import { CURRENT_POLICY_VERSION } from "@/lib/gdpr/consent";

// Informarea persoanei vizate (GDPR art. 13-14). Publică (fără autentificare) —
// userul trebuie să o poată citi înainte de a-și crea cont. Versiunea e aceeași
// cu cea înregistrată în consent ledger.
export const metadata = {
  title: "Politica de confidențialitate",
};

export default function PoliticaPage() {
  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Informare GDPR</p>
        <h1 className="page-title">Politica de confidențialitate</h1>
        <p className="lead">
          Versiunea <span className="mono" data-testid="policy-version">{CURRENT_POLICY_VERSION}</span>
        </p>
      </div>

      <div className="stack">
        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Cine prelucrează datele</p>
          <p>
            Operatorul este entitatea care oferă acest serviciu. Datele de contact ale
            operatorului și ale persoanei desemnate cu protecția datelor se afișează în
            secțiunea de contact a aplicației.
          </p>
        </section>

        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Ce date prelucrăm și de ce</p>
          <ul className="stack--sm" style={{ paddingLeft: "1.1rem" }}>
            <li><strong>Identitate</strong> (nume, prenume, CNP, serie/nr. CI, data nașterii) — pentru a completa formularele oficiale pe care le ceri. Temei: executarea contractului; pentru CNP se aplică măsurile speciale din Legea 190/2018 art. 4.</li>
            <li><strong>Adresă de domiciliu</strong> — apare ca adresa solicitantului pe formulare.</li>
            <li><strong>Contact</strong> (telefon, e-mail) — pentru comunicări legate de serviciu.</li>
            <li><strong>IBAN</strong> — doar acolo unde formularul cere un cont pentru plată.</li>
            <li><strong>Scanuri</strong> (CI, certificat de înmatriculare, contracte) — pentru extragerea automată a datelor. Temei: <strong>consimțământ</strong>, retragibil oricând.</li>
            <li><strong>Bunuri</strong> (vehicule, imobile) și <strong>dosare</strong> — pentru a genera și urmări documentele.</li>
          </ul>
          <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
            Datele despre alte persoane pe care le introduci în formulare (copil, persoană
            decedată, cumpărător, chiriaș) sunt folosite doar pentru a completa documentul
            respectiv și nu se stochează ca înregistrări separate.
          </p>
        </section>

        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Cui transmitem datele</p>
          <p>
            <strong>Nu transmitem datele tale niciunei autorități.</strong> Aplicația
            generează documentul; depunerea o faci tu, cu propriile credențiale. Folosim
            furnizori care ne ajută să operăm serviciul (găzduire în UE, serviciu de
            gestiune a cheilor de criptare și, dacă alegi semnătura calificată, un
            prestator de servicii de încredere).
          </p>
        </section>

        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Cât timp păstrăm datele</p>
          <ul className="stack--sm" style={{ paddingLeft: "1.1rem" }}>
            <li><strong>Scanurile</strong> se șterg automat după 30 de zile.</li>
            <li><strong>Profilul, dosarele și documentele generate</strong> se păstrează până le ștergi tu sau până îți ștergi contul.</li>
            <li><strong>Registrul de audit</strong> (fără date personale) rămâne ca dovadă că o ștergere a avut loc.</li>
          </ul>
        </section>

        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Drepturile tale</p>
          <p>
            Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție și
            portabilitate, precum și dreptul de a-ți retrage consimțământul oricând
            (retragerea nu afectează prelucrarea de dinainte). Le poți exercita direct din{" "}
            <Link href="/dashboard/confidentialitate" className="btn-link">Confidențialitate</Link>:
            export complet al datelor, ștergerea datelor sau a contului, acordarea/retragerea
            consimțământului. Ai și dreptul de a depune o plângere la ANSPDCP.
          </p>
        </section>

        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Securitate</p>
          <p>
            Identificatorii tari (CNP, serie/nr. CI, IBAN), scanurile și documentele
            generate se stochează <strong>criptate</strong>. Datele personale nu apar în
            jurnalele aplicației. Datele sunt găzduite în România/UE.
          </p>
        </section>

        <section className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Decizii automate</p>
          <p>
            Nu luăm decizii automate cu efecte juridice asupra ta și nu facem profilare.
            Aplicația transformă mecanic datele pe care le introduci în formulare; tu
            verifici, semnezi și depui pe propria răspundere.
          </p>
        </section>
      </div>

      <p style={{ marginTop: "1.4rem" }}>
        <Link href="/" className="btn-link">← Înapoi</Link>
      </p>
    </main>
  );
}
