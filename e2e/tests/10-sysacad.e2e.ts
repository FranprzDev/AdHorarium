import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { buildSysacadPayload, encodeSysacadFragment } from "../../lib/sysacad/payload"
import { SysacadRowStatus, type SysacadRow } from "../../lib/sysacad/types"
import { accountFor, Persona } from "../support/env"
import { AppRoute, expectToast, fillSignIn } from "../support/ui"

const IMPORT_ROUTE = "/importar/sysacad"
const APPROVED = "Sistemas Operativos"
const REGULAR = "Física II"
const TAKING = "Tecnologías para la Automatización"

/** Invented rows shaped like the SysAcad page: one per state, plus a plan 2008 entrance course row and a blank one. */
const ROWS: SysacadRow[] = [
  { year: 0, name: "Física", plan: "2008", status: SysacadRowStatus.Approved, approvedYear: 2021 },
  { year: 2, name: APPROVED, plan: "2023", status: SysacadRowStatus.Approved, grade: 8 },
  { year: 2, name: REGULAR, plan: "2023", status: SysacadRowStatus.Regular, regularYear: 2022 },
  { year: 4, name: TAKING, plan: "2023", status: SysacadRowStatus.Enrolled, commission: "4K02" },
  { year: 3, name: "Inglés II", plan: "2023", status: SysacadRowStatus.None },
]

async function importUrl(): Promise<string> {
  return `${IMPORT_ROUTE}#${await encodeSysacadFragment(buildSysacadPayload(ROWS))}`
}

describe("import from SysAcad", { tags: ["student", "sysacad"], serial: true }, () => {
  test("SYS-01 the payload survives signing in", async ({ app, screen, browser }) => {
    await app.open(await importUrl())
    await browser.waitForURL(/\/ingresar\?callbackUrl=%2Fimportar%2Fsysacad$/, { timeout: 30_000 })
    await fillSignIn(screen, accountFor(Persona.StudentA))
    await browser.waitForURL(/\/importar\/sysacad$/, { timeout: 30_000 })
    await expect(screen.getByRole("heading", "5 materias leídas de SysAcad")).toBeVisible({ timeout: 30_000 })
    expect(await browser.url()).not.toContain("#")
  })
})

describe("import from SysAcad, signed in", { tags: ["student", "sysacad"], serial: true, session: Persona.StudentA }, () => {
  test("SYS-02 the preview lists another plan's row for review and Combinar saves the rest", async ({ app, screen, browser }) => {
    await app.open(await importUrl())
    await expect(screen.getByRole("heading", "5 materias leídas de SysAcad")).toBeVisible({ timeout: 30_000 })
    const review = screen.getByRole("region", "Para revisar (1)")
    await expect(review.getByText("Es de otro plan", { exact: false })).toBeVisible()
    await expect(review.getByRole("combobox", "Materia de AdHorarium para Física")).toHaveText("No importar")
    await expect(screen.getByRole("radio", /^Combinar/)).toBeChecked()
    await app.screenshot("importar-sysacad-vista-previa")
    const submit = screen.getByRole("button", /^Importar \d+ materias?$/)
    // A rerun of the same run id finds the states already saved and has nothing to import.
    if ((await submit.count()) > 0) {
      await submit.tap()
      await expectToast(browser, "desde SysAcad")
      await browser.waitForURL(/\/dashboard\/materias$/, { timeout: 30_000 })
    } else {
      await app.open(AppRoute.Subjects)
    }
    await expect(screen.getByRole("combobox", `Estado de ${APPROVED}`)).toHaveText("Promocionado", { timeout: 20_000 })
    await expect(screen.getByText("Nota: 8/10")).toBeVisible()
    await expect(screen.getByRole("combobox", `Estado de ${REGULAR}`)).toHaveText("Regular")
    await expect(screen.getByRole("combobox", `Estado de ${TAKING}`)).toHaveText("Cursando")
  })

  test("SYS-03 a pasted table with Reemplazar lowers a state after showing it", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Subjects)
    await screen.getByRole("link", "Importar desde SysAcad").tap()
    await browser.waitForURL(/\/importar\/sysacad$/, { timeout: 30_000 })
    await screen.getByLabel("Tabla de Estado académico").fill(`Año\tMateria\tEstado\tPlan\n2\t${APPROVED}\tRegular en 2023\t2023\n`)
    await screen.getByRole("button", "Leer tabla").tap()
    await expect(screen.getByRole("heading", "1 materia leída de SysAcad")).toBeVisible({ timeout: 30_000 })
    await expect(screen.getByRole("button", "No hay cambios para importar")).toBeDisabled()
    await screen.getByRole("radio", /^Reemplazar/).tap()
    await expect(screen.getByText("Baja de estado")).toBeVisible()
    await screen.getByRole("button", "Reemplazar 1 materia").tap()
    await expectToast(browser, "Importamos 1 materia desde SysAcad")
    await browser.waitForURL(/\/dashboard\/materias$/, { timeout: 30_000 })
    await expect(screen.getByRole("combobox", `Estado de ${APPROVED}`)).toHaveText("Regular", { timeout: 20_000 })
  })

  test("SYS-04 a broken link explains what happened and offers the other ways in", async ({ app, screen }) => {
    await app.open(`${IMPORT_ROUTE}#dataz=AAAA`)
    await expect(screen.getByRole("alert").filter({ hasText: "No pudimos leer los datos de SysAcad" })).toBeVisible({ timeout: 30_000 })
    await expect(screen.getByRole("button", "Leer tabla")).toBeVisible()
  })
})
