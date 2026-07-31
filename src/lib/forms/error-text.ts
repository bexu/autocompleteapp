// Traducerea răspunsurilor de eroare ale API-ului în mesaje pentru om.
// Rutele întorc `details: [{field, message}]`; mesajele venite din motor conțin
// deja eticheta câmpului („Data decesului — dată invalidă"), cele din Zod sunt
// scurte („dată invalidă") — de aceea afișăm și numele câmpului, discret.

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error?: string;
  fields?: string[];
  details?: ApiErrorDetail[];
  requestId?: string;
}

/** Lista de probleme, gata de afișat sub formular. */
export function apiErrorItems(body: ApiErrorBody): string[] {
  if (body.details?.length) {
    return body.details.map((d) => (d.message ? `${d.message} (${d.field})` : d.field));
  }
  if (body.fields?.length) return body.fields;
  return [];
}

/** Un singur rând de rezumat pentru banda de eroare. */
export function apiErrorTitle(body: ApiErrorBody): string {
  switch (body.error) {
    case "validare":
      return "Verifică datele introduse:";
    case "prea multe cereri":
      return "Prea multe cereri — încearcă din nou peste un minut.";
    case "neautentificat":
      return "Sesiunea a expirat — autentifică-te din nou.";
    case "formular indisponibil":
      return "Formularul nu e disponibil pentru datele alese.";
    case "eroare internă":
      return `Eroare internă. Reîncearcă; dacă persistă, raportează codul ${body.requestId ?? ""}.`.trim();
    default:
      return body.error ? `Generare eșuată: ${body.error}` : "Generare eșuată.";
  }
}
