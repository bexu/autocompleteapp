# ADR 0004 — Management secrete & config validat

- Status: acceptat
- Data: 2026-07-27

## Context
Regula proiectului: nimic hardcodat, secrete doar din mediu. Avem nevoie de un singur loc care validează configul la pornire și de o plasă de siguranță împotriva secretelor ajunse în git.

## Decizie
1. **Config validat central** în `src/lib/config/env.ts` cu Zod: parsare memoizată, fail-fast, mesaje de eroare care **nu scurg valorile** (doar numele câmpurilor). Reguli mai stricte în `production` (secretele devin obligatorii).
2. **Cheia de criptare are accessor dedicat** (`getEncryptionMasterKey`) — criptarea per-câmp nu depinde de validarea altor variabile (ex. DATABASE_URL).
3. **Scanner de secrete în CI**: job `secrets` cu gitleaks (binar pinuit pe versiune, fără dependență de licență de acțiune), `--exit-code 1` pe orice găsire. `.env` rămâne gitignored.
4. **Bump actions** la `checkout@v5` / `setup-node@v5` (Node 20 e deprecat pe runners).

## Consecințe
- Orice variabilă nouă se adaugă în schema Zod + `.env.example` — o singură sursă.
- CI pică dacă un secret e comis din greșeală.
- Config-ul e server-only; nu se importă în cod client.
