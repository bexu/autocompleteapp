import { registerF230 } from "./f230";

// Punct unic de acces la manifeste care GARANTEAZĂ înregistrarea. Importă de
// aici (nu direct din manifest.ts) oriunde selectezi/citești manifeste —
// altfel, în build de producție, bundle-uri separate pot avea un registry gol.
registerF230();

export {
  selectManifest,
  getManifestById,
  allManifests,
  type FormManifest,
} from "./manifest";
