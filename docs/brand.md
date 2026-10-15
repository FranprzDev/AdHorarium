# AdHorarium brand guide

AdHorarium is an academic planner for engineering students at UTN Facultad Regional Tucumán. The identity aims to look
sober and institutional: ink navy as the main color, one brass accent, warm neutral surfaces and a serif for headings.

## Logo

- **Mark** (`components/brand/logo.tsx` → `LogoMark`, static copy in `public/brand/adhorarium-mark.svg`): a capital "A"
  drawn over a 3×3 timetable grid. The crossbar is the brass accent, reading as a time slot on the schedule.
- **Wordmark** (`Logo`): "Ad" in the foreground color and "Horarium" in brass, set in Source Serif 4 semibold.
  `LogoTone.Inverted` is used on the ink navy sidebar; `showTagline` adds the short "UTN · FRT" tagline.
- Keep at least the mark's corner radius as clear space around it and do not recolor the mark.

## Color tokens

Defined as HSL CSS variables in `app/globals.css` and exposed through Tailwind (`tailwind.config.ts`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--primary` | ink navy `217 59% 19%` | `214 64% 74%` | primary buttons, active states, links |
| `--brand` / `--brand-strong` | brass `38 56% 52%` / `36 62% 34%` | `38 62% 60%` / `38 70% 66%` | the single accent: eyebrows, highlights, the logo crossbar |
| `--background` | paper `40 23% 97%` | `220 35% 7%` | page background |
| `--card` | white | `220 30% 10%` | cards, dialogs, tables (`.surface-card`) |
| `--muted-foreground` | `217 12% 38%` | `215 15% 66%` | secondary text |
| `--sidebar*` | `217 59% 15%` | `220 40% 5%` | dashboard sidebar and mobile top bar |

Subject status colors stay semantic and are shared by badges and dots (`lib/subject-status.ts`): promocionada = emerald,
regular = amber, cursando = sky, no cursada = slate.

## Typography

- Body and UI: Inter (`--font-sans`).
- Headings, figures and the wordmark: Source Serif 4 (`--font-serif`), loaded with `next/font/google`.
- Section labels use the `.eyebrow` utility (small caps-style uppercase in brass).

## Building blocks

- `PageHeader` (`components/brand/page-header.tsx`): eyebrow, serif title, description and actions for every page.
- `PublicHeader` (`components/layout/public-header.tsx`): top bar for the public pages.
- `ThemeToggle`: light (default) and dark themes through `next-themes`.
- `BrandLoader`: full screen loading state with the mark.

## Icons and metadata

`app/icon.svg`, `app/favicon.ico` (16/32/48 px), `app/apple-icon.png` (180 px), `public/icons/icon-192.png` and
`icon-512.png` (web manifest, `app/manifest.ts`) and `app/opengraph-image.png` (1200×630) are generated from the mark.
