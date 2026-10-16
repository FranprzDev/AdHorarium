import { describe, test } from "@e2e-dev/web"
import type { Screen } from "e2e"
import { expect } from "e2e"
import { E2E_COMMISSION_PATTERN, sql } from "../support/db"
import { adminAvailable, databaseUrl, Persona, runId } from "../support/env"
import { AppRoute, chooseOption, expectToast } from "../support/ui"

/*
 * Bulk import of commissions from the admin panel. The file targets a real subject (ISI plan 2023, number 36, Proyecto
 * Final) with a commission named "E2E-<run id>", which the last test and `pnpm test:e2e:cleanup` delete.
 */

const SUBJECT_NUMBER = 36
const SUBJECT = "Proyecto Final"
const COMMISSION = `E2E-${runId}`
const SOURCE = "E2E Departamento de prueba"
const TERM = "E2E 2026"
const HEADER = "career,plan,subjectNumber,subjectName,commission,shift,period,day,start,end,classroom,term,source,sourceUrl"
const SKIP_REASON = !adminAvailable && "admin flows need E2E_DATABASE_URL (to promote the admin) or E2E_ADMIN_EMAIL/PASSWORD"

function csv(days: ReadonlyArray<string>): string {
  const rows = days.map((day) => `ISI,2023,${SUBJECT_NUMBER},${SUBJECT},${COMMISSION},noche,anual,${day},19:00,21:15,Aula E2E,${TERM},${SOURCE},`)
  return [HEADER, ...rows].join("\n")
}

async function openImport(app: { open(path?: string): Promise<void> }, screen: Screen) {
  await app.open(AppRoute.Admin)
  await expect(screen.getByRole("heading", "Administración")).toBeVisible({ timeout: 20_000 })
  await screen.getByRole("button", "Importar comisiones").tap()
  return screen.getByRole("dialog", "Importar comisiones")
}

describe("commission import", { tags: ["admin", "commission-import"], serial: true, session: Persona.Admin, skip: SKIP_REASON }, () => {
  test("CIM-01 a file with an invalid row is reported and cannot be imported", async ({ app, screen }) => {
    if (databaseUrl) await sql("delete from commissions where name = $1", [COMMISSION])
    const dialog = await openImport(app, screen)
    await dialog.getByLabel("Contenido CSV o JSON").fill(csv(["lunes", "domingo"]))
    await dialog.getByRole("button", "Previsualizar").tap()
    await expect(dialog.getByText("Línea 3: El día debe ser de lunes a sábado")).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole("button", /^Importar/)).toBeDisabled()
    await app.screenshot("importar-comisiones-error")
  })

  test("CIM-02 a valid file is previewed, imported, and a second preview shows no changes", async ({ app, screen, browser }) => {
    const dialog = screen.getByRole("dialog", "Importar comisiones")
    await dialog.getByLabel("Contenido CSV o JSON").fill(csv(["lunes", "miercoles"]))
    await dialog.getByRole("button", "Previsualizar").tap()
    await expect(dialog.getByText("1 nueva", { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByText("Lun 19:00–21:15 (Aula E2E) · Mié 19:00–21:15 (Aula E2E)")).toBeVisible()
    await app.screenshot("importar-comisiones-vista-previa")
    await dialog.getByRole("button", "Importar 1 comisión").tap()
    await expectToast(browser, "1 comisión importada")
    await expect(dialog.getByText("1 sin cambios", { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole("button", /^Importar/)).toBeDisabled()
  })
})

describe("student sees the imported commission", { tags: ["admin", "commission-import"], serial: true, session: Persona.StudentA, skip: SKIP_REASON }, () => {
  test("CIM-03 the commission shows its slots and source in the schedule builder", async ({ app, screen }) => {
    await app.open(AppRoute.Schedule)
    await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible({ timeout: 20_000 })
    const panel = screen.getByRole("region", "Agregar o cambiar materia")
    await chooseOption(panel, "Materia", new RegExp(`^${SUBJECT} ·`), screen)
    const item = panel.getByRole("listitem").filter({ hasText: COMMISSION })
    await expect(item.getByText("Lun 19:00–21:15 (Aula E2E) · Mié 19:00–21:15 (Aula E2E)")).toBeVisible()
    await expect(item.getByText(`Fuente: ${SOURCE} · ${TERM} · actualizado`, { exact: false })).toBeVisible()
    await app.screenshot("comision-importada-fuente")
  })
})

describe("imported commission cleanup", { tags: ["admin", "commission-import"], session: Persona.Admin, skip: SKIP_REASON || (!databaseUrl && "cleanup needs E2E_DATABASE_URL") }, () => {
  test("CIM-04 the e2e commissions are removed", async () => {
    await sql("delete from commissions where name like $1", [E2E_COMMISSION_PATTERN])
    const { rows } = await sql<{ total: number }>("select count(*)::int as total from commissions where name like $1", [E2E_COMMISSION_PATTERN])
    expect(rows[0].total).toBe(0)
  })
})
