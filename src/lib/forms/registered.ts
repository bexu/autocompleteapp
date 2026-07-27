import { registerF230 } from "./f230";
import { registerAuto } from "./auto";
import { registerC168 } from "./c168";

// Punct unic de acces la manifeste care GARANTEAZĂ înregistrarea. Importă de
// aici (nu direct din manifest.ts) oriunde selectezi/citești manifeste —
// altfel, în build de producție, bundle-uri separate pot avea un registry gol.
registerF230();
registerAuto();
registerC168();

export {
  selectManifest,
  getManifestById,
  allManifests,
  type FormManifest,
} from "./manifest";
