# ADR 0005 — Criptare per-câmp prin envelope encryption

- Status: acceptat
- Data: 2026-07-27

## Context
CNP, serie/nr CI și alte date de risc înalt (Legea 190/2018 art. 4) nu pot sta în clar în DB. Ne trebuie criptare per-câmp reutilizabilă, cu drum clar de rotație a cheilor și migrare viitoare spre un KMS gestionat, fără să legăm v1 de un furnizor cloud anume.

## Decizie
**Envelope encryption** în `src/lib/crypto/field-encryption.ts`:
- **KEK** (Key Encryption Key) = `ENCRYPTION_MASTER_KEY`, 32 bytes base64, din env/vault, separat de DB.
- Per valoare: **DEK** aleator (32 bytes) → criptează plaintext-ul cu **AES-256-GCM** (IV aleator, auth tag).
- DEK-ul e **împachetat** cu KEK (AES-256-GCM). Se stochează: versiune + IV-uri + tag-uri + DEK împachetat + ciphertext, ca string compact `v1:...`.
- Non-determinist: fiecare apel produce alt ciphertext (fără leak prin egalitate). Consecință: **nu se poate căuta după egalitate pe câmp criptat** — dacă apare nevoia (ex. lookup după CNP), se adaugă un index blind separat (HMAC determinist cu cheie dedicată), decis atunci.

### De ce KMS local (cheie în env/vault) în v1, nu cloud KMS
- Zero dependență de furnizor + rezidență RO/UE garantată.
- Interfața wrap/unwrap izolează KEK-ul: migrarea la un KMS (UE) înseamnă înlocuirea a două funcții, nu re-criptarea datelor.
- Rotația KEK = re-împachetarea DEK-urilor (batch), fără atingerea ciphertext-ului de date.

## Consecințe
- `ENCRYPTION_MASTER_KEY` devine secret critic (T9 în threat model): backup securizat, acces restrâns, plan de rotație.
- Integrarea cu Prisma (criptare/decriptare transparentă pe câmpurile marcate) se face la task 1.2, cu test de integrare pe Postgres care dovedește că valoarea stocată nu e în clar.
- Pierderea KEK = pierderea datelor criptate — procedură de backup a cheii documentată la deploy (M4).
