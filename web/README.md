# Web App

Το νέο βασικό app του project είναι εδώ.

## Stack

- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Drizzle ORM

## Local setup

1. Δημιούργησε env αρχείο:

```powershell
Copy-Item .env.example .env.local
```

Το app συνδέεται στον Postgres του project στο `127.0.0.1:5433`.

2. Σήκωσε Postgres από το root του repo:

```powershell
docker compose up -d
```

3. Κάνε push το schema:

```powershell
npm run db:push
```

4. Πέρασε τα βασικά metadata:

```powershell
npm run db:seed
```

5. Τρέξε το app:

```powershell
npm run dev
```

Το app ανοίγει στο `http://localhost:3000`.
