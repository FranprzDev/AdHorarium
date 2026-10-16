import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { Persona } from "../support/env"
import { loadState, StateKey } from "../support/state"
import { AppRoute, chooseOption, expectToast } from "../support/ui"

const OWN_SUBJECT = "Sintaxis y Semántica de los Lenguajes"
const OWN_COMMISSION = "Comisión de ejemplo A"

describe("import a shared timetable", { tags: ["schedule", "import"], serial: true, session: Persona.StudentB }, () => {
  test("IMP-01 the second student starts with one subject of their own", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Schedule)
    await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible({ timeout: 20_000 })
    const removeButtons = screen.getByRole("button", /^Quitar .+ del horario$/)
    while ((await removeButtons.count()) > 0) {
      const before = await removeButtons.count()
      await removeButtons.first().tap()
      await expect.poll(async () => removeButtons.count(), { timeout: 15_000 }).toBeLessThan(before)
    }
    const panel = screen.getByRole("region", "Agregar o cambiar materia")
    await chooseOption(panel, "Materia", new RegExp(`^${OWN_SUBJECT} ·`), screen)
    await panel.getByRole("listitem").filter({ hasText: OWN_COMMISSION }).getByRole("button", "Elegir").tap()
    await expectToast(browser, `${OWN_SUBJECT}: comisión ${OWN_COMMISSION} agregada`)
    await expect(screen.getByRole("heading", "Tus materias (1)")).toBeVisible()
  })

  test("IMP-02 Combinar keeps the student's subjects and adds the shared ones", async ({ app, screen, browser }) => {
    await app.open(await loadState(StateKey.ShareLink))
    await screen.getByRole("button", "Importar a mi horario").tap()
    const dialog = screen.getByRole("dialog", "Importar horario")
    await expect(dialog.getByRole("radio", /^Combinar/)).toBeChecked()
    await app.screenshot("importar-combinar")
    await dialog.getByRole("button", "Importar").tap()
    await expectToast(browser, "Horario importado")
    await browser.waitForURL(/\/dashboard\/horarios$/, { timeout: 30_000 })
    await expect(screen.getByRole("heading", "Tus materias (4)")).toBeVisible({ timeout: 20_000 })
    await expect(screen.getByRole("button", `Quitar ${OWN_SUBJECT} del horario`)).toBeVisible()
  })

  test("IMP-03 Reemplazar swaps the whole timetable for the shared one", async ({ app, screen, browser }) => {
    await app.open(await loadState(StateKey.ShareLink))
    await screen.getByRole("button", "Importar a mi horario").tap()
    const dialog = screen.getByRole("dialog", "Importar horario")
    await dialog.getByRole("radio", /^Reemplazar/).tap()
    await dialog.getByRole("button", "Reemplazar mi horario").tap()
    await expectToast(browser, "Horario importado")
    await browser.waitForURL(/\/dashboard\/horarios$/, { timeout: 30_000 })
    await expect(screen.getByRole("heading", "Tus materias (3)")).toBeVisible({ timeout: 20_000 })
    await expect(screen.getByRole("button", `Quitar ${OWN_SUBJECT} del horario`)).toBeHidden()
  })
})
