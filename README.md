# AdHorarium

Academic planner for engineering students at UTN Facultad Regional Tucumán (UTN FRT). The UI is in Spanish. Started as coursework for **Seminario Integrador**.

Production: <https://adhorarium.vercel.app>

## Purpose

UTN students juggle correlatives, final-exam tables and their own progress across scattered PDFs and word of mouth. AdHorarium puts the official study plans in one place and lets each student track where they stand.

## Features

- **Public correlatives plan** (`/careers`): the 2023 plans for Sistemas, Civil, Eléctrica, Electrónica and Mecánica, with "para cursar" (regular / approved) and "para rendir" correlatives. No sign-in required.
- **Subject states and grades** (`/dashboard/materias`): mark each subject as no cursada, cursando, regular or promocionada and store the 1–10 grade of promoted subjects.
- **Correlatives graph** (`/dashboard`): pick a subject to see what it requires and what it enables, grouped by level.
- **Exam table finder** (`/dashboard/mesas`): which exam table (Mesa I, II or III) each subject of the career belongs to.
- **Average and GPA conversion** (`/dashboard/profile`): average of promoted subjects and an approximate US GPA (0–4) equivalence, documented in `docs/INFORME_CONVERSION_GPA_ARGENTINA.md`.
- **Schedules** (`/dashboard/horarios`): early work in progress (subject selection per level only; the sidebar link is disabled).
- **Admin panel** (`/admin`): admins create, edit and delete subjects and manage correlatives, with validation that rejects self-references, other-career subjects, higher-level requirements, duplicates, cycles and level changes that would break existing correlatives.
- **Demo board** (`/demo`): interactive curriculum board with the 2008 Sistemas plan, no sign-in.
- **Privacy policy** (`/privacidad`).

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Data access | Server Actions (`app/actions/*`) calling typed Drizzle queries (`db/queries/*`); inputs validated with zod (`lib/validation/*`) |
| Database | Postgres on Neon, Drizzle ORM (`db/schema.ts`), SQL migrations in `drizzle/` |
| Auth | Auth.js v5 (`next-auth`) with Google, Drizzle adapter, JWT sessions |
| Roles | `users.role` is `student` or `admin`. Emails listed in `ADMIN_EMAILS` are promoted to admin on sign-in. `middleware.ts` guards `/dashboard` (signed in) and `/admin` (admin); server actions and the admin layout re-check the role stored in the database (`requireUserId` / `requireAdminUserId`) |
| UI | Tailwind CSS, shadcn/ui (Radix), Framer Motion, react-hook-form |
| Tests | Vitest; database tests run the real migrations and seed against in-memory PGlite |

Main tables: `careers`, `exam_tables`, `subjects` (career, number, name, level 1–6, hours, elective, basic science, exam table), `subject_correlatives` (subject, required subject, purpose `cursar|rendir`, requirement `regulares|aprobadas`), `users`, Auth.js tables (`accounts`, `sessions`, `verification_tokens`) and `user_subject_states`.

```
app/            routes (landing, careers, dashboard, admin, privacidad, api/auth) and server actions
db/             Drizzle schema, client, queries and seed
drizzle/        generated SQL migrations
lib/            domain logic (correlatives, plan integrity, GPA, auth helpers, validation)
docs/2023/      official 2023 plan data used by the seed
tests/          Vitest suites
```

## Setup

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
cp docs/.env.example .env.local   # then fill in the values below
pnpm db:migrate                    # apply migrations to DATABASE_URL
pnpm db:seed                       # load careers, subjects, correlatives and exam tables
pnpm dev                           # http://localhost:3000
```

For Google sign-in, create an OAuth client in Google Cloud and add `http://localhost:3000/api/auth/callback/google` (and your production URL's equivalent) as an authorized redirect URI.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Secret used by Auth.js to sign tokens (`npx auth secret`) |
| `AUTH_TRUST_HOST` | `true` when running behind a proxy such as Vercel |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated emails promoted to `admin` on sign-in |

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint with zero warnings allowed |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unit + PGlite database tests) |
| `pnpm db:generate` | Generate a new SQL migration from `db/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations to `DATABASE_URL` (reads `.env.local` if present) |
| `pnpm db:seed` | Seed the official plans into `DATABASE_URL` (idempotent) |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main`: install with a frozen lockfile, lint, typecheck, test and build, using placeholder environment values (CI never touches the real database or OAuth app).

## Deployment

The app is deployed on Vercel. Every pull request gets a preview deployment and `main` is deployed to production at <https://adhorarium.vercel.app>. Set the environment variables above in the Vercel project (the Neon integration provides `DATABASE_URL`). Run `pnpm db:migrate` against the production database when a pull request adds a migration.

## Contributing

Work happens on branches (`feat/*`, `fix/*`, `chore/*`) through pull requests to `main`; `main` is never pushed directly. Commits follow `type: brief description`.

## License

No license file is included yet, so all rights are reserved by the author.

> [!NOTE]
> Career data mirrors the official UTN plans and may drift from them. Report mistakes through GitHub issues.
