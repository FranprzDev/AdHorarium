import { readFile, stat } from "node:fs/promises"
import { describe, test } from "@e2e-dev/web"
import type { Browser } from "@e2e-dev/web"
import type { Screen } from "e2e"
import { expect } from "e2e"
import { Persona } from "../support/env"
import { loadState, saveState, StateKey } from "../support/state"
import { AppRoute, chooseOption, expectToast } from "../support/ui"

const ANALISIS_II = "Análisis Matemático II"
const PARADIGMAS = "Paradigmas de Programación"
const FISICA_I = "Física I"
const COMMISSION_A = "Comisión de ejemplo A"
const COMMISSION_B = "Comisión de ejemplo B"
const SHARE_NAME = "E2E"
const SHARE_LINK_PATTERN = /\/horarios\/compartido\/[A-Za-z0-9_-]{22}$/

const PDF_MAGIC = "%PDF-"
const PNG_MAGIC = "89504e470d0a1a0a"
const MIN_EXPORT_BYTES = 5_000

function addPanel(screen: Screen) {
  return screen.getByRole("region", "Agregar o cambiar materia")
}

async function selectSubject(screen: Screen, subject: string): Promise<void> {
  await chooseOption(addPanel(screen), "Materia", new RegExp(`^${subject} ·`), screen)
}

async function pickCommission(screen: Screen, browser: Browser, subject: string, commission: string): Promise<void> {
  const row = addPanel(screen).getByRole("listitem").filter({ hasText: commission })
  await row.getByRole("button", /^(Elegir|Cambiar a esta)$/).tap()
  await expectToast(browser, `${subject}: comisión ${commission} agregada`)
}

/** Removes every entry so a re-run of the same run id starts from an empty timetable. */
async function clearSchedule(screen: Screen): Promise<void> {
  const removeButtons = screen.getByRole("button", /^Quitar .+ del horario$/)
  while ((await removeButtons.count()) > 0) {
    const before = await removeButtons.count()
    await removeButtons.first().tap()
    await expect.poll(async () => removeButtons.count(), { timeout: 15_000 }).toBeLessThan(before)
  }
  await expect(screen.getByText("Tu horario está vacío. Agregá una materia desde el panel.")).toBeVisible()
}

describe("schedule builder", { tags: ["schedule"], serial: true, session: Persona.StudentA }, () => {
  test("SCH-01 an empty timetable disables export and share", async ({ app, screen }) => {
    await app.open(AppRoute.Schedule)
    await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible({ timeout: 20_000 })
    await clearSchedule(screen)
    await expect(screen.getByRole("button", "PDF")).toBeDisabled()
    await expect(screen.getByRole("button", "Imagen")).toBeDisabled()
    await expect(screen.getByRole("button", "Compartir")).toBeDisabled()
  })

  test("SCH-02 picking a catalog commission adds it to the grid", async ({ screen, browser }) => {
    await selectSubject(screen, ANALISIS_II)
    await pickCommission(screen, browser, ANALISIS_II, COMMISSION_A)
    await expect(screen.getByRole("heading", "Tus materias (1)")).toBeVisible()
    await expect(addPanel(screen).getByRole("button", "En tu horario")).toBeDisabled()
  })

  test("SCH-03 a clashing commission is flagged before and after picking it", async ({ app, screen, browser }) => {
    await selectSubject(screen, PARADIGMAS)
    const clashing = addPanel(screen).getByRole("listitem").filter({ hasText: COMMISSION_A })
    await expect(clashing.getByText(`Se superpone con ${ANALISIS_II}`)).toBeVisible()
    await pickCommission(screen, browser, PARADIGMAS, COMMISSION_A)
    await expect(screen.getByText("Tu horario tiene 1 superposición", { exact: false })).toBeVisible()
    await expect(screen.getByText("Se superpone", { exact: true }).first()).toBeVisible()
    await app.screenshot("superposicion")
  })

  test("SCH-04 changing the commission from the list resolves the overlap", async ({ screen, browser }) => {
    await screen.getByRole("button", `Cambiar la comisión de ${PARADIGMAS}`).tap()
    await expect(addPanel(screen).getByRole("combobox", "Materia")).toContainText(PARADIGMAS)
    await pickCommission(screen, browser, PARADIGMAS, COMMISSION_B)
    await expect(screen.getByText("Tu horario tiene", { exact: false })).toBeHidden()
    await expect(screen.getByRole("heading", "Tus materias (2)")).toBeVisible()
  })

  test("SCH-05 a manual timetable rejects an end before its start", async ({ app, screen, browser }) => {
    await selectSubject(screen, FISICA_I)
    await addPanel(screen).getByRole("button", "Cargar horario manual").tap()
    const dialog = screen.getByRole("dialog", "Cargar horario manual")
    await dialog.getByLabel("Comisión").fill("1K1")
    await dialog.getByLabel("Inicio").fill("10:00")
    await dialog.getByLabel("Fin").fill("09:00")
    await dialog.getByRole("button", "Guardar").tap()
    await expect(dialog.getByRole("alert")).toHaveText("La hora de fin debe ser posterior a la de inicio")
    await app.screenshot("manual-fin-antes-inicio")
    await dialog.getByLabel("Fin").fill("12:00")
    await dialog.getByRole("button", "Guardar").tap()
    await expectToast(browser, `${FISICA_I}: horario guardado`)
    await expect(screen.getByRole("heading", "Tus materias (3)")).toBeVisible()
    await expect(screen.getByText("Manual", { exact: true })).toBeVisible()
  })

  test("SCH-06 a manual entry can be edited", async ({ screen, browser }) => {
    await screen.getByRole("button", `Editar ${FISICA_I}`).tap()
    const dialog = screen.getByRole("dialog", "Editar horario manual")
    await expect(dialog.getByLabel("Comisión")).toHaveValue("1K1")
    await dialog.getByLabel("Aula (opcional)").fill("Aula 3")
    await dialog.getByRole("button", "Guardar").tap()
    await expectToast(browser, `${FISICA_I}: horario guardado`)
    await expect(screen.getByText("Lun 10:00–12:00 (Aula 3)")).toBeVisible()
  })

  test("SCH-07 the timetable exports as PDF and PNG", async ({ screen, browser }) => {
    const pdf = await browser.waitForDownload(async () => {
      await screen.getByRole("button", "PDF").tap()
    })
    expect(pdf.suggestedFilename).toMatch(/^horario-.*\.pdf$/)
    const pdfBytes = await readFile(pdf.absolutePath)
    expect(pdfBytes.subarray(0, 5).toString("latin1")).toBe(PDF_MAGIC)
    expect((await stat(pdf.absolutePath)).size).toBeGreaterThan(MIN_EXPORT_BYTES)

    const png = await browser.waitForDownload(async () => {
      await screen.getByRole("button", "Imagen").tap()
    })
    expect(png.suggestedFilename).toMatch(/^horario-.*\.png$/)
    const pngBytes = await readFile(png.absolutePath)
    expect(pngBytes.subarray(0, 8).toString("hex")).toBe(PNG_MAGIC)
    expect((await stat(png.absolutePath)).size).toBeGreaterThan(MIN_EXPORT_BYTES)
  })

  test("SCH-08 a share link is created", async ({ app, screen }) => {
    await screen.getByRole("button", "Compartir").tap()
    const dialog = screen.getByRole("dialog", "Compartir horario")
    await dialog.getByLabel("Nombre visible (opcional)").fill(SHARE_NAME)
    await dialog.getByRole("button", "Crear enlace").tap()
    const link = dialog.getByLabel("Enlace")
    await expect(link).toHaveValue(SHARE_LINK_PATTERN, { timeout: 20_000 })
    await saveState(StateKey.ShareLink, await link.inputValue())
    await app.screenshot("enlace-compartido")
    await dialog.getByRole("button", "Close").tap()
  })

  test("SCH-09 removing a subject updates the list", async ({ screen, browser }) => {
    await screen.getByRole("button", `Quitar ${FISICA_I} del horario`).tap()
    await expectToast(browser, `${FISICA_I} quitada del horario`)
    await expect(screen.getByRole("heading", "Tus materias (2)")).toBeVisible()
  })
})

describe("shared timetable", { tags: ["schedule"] }, () => {
  test("SCH-10 the shared page is public and read-only for anonymous visitors", async ({ app, screen }) => {
    await app.open(await loadState(StateKey.ShareLink))
    await expect(screen.getByRole("heading", `Horario de ${SHARE_NAME}`)).toBeVisible({ timeout: 20_000 })
    await expect(screen.getByRole("heading", "Materias (3)")).toBeVisible()
    await expect(screen.getByRole("link", "Iniciá sesión para importarlo")).toBeVisible()
    await expect(screen.getByRole("button", "Quitar", { exact: false })).toBeHidden()
    await app.screenshot("compartido-anonimo")
  })
})
