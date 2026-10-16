import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { Persona } from "../support/env"
import { AppRoute, chooseOption, ELECTRONICS_CAREER, expectToast, SYSTEMS_CAREER } from "../support/ui"

const BASIC_SUBJECT = "Análisis Matemático I"
const GRADED_SUBJECT = "Álgebra y Geometría Analítica"
const GRADE_ERROR = "La nota debe ser un número entre 1 y 10"

describe("student tools", { tags: ["student"], session: Persona.StudentA }, () => {
  test("STU-01 study plan shows the student's career and a subject's correlatives", async ({ app, screen }) => {
    await app.open(AppRoute.Dashboard)
    await expect(screen.getByRole("heading", `Plan de Estudios - ${SYSTEMS_CAREER}`)).toBeVisible({ timeout: 20_000 })
    await screen.getByRole("button", /^Análisis Matemático II/).tap()
    await expect(screen.getByText("NECESITAS PARA CURSAR")).toBeVisible()
    await expect(screen.getByText(BASIC_SUBJECT, { exact: true }).first()).toBeVisible()
    await screen.getByRole("button", "Volver al Plan de Estudios").tap()
    await expect(screen.getByRole("heading", "Nivel 1")).toBeVisible()
  })

  test("STU-02 subjects manager saves a status change and confirms it", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Subjects)
    await expect(screen.getByRole("heading", "Gestor de Materias")).toBeVisible({ timeout: 20_000 })
    const status = screen.getByRole("combobox", `Estado de ${BASIC_SUBJECT}`)
    // Re-runs of the same run id start from the previous state, so always pick a different status.
    const target = (await status.textContent())?.includes("Regular") ? "Cursando" : "Regular"
    await chooseOption(screen, `Estado de ${BASIC_SUBJECT}`, target)
    await expectToast(browser, `${BASIC_SUBJECT}: ${target}`)
    await browser.reload()
    await expect(screen.getByRole("combobox", `Estado de ${BASIC_SUBJECT}`)).toHaveText(target)
  })

  test("STU-03 a promoted subject takes a grade between 1 and 10", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Subjects)
    await chooseOption(screen, `Estado de ${GRADED_SUBJECT}`, "Cursando")
    await expectToast(browser, `${GRADED_SUBJECT}: Cursando`)
    await expect(screen.getByRole("button", `Cargar nota de ${GRADED_SUBJECT}`)).toBeHidden()
    await chooseOption(screen, `Estado de ${GRADED_SUBJECT}`, "Promocionado")
    await expectToast(browser, `${GRADED_SUBJECT}: Promocionado`)
    await screen.getByRole("button", `Cargar nota de ${GRADED_SUBJECT}`).tap()
    const dialog = screen.getByRole("dialog", `Ingresar nota para ${GRADED_SUBJECT}`)
    await dialog.getByLabel("Nota final (1-10)").fill("11")
    await dialog.getByRole("button", "Guardar Nota").tap()
    await expect(dialog.getByText(GRADE_ERROR)).toBeVisible()
    await app.screenshot("nota-invalida")
    await dialog.getByLabel("Nota final (1-10)").fill("8")
    await dialog.getByRole("button", "Guardar Nota").tap()
    await expectToast(browser, `Nota de ${GRADED_SUBJECT} guardada: 8/10`)
    await expect(dialog).toBeHidden()
    await expect(screen.getByText("Nota: 8/10")).toBeVisible()
  })

  test("STU-04 subjects manager filters basic sciences", async ({ app, screen }) => {
    await app.open(AppRoute.Subjects)
    await screen.getByRole("button", "Ciencias Básicas").tap()
    await expect(screen.getByRole("combobox", `Estado de ${BASIC_SUBJECT}`)).toBeVisible()
    await expect(screen.getByRole("combobox", "Estado de Paradigmas de Programación")).toBeHidden()
    await screen.getByRole("button", "Todas").tap()
    await expect(screen.getByRole("combobox", "Estado de Paradigmas de Programación")).toBeVisible()
  })

  test("STU-05 exam table finder: grid, table, search and empty states", async ({ app, screen }) => {
    await app.open(AppRoute.ExamTables)
    await expect(screen.getByRole("heading", "Buscador de Mesa")).toBeVisible({ timeout: 20_000 })
    await chooseOption(screen, /Carrera/, SYSTEMS_CAREER)
    const search = screen.getByRole("textbox", /Buscar Materia/)
    await search.fill("Paradigmas")
    await expect(screen.getByRole("heading", "Paradigmas de Programación")).toBeVisible()
    await screen.getByRole("button", "Vista de Tabla").tap()
    for (const table of ["Mesa I", "Mesa II", "Mesa III"]) await expect(screen.getByRole("tab", table)).toBeVisible()
    await search.fill("zzzz-no-existe")
    await expect(screen.getByText("No hay materias disponibles para esta mesa.")).toBeVisible()
    await screen.getByRole("button", "Vista de Cuadrícula").tap()
    await expect(screen.getByText("No se encontraron materias con ese criterio de búsqueda.")).toBeVisible()
  })

  test("STU-06 profile shows the average and changes the career", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Profile)
    await expect(screen.getByRole("heading", "Mi Perfil")).toBeVisible({ timeout: 20_000 })
    await expect(screen.getByText("Basado en 1 materia promocionada")).toBeVisible()
    await expect(screen.getByText("Equivalencia GPA (0-4)")).toBeVisible()
    await app.screenshot("perfil")

    for (const career of [ELECTRONICS_CAREER, SYSTEMS_CAREER]) {
      await screen.getByRole("button", "Cambiar Carrera").tap()
      const dialog = screen.getByRole("dialog", "Selecciona tu carrera")
      await chooseOption(dialog, "Carrera", career, screen)
      await dialog.getByRole("button", "Guardar").tap()
      await expectToast(browser, "Carrera actualizada")
      await expect(screen.getByText(career, { exact: true }).first()).toBeVisible()
    }
  })
})
