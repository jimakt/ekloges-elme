# Εκλογές ΕΛΜΕ

Web εφαρμογή για συλλογή, επεξεργασία και παρουσίαση εκλογικών αποτελεσμάτων ΕΛΜΕ.

Το repo πλέον περιέχει μόνο το νέο stack:

- `web/` με `Next.js 16 + React 19 + TypeScript`
- `PostgreSQL` μέσω `compose.yml`
- `Drizzle ORM` για schema και migrations

## Εκκίνηση

1. Σήκωσε τη βάση:

```powershell
docker compose up -d
```

2. Φτιάξε local env αρχείο:

```powershell
Copy-Item web\.env.example web\.env.local
```

Το local Postgres του project ακούει στο `127.0.0.1:5433`, ώστε να μη συγκρούεται με τυχόν ήδη εγκατεστημένο PostgreSQL στο μηχάνημα.

3. Σπρώξε το αρχικό schema:

```powershell
cd web
npm run db:push
```

4. Πέρασε τα βασικά metadata:

```powershell
npm run db:seed
```

5. Ξεκίνα το app:

```powershell
npm run dev
```

Η εφαρμογή ανοίγει στο `http://localhost:3000`.

## Χρήσιμα scripts

```powershell
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:seed
npm run db:studio
```

## Δομή

- `compose.yml`: local PostgreSQL
- `web/src/app`: App Router pages και layout
- `web/src/db/schema.ts`: αρχικό relational schema
- `web/src/db/index.ts`: Drizzle database client
- `web/scripts/seed-metadata.mjs`: seed για regions, ELME και βασικές παρατάξεις
- `web/drizzle.config.ts`: Drizzle configuration

## Επόμενα βήματα

1. Admin CRUD για ΕΛΜΕ και εκλογές.
2. Καταχώριση αποτελεσμάτων ανά παράταξη.
3. Δημόσια σελίδα αποτελεσμάτων με φίλτρα και συγκρίσεις.
4. Authentication και ρόλοι χρηστών.
