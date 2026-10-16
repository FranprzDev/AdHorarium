import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { baseUrl } from "../support/env"
import { AppRoute, chooseOption, ELECTRONICS_CAREER, SYSTEMS_CAREER } from "../support/ui"

const REPOSITORY_URL = "https://github.com/FranprzDev/AdHorarium"

describe("public pages", { tags: ["public"] }, () => {
  test("PUB-01 landing shows every section and its calls to action", async ({ app, screen }) => {
    await app.open(AppRoute.Home)
    await expect(screen.getByRole("heading", { level: 1 })).toContainText("Tu carrera universitaria")
    for (const heading of ["Qué es AdHorarium", "Lo que podés hacer hoy", "Cómo funciona AdHorarium"]) {
      await expect(screen.getByRole("heading", heading)).toBeVisible()
    }
    for (const feature of ["Plan de correlativas", "Estado de tus materias", "Buscador de mesa", "Gestor de horarios"]) {
      await expect(screen.getByRole("heading", feature)).toBeVisible()
    }
    const nav = screen.getByRole("navigation", "Principal")
    await expect(nav.getByRole("link", "Planes de estudio")).toHaveAttribute("href", AppRoute.Careers)
    await expect(nav.getByRole("link", "Demo")).toHaveAttribute("href", AppRoute.Demo)
    await expect(nav.getByRole("link", "Iniciar sesión")).toHaveAttribute("href", AppRoute.SignIn)
    await expect(screen.getByRole("main").getByRole("link", "Crear cuenta")).toHaveAttribute("href", AppRoute.Register)
    await expect(screen.getByRole("link", "Política de privacidad")).toHaveAttribute("href", AppRoute.Privacy)
    await expect(screen.getByRole("link", "Código abierto en GitHub")).toHaveAttribute("href", REPOSITORY_URL)
    await app.screenshot("landing")
  })

  test("PUB-02 landing links reach the public pages", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Home)
    await screen.getByRole("navigation", "Principal").getByRole("link", "Planes de estudio").tap()
    await browser.waitForURL(/\/careers$/)
    await app.open(AppRoute.Home)
    await browser.locator(`main a[href="${AppRoute.Register}"]`).tap()
    await browser.waitForURL(/\/registro$/)
    await expect(screen.getByRole("button", "Crear cuenta")).toBeVisible()
  })

  test("PUB-08 on a phone the header menu reaches the public pages", async ({ app, screen, browser }) => {
    await browser.setViewport({ width: 390, height: 844 })
    await app.open(AppRoute.Home)
    const nav = screen.getByRole("navigation", "Principal")
    await expect(nav.getByRole("link", "Planes de estudio")).toBeHidden()
    await nav.getByRole("button", "Más secciones").tap()
    await expect(screen.getByRole("menuitem", "Demo")).toBeVisible()
    await expect(screen.getByRole("menuitem", "Crear cuenta")).toBeVisible()
    await app.screenshot("landing-menu-movil")
    await screen.getByRole("menuitem", "Planes de estudio").tap()
    await browser.waitForURL(/\/careers$/)
  })

  test("PUB-03 study plan: career selector and subject detail", async ({ app, screen }) => {
    await app.open(AppRoute.Careers)
    await expect(screen.getByRole("heading", /^Plan de Estudios - /)).toBeVisible({ timeout: 20_000 })
    await chooseOption(screen, "Carrera", SYSTEMS_CAREER)
    await expect(screen.getByRole("heading", `Plan de Estudios - ${SYSTEMS_CAREER}`)).toBeVisible({ timeout: 20_000 })
    await expect(screen.getByRole("heading", "Nivel 1")).toBeVisible()
    await expect(screen.getByRole("heading", "Nivel 5")).toBeVisible()

    await screen.getByRole("button", /^Análisis Matemático II/).tap()
    await expect(screen.getByText("MATERIA SELECCIONADA")).toBeVisible()
    await expect(screen.getByRole("button", "Volver al Plan de Estudios")).toBeVisible()
    await expect(screen.getByText("Análisis Matemático I", { exact: true }).first()).toBeVisible()
    await app.screenshot("careers-detail")
    await screen.getByRole("button", "Volver al Plan de Estudios").tap()
    await expect(screen.getByRole("heading", "Nivel 1")).toBeVisible()

    await chooseOption(screen, "Carrera", ELECTRONICS_CAREER)
    await expect(screen.getByRole("heading", `Plan de Estudios - ${ELECTRONICS_CAREER}`)).toBeVisible({ timeout: 20_000 })
  })

  test("PUB-04 demo: filters and subject focus", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Demo)
    await expect(screen.getByRole("heading", "Demo - Plan de Correlativas")).toBeVisible()
    const cards = browser.locator("[data-course-code]")
    await expect(cards.first()).toBeVisible()
    const withoutElectives = await cards.count()

    await screen.getByText("Ocultar electivas").tap()
    await expect.poll(async () => cards.count()).toBeGreaterThan(withoutElectives)
    await screen.getByText("Ocultar electivas").tap()
    await expect.poll(async () => cards.count()).toBe(withoutElectives)

    for (const tab of ["Rendir", "Aprobadas", "Cursar", "Regulares"]) {
      await screen.getByRole("button", tab).tap()
      await expect(screen.getByRole("button", tab)).toHaveAttribute("aria-pressed", "true")
      await expect(cards.first()).toBeVisible()
    }

    await browser.locator("[data-course-code]").filter({ hasText: "Paradigmas de Programación" }).tap()
    await expect(screen.getByRole("button", "Ver todo el plan")).toBeVisible()
    await expect.poll(async () => cards.count()).toBeLessThan(withoutElectives)
    await screen.getByRole("button", "Ver todo el plan").tap()
    await expect.poll(async () => cards.count()).toBe(withoutElectives)
  })

  test("PUB-05 privacy policy and access denied pages render", async ({ app, screen }) => {
    await app.open(AppRoute.Privacy)
    await expect(screen.getByRole("heading", "Política de privacidad")).toBeVisible()
    await expect(screen.getByRole("heading", "Contacto")).toBeVisible()
    await app.open(AppRoute.AccessDenied)
    await expect(screen.getByRole("heading", "Acceso denegado")).toBeVisible()
    await expect(screen.getByRole("link", "Volver al panel")).toHaveAttribute("href", AppRoute.Dashboard)
  })

  test("PUB-06 dark mode toggle switches and persists the theme", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Home)
    const isDark = async () => browser.evaluate(() => document.documentElement.classList.contains("dark"))
    expect(await isDark()).toBe(false)
    await screen.getByRole("button", "Usar tema oscuro").tap()
    await expect.poll(isDark).toBe(true)
    await browser.reload()
    await expect.poll(isDark).toBe(true)
    await expect(screen.getByRole("button", "Usar tema claro")).toBeVisible()
    await app.screenshot("landing-dark")
    await screen.getByRole("button", "Usar tema claro").tap()
    await expect.poll(isDark).toBe(false)
  })

  test("PUB-07 unknown routes answer 404", async ({ app, screen }) => {
    const path = "/e2e-ruta-inexistente"
    const response = await fetch(new URL(path, baseUrl))
    expect(response.status).toBe(404)
    await app.open(path)
    await expect(screen.getByText(/404/).first()).toBeVisible()
  })
})
