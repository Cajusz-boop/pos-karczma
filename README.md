This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Baza danych (MySQL)

1. Użyj istniejącego MySQL (np. XAMPP – ten sam co w drugim projekcie).
2. Utwórz bazę: `CREATE DATABASE pos_karczma;` (albo uruchom `scripts\create-db-pos-karczma.sql` w phpMyAdmin).
3. W pliku `.env` ustaw `DATABASE_URL` (np. `mysql://root:@127.0.0.1:3306/pos_karczma`).
4. **Prisma (schemat + klient):**
   ```bash
   npx prisma db push
   npx prisma generate
   ```
   **Jeśli terminal nie widzi `npx` / `node`** (np. po świeżej instalacji Node) – w tym samym terminalu uruchom:
   ```powershell
   .\scripts\prisma-setup.ps1
   ```
   Skrypt odświeża PATH i uruchamia `prisma db push` oraz `prisma generate`.
5. Opcjonalnie seed: `npm run seed` lub `.\scripts\migrate-and-seed.ps1`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
