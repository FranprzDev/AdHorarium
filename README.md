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
- **Schedule assistant** (floating "Asistente" button on every dashboard page): a read-only chat that answers questions about the student's own plan (which subjects they can take now, which finals they can sit, what is missing for the next level) and guides them to build their schedule. It runs through Vercel AI Gateway with the student's career, subject states and correlatives in the system prompt; it has no tools, never writes data and says explicitly that class timetables are not loaded.
- **Admin panel** (`/admin`): admins create, edit and delete subjects and manage correlatives, with validation that rejects self-references, other-career subjects, higher-level requirements, duplicates, cycles and level changes that would break existing correlatives.
- **Demo board** (`/demo`): interactive curriculum board with the 2008 Sistemas plan, no sign-in.
- **Privacy policy** (`/privacidad`).

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Data access | Server Actions (`app/actions/*`) calling typed Drizzle queries (`db/queries/*`); inputs validated with zod (`lib/validation/*`) |
| Database | Postgres on Neon, Drizzle ORM (`db/schema.ts`), SQL migrations in `drizzle/` |
| Auth | Auth.js v5 (`next-auth`) with email + password (Credentials provider, bcrypt hashes) and Google, Drizzle adapter, JWT sessions. See [Authentication](#authentication) |
| Roles | `users.role` is `student` or `admin`; registration always creates students. Emails listed in `ADMIN_EMAILS` are promoted to admin on sign-in, whatever the provider. `middleware.ts` guards `/dashboard` (signed in) and `/admin` (admin); server actions and the admin layout re-check the role stored in the database (`requireUserId` / `requireAdminUserId`) |
| UI | Tailwind CSS, shadcn/ui (Radix), Framer Motion, react-hook-form |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/react`) through Vercel AI Gateway; `POST /api/assistant` (`lib/assistant/*`) checks the session, validates input size, rate limits per user and streams the answer |
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

## Authentication

Two sign-in methods share the same `users` table, roles and JWT session:

- **Email + password** (`/ingresar`, `/registro`). Students register with name, email and a password (at least 10 characters, letters and numbers, at most 72 bytes because bcrypt ignores the rest). Passwords are stored only as bcrypt hashes (`bcryptjs`, cost 12) in `users.password_hash`; they are never logged. Sign-in failures always return the same generic message, and unknown emails still run a bcrypt comparison so response time does not reveal whether an account exists.
- **Google** (`Continuar con Google` on `/ingresar`). Kept because it adds no runtime cost and the OAuth client is already configured; a Google-only account has no password hash and cannot sign in with a password.

Rate limits (in memory per server instance, so a best-effort guard on serverless): 8 sign-in attempts per email and 30 per client address every 15 minutes, and 5 registrations per client address per hour (20 per day). Inputs are validated with zod (`lib/validation/auth.ts`) on the client and again on the server. The `callbackUrl` of the sign-in page only accepts same-site paths.

Admins: registration never creates admins. Promote an account by adding its email to `ADMIN_EMAILS` (applied on its next sign-in) or by setting `users.role = 'admin'` in the database.

## Setup

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
cp docs/.env.example .env.local   # then fill in the values below
pnpm db:migrate                    # apply migrations to DATABASE_URL
pnpm db:seed                       # load careers, subjects, correlatives and exam tables
pnpm dev                           # http://localhost:3000
```

Email + password sign-in works without extra configuration. For Google sign-in, create an OAuth client in Google Cloud and add `http://localhost:3000/api/auth/callback/google` (and your production URL's equivalent) as an authorized redirect URI.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Secret used by Auth.js to sign tokens (`npx auth secret`) |
| `AUTH_TRUST_HOST` | `true` when running behind a proxy such as Vercel |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated emails promoted to `admin` on sign-in |
| `SCHEDULE_ASSISTANT_MODEL` | AI Gateway model id used by the schedule assistant (for example `openai/gpt-4.1-mini`). Required by `/api/assistant`; there is no default |
| `AI_GATEWAY_API_KEY` | Only for local development of the assistant. Vercel deployments authenticate to AI Gateway with the project's OIDC token (`VERCEL_OIDC_TOKEN`) automatically |

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
