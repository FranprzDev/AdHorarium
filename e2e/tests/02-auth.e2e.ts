import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { accountFor, Persona } from "../support/env"
import { AppRoute, chooseCareerIfAsked, fillRegistration, fillSignIn, SIGN_IN_ERROR, SYSTEMS_CAREER } from "../support/ui"

/** A fresh account per invocation, so the happy-path registration always creates a new user. */
const base = accountFor(Persona.Registration)
const account = { ...base, email: base.email.replace("@", `-${Date.now().toString(36)}@`) }

const DUPLICATE_MESSAGE = "No pudimos crear la cuenta con ese email. Si ya tenés una cuenta, iniciá sesión."

describe("authentication", { tags: ["auth"], serial: true }, () => {
  test("AUTH-01 registration validates the password before calling the server", async ({ app, screen }) => {
    await app.open(AppRoute.Register)
    await fillRegistration(screen, { ...account, password: "corta1" })
    await expect(screen.getByText("La contraseña debe tener al menos 10 caracteres")).toBeVisible()
    await fillRegistration(screen, { ...account, password: "solamenteletras" })
    await expect(screen.getByText("La contraseña debe combinar letras y números")).toBeVisible()
    await fillRegistration(screen, account, `${account.password}x`)
    await expect(screen.getByText("Las contraseñas no coinciden")).toBeVisible()
    await app.screenshot("registro-validacion")
  })

  test("AUTH-02 a new student registers, lands on the dashboard and picks a career", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Register)
    await fillRegistration(screen, account)
    await browser.waitForURL(/\/dashboard$/, { timeout: 30_000 })
    expect(await chooseCareerIfAsked(screen, SYSTEMS_CAREER)).toBe(true)
    await expect(screen.getByRole("heading", `Plan de Estudios - ${SYSTEMS_CAREER}`)).toBeVisible()
    await expect(screen.getByText(account.email)).toBeVisible()
  })

  test("AUTH-03 the student signs out", async ({ screen, browser }) => {
    await screen.getByRole("button", "Salir").tap()
    await browser.waitForURL(/\/$/, { timeout: 30_000 })
    await expect(screen.getByRole("navigation", "Principal").getByRole("link", "Iniciar sesión")).toBeVisible()
  })

  test("AUTH-04 registering an email twice is rejected without revealing the account", async ({ app, screen }) => {
    await app.open(AppRoute.Register)
    await fillRegistration(screen, account)
    await expect(screen.getByText(DUPLICATE_MESSAGE)).toBeVisible({ timeout: 30_000 })
  })

  test("AUTH-05 a wrong password shows a generic error", async ({ app, screen, browser }) => {
    await app.open(AppRoute.SignIn)
    await expect(screen.getByRole("button", "Continuar con Google")).toBeVisible()
    await fillSignIn(screen, { email: account.email, password: `${account.password}x` })
    await expect(screen.getByText(SIGN_IN_ERROR)).toBeVisible({ timeout: 30_000 })
    await expect(browser).toHaveURL(/\/ingresar/)
  })

  test("AUTH-06 protected routes redirect to sign in and come back after it", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Schedule)
    await browser.waitForURL(/\/ingresar\?callbackUrl=.*dashboard%2Fhorarios/, { timeout: 30_000 })
    await fillSignIn(screen, account)
    await browser.waitForURL(/\/dashboard\/horarios$/, { timeout: 30_000 })
    await expect(screen.getByRole("heading", "Gestor de Horarios")).toBeVisible()
  })

  test("AUTH-07 a signed-in student opening sign in goes straight to the dashboard", async ({ app, browser }) => {
    await app.open(AppRoute.SignIn)
    await browser.waitForURL(/\/dashboard$/, { timeout: 30_000 })
  })

  test("AUTH-08 the admin area asks anonymous visitors to sign in", async ({ app, screen, browser }) => {
    await screen.getByRole("button", "Salir").tap()
    await browser.waitForURL(/\/$/, { timeout: 30_000 })
    await app.open(AppRoute.Admin)
    await browser.waitForURL(/\/ingresar\?callbackUrl=.*%2Fadmin/, { timeout: 30_000 })
  })
})
