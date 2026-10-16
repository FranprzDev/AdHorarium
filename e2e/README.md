# End-to-end suite

Browser tests for AdHorarium written with [TesterArmy e2e](https://e2e.tester.army/docs) (`e2e` 0.21.1) and its web engine
(`@e2e-dev/web` 0.15.1, Playwright under the hood). Every step is a deterministic locator or assertion: there are no
agent steps, so no model or API key is needed to run the suite.

## Layout

| Path | Purpose |
| --- | --- |
| `e2e.config.ts` | Target (`web`), locale `es-AR`, time zone `America/Argentina/Buenos_Aires`, one worker, traces on, reporters `list`, `junit`, `markdown`. |
| `e2e/support/env.ts` | Run id, base URL, personas and the accounts derived from them. |
| `e2e/support/ui.ts` | Routes, shared locators (Radix selects, Sonner toasts) and sign in / registration helpers. |
| `e2e/support/db.ts` | Minimal Neon HTTP SQL client: promotes the admin persona and deletes test data. |
| `e2e/support/state.ts` | Hands values between tests of one run (the share link). |
| `e2e/tests/00-sessions.setup.e2e.ts` | One setup per persona; saves its signed-in session. |
| `e2e/tests/01-…08-*.e2e.ts` | Public pages, auth, student tools, schedule builder, import, assistant, admin catalog, password recovery. |
| `e2e/scripts/cleanup.ts` | Removes every account and subject any run created and prints what is left. |

## Test catalogue

| Area | IDs | Session |
| --- | --- | --- |
| Public pages | PUB-01 … PUB-07 | anonymous |
| Authentication | AUTH-01 … AUTH-08 | anonymous → registration persona |
| Student tools | STU-01 … STU-06 | student A |
| Schedule builder | SCH-01 … SCH-10 | student A (SCH-10 anonymous) |
| Import a shared timetable | IMP-01 … IMP-03 | student B |
| Schedule assistant | ASI-01 | student A |
| Admin catalog | ADM-01 … ADM-12 | student A and admin, alternating |
| Password recovery | PWR-01 … PWR-07 | anonymous (PWR-03 … 07 need the mail outbox, so they never run against production) |
| Email verification | EMV-01 … EMV-04 | anonymous → a fresh account (EMV-02 … 04 need the mail outbox) |

## Personas and test data

All data a run creates is derived from `E2E_RUN_ID` (generated from the clock when unset):

- Accounts: `e2e+<run>-<persona>@adhorarium.app` with a run-scoped password. Personas: `studenta`, `studentb`,
  `registration`, `admin`.
- Catalog rows: subjects named `E2E …` with numbers 900–998 (real plans stop below 50) and their commissions.
- The admin persona is promoted with SQL, so admin tests need `E2E_DATABASE_URL`, or the credentials of an existing
  admin in `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`. Without either they are skipped.

Reusing the same run id across several `e2e run` invocations signs in to the existing accounts instead of
registering again (registration is limited to 5 per hour per client and sign in to 8 per email per 15 minutes).

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `E2E_BASE_URL` | `https://adhorarium.vercel.app` | App under test. |
| `E2E_RUN_ID` | clock based | Scope of the accounts and rows the run creates. |
| `E2E_DATABASE_URL` | unset | Neon connection string; enables admin promotion and cleanup. |
| `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` | unset | Use an existing admin instead of promoting one. |
| `E2E_ASSISTANT` | unset | `1` runs the assistant test outside production (it calls a paid model). |
| `E2E_MAIL_OUTBOX` | unset | `1` when the app under test runs with `MAIL_OUTBOX=1` (never production); with `E2E_DATABASE_URL` it enables the flows that read emailed links (password recovery). |
| `E2E_STATE_DIR` | `.e2e/state` | Where tests hand values to later tests. |
| `E2E_OUTPUT_DIR` | `.e2e` | Reports, traces and screenshots. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | unset | Sent as `x-vercel-protection-bypass` for protected preview deployments. |

## Running locally

```bash
pnpm install
pnpm exec e2e-web install chromium          # once
E2E_RUN_ID=local1 pnpm test:e2e              # whole suite against production
E2E_RUN_ID=local1 pnpm test:e2e e2e/tests/03-student.e2e.ts   # one file, same accounts
E2E_BASE_URL=http://localhost:3000 pnpm test:e2e              # a local server
pnpm test:e2e:cleanup                        # needs E2E_DATABASE_URL
```

The suite writes to the target's database. Against production always finish with `pnpm test:e2e:cleanup`; it exits
non-zero if any `e2e+` account or `E2E` subject is left.

## CI

`.github/workflows/e2e.yml` runs only on `workflow_dispatch` (input `base_url`), never on push, because the suite writes
test data and the assistant test spends model credits. It installs Chromium, runs the suite, always runs the cleanup
when the `E2E_DATABASE_URL` secret is set, and uploads `.e2e/` (JUnit, Markdown report, traces) as the `e2e-report`
artifact. The regular `CI` workflow typechecks and lints these files but does not run them.
