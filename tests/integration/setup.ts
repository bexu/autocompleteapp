// Setup pentru testele de integrare: încarcă .env local dacă există (în CI
// variabilele vin din mediu). Testele de integrare au nevoie de DATABASE_URL
// (Postgres migrat) și ENCRYPTION_MASTER_KEY.
try {
  process.loadEnvFile();
} catch {
  // fără .env (CI) — variabilele sunt deja în process.env
}
