# AdHorarium

Academic planner for UTN engineering careers, built as coursework for **Seminario Integrador**. Next.js + Zustand + Google auth. In Spanish.

## Problem

UTN students juggle correlatives, class schedules and final-exam tables across scattered PDFs and word of mouth. Picking which subjects to take each semester is guesswork.

## What it does

- Interactive correlatives plan per career (data for Sistemas 2008/2023 plans plus Civil, Eléctrica, Electrónica, Mecánica in `docs/2023`)
- Dashboard with subjects, schedules (`horarios`), exam tables (`mesas`) and profile tracking
- Argentine grades (1–10) → US GPA conversion, documented in `docs/INFORME_CONVERSION_GPA_ARGENTINA.md`
- Google sign-in, demo mode at `/demo`

## Quickstart

```bash
pnpm install
pnpm dev
```

## Structure

| Path | What |
| --- | --- |
| `app/` | Landing, careers, dashboard (materias, horarios, mesas, profile) |
| `data/` · `docs/2023/` | Career plans and subject datasets |
| `stores/` | Auth, career and user-subjects state (Zustand) |
| `docs/` | Academic docs, including the GPA conversion report |

> [!NOTE]
> Academic project — career data mirrors UTN plans and may drift from the official ones.
