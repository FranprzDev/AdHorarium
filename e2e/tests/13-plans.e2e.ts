import { describe, test } from "@e2e-dev/web"
import type { Browser } from "@e2e-dev/web"
import type { Screen } from "e2e"
import { expect } from "e2e"
import { Persona } from "../support/env"
import { AppRoute, chooseOption, expectToast, SYSTEMS_CAREER } from "../support/ui"

/*
 * Plan-scoped catalog: a plan 2023 student builds a timetable with an elective and a plan 2008 student with plan 2008
 * subjects, both from the official 2.º cuatrimestre 2026 commissions (Departamento de Sistemas UTN-FRT):
 * Computación en la Nube (electiva, plan 2023) 4K06 meets Monday and Friday 17:00–18:30, Redes de Información
 * (plan 2008) 4K01 Monday 16:15–18:30, Tuesday 14:45–16:15 and Thursday 14:00–16:15.
 */
const SYSTEMS_2008_CAREER = `${SYSTEMS_CAREER} (Plan 2008)`
const ELECTIVE = "Computación en la Nube"
const ELECTIVE_COMMISSION = "4K06"
const PLAN_2008_SUBJECT = "Redes de Información"
const PLAN_2008_COMMISSION = "4K01"
/** A plan 2023 subject that plan 2008 does not have. */
const PLAN_2023_ONLY = "Lógica y Estructuras Discretas"

function addPanel(screen: Screen) {
  return screen.getByRole("region", "Agregar o cambiar materia")
}

async function openSchedule(app: { open: (route: AppRoute) => Promise<void> }, screen: Screen): Promise<void> {
  await app.open(AppRoute.Schedule)
  await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible({ timeout: 20_000 })
}

async function clearSchedule(screen: Screen): Promise<void> {
  const removeButtons = screen.getByRole("button", /^Quitar .+ del horario$/)
  while ((await removeButtons.count()) > 0) {
    const before = await removeButtons.count()
    await removeButtons.first().tap()
    await expect.poll(async () => removeButtons.count(), { timeout: 15_000 }).toBeLessThan(before)
  }
  await expect(screen.getByText("Tu horario está vacío. Agregá una materia desde el panel.")).toBeVisible()
}

async function pickCommission(screen: Screen, browser: Browser, subject: RegExp, subjectName: string, commission: string): Promise<void> {
  await chooseOption(addPanel(screen), "Materia", subject, screen)
  const row = addPanel(screen).getByRole("listitem").filter({ hasText: commission })
  await row.getByRole("button", /^(Elegir|Cambiar a esta)$/).tap()
  await expectToast(browser, `${subjectName}: comisión ${commission} agregada`)
  await expect(screen.getByRole("heading", "Tus materias (1)")).toBeVisible()
}

async function changeCareer(app: { open: (route: AppRoute) => Promise<void> }, screen: Screen, browser: Browser, career: string): Promise<void> {
  await app.open(AppRoute.Profile)
  await expect(screen.getByRole("heading", "Mi Perfil")).toBeVisible({ timeout: 20_000 })
  await screen.getByRole("button", "Cambiar Carrera").tap()
  const dialog = screen.getByRole("dialog", "Seleccioná tu carrera")
  await chooseOption(dialog, "Carrera", career, screen)
  await dialog.getByRole("button", "Guardar").tap()
  await expectToast(browser, "Carrera actualizada")
}

describe("plan 2008 and electives", { tags: ["schedule", "catalog"], serial: true, session: Persona.StudentB }, () => {
  test("PLN-01 a plan 2023 student adds an elective commission", async ({ app, screen, browser }) => {
    await changeCareer(app, screen, browser, SYSTEMS_CAREER)
    await openSchedule(app, screen)
    await clearSchedule(screen)
    await pickCommission(screen, browser, new RegExp(`^${ELECTIVE} · Nivel 4 · Electiva`), ELECTIVE, ELECTIVE_COMMISSION)
    await app.screenshot("electiva-2023")
    await clearSchedule(screen)
  })

  test("PLN-02 a plan 2008 student sees the plan 2008 catalog and its commissions", async ({ app, screen, browser }) => {
    await changeCareer(app, screen, browser, SYSTEMS_2008_CAREER)
    await app.open(AppRoute.Dashboard)
    await expect(screen.getByRole("heading", `Plan de Estudios - ${SYSTEMS_2008_CAREER}`)).toBeVisible({ timeout: 20_000 })
    await openSchedule(app, screen)
    await clearSchedule(screen)
    await addPanel(screen).getByRole("combobox", "Materia").tap()
    await expect(screen.getByRole("option", new RegExp(`^${PLAN_2023_ONLY} ·`))).toBeHidden()
    await screen.getByRole("option", new RegExp(`^${PLAN_2008_SUBJECT} ·`)).tap()
    const row = addPanel(screen).getByRole("listitem").filter({ hasText: PLAN_2008_COMMISSION })
    await row.getByRole("button", /^(Elegir|Cambiar a esta)$/).tap()
    await expectToast(browser, `${PLAN_2008_SUBJECT}: comisión ${PLAN_2008_COMMISSION} agregada`)
    await expect(screen.getByRole("heading", "Tus materias (1)")).toBeVisible()
    await app.screenshot("plan-2008")
  })

  test("PLN-03 leaves student B empty and back on plan 2023", async ({ app, screen, browser }) => {
    await openSchedule(app, screen)
    await clearSchedule(screen)
    await changeCareer(app, screen, browser, SYSTEMS_CAREER)
  })
})
