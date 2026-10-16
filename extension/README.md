# AdHorarium: importar desde SysAcad (browser extension)

Adds a **"Llevar a AdHorarium"** button to the *Estado académico* page of SysAcad (UTN Facultad Regional Tucumán).
One click opens [AdHorarium](https://adhorarium.vercel.app/importar/sysacad) with every subject, its state, grade
and plan, so the student reviews the changes and confirms them there.

Manifest V3, one build for Chrome/Edge and one for Firefox (115+).

## Install (load unpacked)

Download the zip for your browser from AdHorarium
([Chrome / Edge](https://adhorarium.vercel.app/extension/adhorarium-sysacad-chrome.zip),
[Firefox](https://adhorarium.vercel.app/extension/adhorarium-sysacad-firefox.zip), also linked from
`/importar/sysacad`) and unzip it. Release notes and SHA-256 checksums:
[`extension-v0.1.0`](https://github.com/FranprzDev/AdHorarium/releases/tag/extension-v0.1.0).

- **Chrome / Edge**: open `chrome://extensions` (or `edge://extensions`), turn on *Developer mode*, click
  *Load unpacked* and pick the unzipped folder (the one with `manifest.json`).
- **Firefox**: open `about:debugging#/runtime/this-firefox`, click *Load Temporary Add-on…* and pick
  `manifest.json` inside the unzipped folder. Temporary add-ons are removed when Firefox restarts. If the button does
  not show up, open the add-on's *Permissions* tab and allow access to `sysacad.frt.utn.edu.ar`.

## Use

1. Sign in to SysAcad as usual and open **Estado académico**.
2. Click **Llevar a AdHorarium**. A new tab opens on `/importar/sysacad` (sign in to AdHorarium if asked; the data
   is kept in that tab while you do).
3. Review the preview (subjects of another plan, such as the plan 2008 entrance course, are listed for you to map or
   skip), pick *Combinar* or *Reemplazar* and confirm.

Without the extension, the same page accepts the table copied from SysAcad (Ctrl+A, Ctrl+C) in a text box.

## Privacy

- The content script only runs on `sysacad.frt.utn.edu.ar/estadoAcademico.asp`. The extension asks for no other
  permission: no storage, no tabs, no network access, no host permissions beyond that page.
- It never sees or asks for your SysAcad user or password; it reads the table already rendered in the page.
- Nothing is stored and nothing is sent while you browse. Only when **you click** the button, a new tab opens
  `https://adhorarium.vercel.app/importar/sysacad#dataz=…`: the data (year, subject name, state, grade, plan, the
  regular year and term, the commission you take) travels in the URL fragment (after `#`), which browsers never
  send to any server. Tomo, folio, hours, legajo and your name are not included.
- AdHorarium reads the fragment in your browser and saves only the states you confirm, in your account.

## Develop

```bash
pnpm extension:build              # bundles src/content.ts with esbuild into extension/dist/{chrome,firefox} and zips both
pnpm extension:build -- --public  # same, and copies the zips to public/extension/ (served by the site)
```

- `src/content.ts` reuses the app's parser in `lib/sysacad/` (`dom.ts`, `table.ts`, `status.ts`, `payload.ts`), so
  the extension and the "paste the table" fallback always agree. Parser tests: `tests/sysacad-parser.test.ts`.
- Payload: `{ v: 1, source: "sysacad-frt", capturedAt, plan, rows: [{ year, name, plan, status, grade?, approvedYear?,
  regularYear?, term?, commission?, raw? }] }`, base64url JSON in `#data=`, or deflate-raw + base64url in `#dataz=`
  when it is longer than 2 KB (a full career is about 1.1 KB compressed).
- The app origin is the `APP_ORIGIN` constant in `src/content.ts`.
- Zips are deterministic (fixed timestamps): rebuild with `--public` and commit `public/extension/*.zip` whenever
  `extension/` or `lib/sysacad/` changes, and bump `version` in both manifests.
