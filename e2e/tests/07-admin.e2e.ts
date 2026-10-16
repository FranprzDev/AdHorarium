import { describe, test } from "@e2e-dev/web"
import type { Browser } from "@e2e-dev/web"
import type { Screen } from "e2e"
import { expect } from "e2e"
import { sql } from "../support/db"
import { adminAvailable, databaseUrl, E2E_SUBJECT_PREFIX, Persona, runId, runNumber } from "../support/env"
import { AppRoute, chooseOption, expectToast, SYSTEMS_CAREER } from "../support/ui"

/*
 * Admin catalog flows on two subjects the suite creates (named "E2E … <run id>") and one commission. Student A then
 * checks that commission edits reach their timetable and that deleting it turns the entry into a manual one.
 * The admin and student groups alternate, so the file must run in declaration order (workers: 1).
 */

const SUBJECT_X = `${E2E_SUBJECT_PREFIX}Materia X ${runId}`
const SUBJECT_X_EDITED = `${SUBJECT_X} editada`
const SUBJECT_Y = `${E2E_SUBJECT_PREFIX}Materia Y ${runId}`
const COMMISSION = "E2E-K1"
const SKIP_REASON = !adminAvailable && "admin flows need E2E_DATABASE_URL (to promote the admin) or E2E_ADMIN_EMAIL/PASSWORD"

async function openAdmin(app: { open(path?: string): Promise<void> }, screen: Screen, search: string): Promise<void> {
  await app.open(AppRoute.Admin)
  await expect(screen.getByRole("heading", "Administración")).toBeVisible({ timeout: 20_000 })
  await screen.getByRole("textbox", "Buscar materia por nombre").fill(search)
}

function row(screen: Screen, subject: string) {
  return screen.getByRole("row").filter({ hasText: subject })
}

async function createSubject(screen: Screen, name: string, number: number): Promise<void> {
  await screen.getByRole("button", "Nueva materia").tap()
  const dialog = screen.getByRole("dialog", "Nueva materia")
  await chooseOption(dialog, "Carrera", SYSTEMS_CAREER, screen)
  await dialog.getByLabel("Número").fill(String(number))
  await chooseOption(dialog, "Nivel", "2", screen)
  await dialog.getByLabel("Horas").fill("4")
  await dialog.getByLabel("Nombre").fill(name)
  await dialog.getByRole("button", "Crear materia").tap()
  await expect(dialog).toBeHidden({ timeout: 20_000 })
}

async function scheduleEntryText(screen: Screen, browser: Browser, subject: string): Promise<string> {
  await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible({ timeout: 20_000 })
  const item = browser.locator("#my-subjects-title + ul > li").filter({ hasText: subject })
  return (await item.textContent()) ?? ""
}

describe("admin access control", { tags: ["admin"], session: Persona.StudentA }, () => {
  test("ADM-01 a student opening the admin panel gets access denied", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Admin)
    await browser.waitForURL(/\/acceso-denegado$/, { timeout: 30_000 })
    await expect(screen.getByRole("heading", "Acceso denegado")).toBeVisible()
    await expect(screen.getByRole("link", "Administración")).toBeHidden()
  })
})

describe("admin catalog", { tags: ["admin"], serial: true, session: Persona.Admin, skip: SKIP_REASON }, () => {
  test("ADM-02 the admin creates subjects and the form validates the name", async ({ app, screen }) => {
    if (databaseUrl) {
      // A re-run of the same run id starts without the rows a previous attempt left (subject numbers are unique).
      await sql("delete from subjects where name like $1", [`${E2E_SUBJECT_PREFIX}% ${runId}%`])
    }
    await openAdmin(app, screen, runId)
    await expect(screen.getByText("No hay materias", { exact: false })).toBeVisible()

    await screen.getByRole("button", "Nueva materia").tap()
    const dialog = screen.getByRole("dialog", "Nueva materia")
    await chooseOption(dialog, "Carrera", SYSTEMS_CAREER, screen)
    await dialog.getByLabel("Número").fill(String(runNumber))
    await dialog.getByRole("button", "Crear materia").tap()
    await expect(dialog.getByText("Ingresá el nombre de la materia")).toBeVisible()
    await dialog.getByRole("button", "Cancelar").tap()

    await createSubject(screen, SUBJECT_X, runNumber)
    await createSubject(screen, SUBJECT_Y, runNumber + 1)
    await expect(row(screen, SUBJECT_X)).toBeVisible()
    await expect(row(screen, SUBJECT_Y)).toBeVisible()
    await app.screenshot("admin-materias-e2e")
  })

  test("ADM-03 the admin edits a subject", async ({ screen }) => {
    await screen.getByRole("button", `Editar ${SUBJECT_X}`).tap()
    const dialog = screen.getByRole("dialog", "Editar materia")
    await dialog.getByLabel("Nombre").fill(SUBJECT_X_EDITED)
    await dialog.getByRole("button", "Guardar cambios").tap()
    await expect(dialog).toBeHidden({ timeout: 20_000 })
    await expect(row(screen, SUBJECT_X_EDITED)).toBeVisible()
  })

  test("ADM-04 correlatives: add, reject duplicates and cycles, remove", async ({ app, screen }) => {
    await screen.getByRole("button", `Correlativas de ${SUBJECT_X_EDITED}`).tap()
    let dialog = screen.getByRole("dialog", `Correlativas de ${SUBJECT_X_EDITED}`)
    await expect(dialog.getByText("Esta materia no tiene correlativas.")).toBeVisible()
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await chooseOption(dialog, "Materia requerida", new RegExp(`\\. ${SUBJECT_Y} \\(nivel 2\\)$`), screen)
      await dialog.getByRole("button", "Agregar correlativa").tap()
    }
    await expect(dialog.getByText("Esa correlativa ya existe para ese propósito")).toBeVisible()
    await expect(dialog.getByRole("button", `Quitar ${SUBJECT_Y}`)).toBeVisible()
    await app.screenshot("admin-correlativa-duplicada")
    await dialog.getByRole("button", "Close").tap()

    await screen.getByRole("button", `Correlativas de ${SUBJECT_Y}`).tap()
    dialog = screen.getByRole("dialog", `Correlativas de ${SUBJECT_Y}`)
    await chooseOption(dialog, "Materia requerida", new RegExp(`\\. ${SUBJECT_X_EDITED} \\(nivel 2\\)$`), screen)
    await dialog.getByRole("button", "Agregar correlativa").tap()
    await expect(dialog.getByText("La correlativa generaría un ciclo en el plan")).toBeVisible()
    await dialog.getByRole("button", "Close").tap()

    await screen.getByRole("button", `Correlativas de ${SUBJECT_X_EDITED}`).tap()
    dialog = screen.getByRole("dialog", `Correlativas de ${SUBJECT_X_EDITED}`)
    await dialog.getByRole("button", `Quitar ${SUBJECT_Y}`).tap()
    await expect(dialog.getByText("Esta materia no tiene correlativas.")).toBeVisible()
    await dialog.getByRole("button", "Close").tap()
  })

  test("ADM-05 commissions: validation and creation", async ({ screen, browser }) => {
    await screen.getByRole("button", `Comisiones y horarios de ${SUBJECT_X_EDITED}`).tap()
    await screen.getByRole("button", "Nueva comisión").tap()
    const form = screen.getByRole("dialog", "Nueva comisión")
    await form.getByRole("button", "Crear comisión").tap()
    await expect(form.getByRole("alert")).toHaveText("Ingresá el nombre de la comisión")
    await form.getByLabel("Nombre").fill(COMMISSION)
    await form.getByLabel("Inicio").fill("18:00")
    await form.getByLabel("Fin").fill("17:00")
    await form.getByRole("button", "Crear comisión").tap()
    await expect(form.getByRole("alert")).toHaveText("La hora de fin debe ser posterior a la de inicio")
    await form.getByLabel("Fin").fill("20:00")
    await form.getByRole("button", "Crear comisión").tap()
    await expectToast(browser, "Comisión creada")
    await expect(screen.getByRole("dialog", "Comisiones y horarios").getByText("Lun 18:00–20:00")).toBeVisible()
  })
})

describe("student picks the new commission", { tags: ["admin"], serial: true, session: Persona.StudentA, skip: SKIP_REASON }, () => {
  test("ADM-06 the student adds the admin's commission to the timetable", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Schedule)
    const panel = screen.getByRole("region", "Agregar o cambiar materia")
    await chooseOption(panel, "Materia", new RegExp(`^${SUBJECT_X_EDITED} ·`), screen)
    await panel.getByRole("listitem").filter({ hasText: COMMISSION }).getByRole("button", "Elegir").tap()
    await expectToast(browser, `${SUBJECT_X_EDITED}: comisión ${COMMISSION} agregada`)
    expect(await scheduleEntryText(screen, browser, SUBJECT_X_EDITED)).toContain("Lun 18:00–20:00")
  })
})

describe("admin edits the commission in use", { tags: ["admin"], serial: true, session: Persona.Admin, skip: SKIP_REASON }, () => {
  test("ADM-07 editing a commission warns how many timetables it changes", async ({ app, screen, browser }) => {
    await openAdmin(app, screen, runId)
    await screen.getByRole("button", `Comisiones y horarios de ${SUBJECT_X_EDITED}`).tap()
    const list = screen.getByRole("dialog", "Comisiones y horarios")
    await expect(list.getByText("1 estudiante", { exact: true })).toBeVisible()
    await list.getByRole("button", `Editar comisión ${COMMISSION}`).tap()
    const form = screen.getByRole("dialog", `Editar comisión ${COMMISSION}`)
    await expect(form.getByText("Los cambios se verán al instante en 1 horario de estudiantes.", { exact: false })).toBeVisible()
    await chooseOption(form, "Día", "Martes", screen)
    await form.getByRole("button", "Guardar cambios").tap()
    await expectToast(browser, `Comisión ${COMMISSION} actualizada`)
  })
})

describe("student sees the edit", { tags: ["admin"], serial: true, session: Persona.StudentA, skip: SKIP_REASON }, () => {
  test("ADM-08 the commission edit reaches the student's timetable", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Schedule)
    expect(await scheduleEntryText(screen, browser, SUBJECT_X_EDITED)).toContain("Mar 18:00–20:00")
  })
})

describe("admin deletes the commission in use", { tags: ["admin"], serial: true, session: Persona.Admin, skip: SKIP_REASON }, () => {
  test("ADM-09 deleting a commission in use converts the entries to manual ones", async ({ app, screen }) => {
    await openAdmin(app, screen, runId)
    await screen.getByRole("button", `Comisiones y horarios de ${SUBJECT_X_EDITED}`).tap()
    await screen.getByRole("dialog", "Comisiones y horarios").getByRole("button", `Eliminar comisión ${COMMISSION}`).tap()
    const confirm = screen.getByRole("alertdialog", `¿Eliminar la comisión ${COMMISSION}?`)
    await app.screenshot("admin-eliminar-comision-en-uso")
    await confirm.getByRole("button", "Eliminar y convertir horarios").tap()
    await expect(confirm).toBeHidden({ timeout: 20_000 })
    await expect(screen.getByText("Esta materia todavía no tiene comisiones.", { exact: false })).toBeVisible()
  })
})

describe("student keeps the converted entry", { tags: ["admin"], serial: true, session: Persona.StudentA, skip: SKIP_REASON }, () => {
  test("ADM-10 the student's entry is now manual with the same slots", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Schedule)
    const text = await scheduleEntryText(screen, browser, SUBJECT_X_EDITED)
    expect(text).toContain("Manual")
    expect(text).toContain("Mar 18:00–20:00")
  })
})

describe("admin removes the test subjects", { tags: ["admin"], serial: true, session: Persona.Admin, skip: SKIP_REASON }, () => {
  test("ADM-11 the admin deletes both subjects", async ({ app, screen }) => {
    await openAdmin(app, screen, runId)
    for (const subject of [SUBJECT_X_EDITED, SUBJECT_Y]) {
      await screen.getByRole("button", `Eliminar ${subject}`).tap()
      const confirm = screen.getByRole("alertdialog", `¿Eliminar ${subject}?`)
      await confirm.getByRole("button", "Eliminar").tap()
      await expect(row(screen, subject)).toBeHidden({ timeout: 20_000 })
    }
  })
})

describe("student timetable after the subject is gone", { tags: ["admin"], session: Persona.StudentA, skip: SKIP_REASON }, () => {
  test("ADM-12 deleting a subject removes it from the student's timetable", async ({ app, screen }) => {
    await app.open(AppRoute.Schedule)
    await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible({ timeout: 20_000 })
    await expect(screen.getByText(SUBJECT_X_EDITED)).toBeHidden()
  })
})
