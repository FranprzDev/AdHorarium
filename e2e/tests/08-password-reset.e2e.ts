import { describe, test } from "@e2e-dev/web"
import { expect, type Screen } from "e2e"
import { linkFrom, waitForOutboxMail } from "../support/db"
import { accountFor, mailOutboxAvailable, Persona } from "../support/env"
import { AppRoute, fillRegistration, fillSignIn, SIGN_IN_ERROR } from "../support/ui"

const REQUESTED_MESSAGE = "Si hay una cuenta con ese email, te enviamos las instrucciones para restablecer la contraseña."
const INVALID_LINK_MESSAGE = "El enlace no es válido, ya se usó o venció. Pedí uno nuevo."
const PASSWORD_RESET_KIND = "password_reset"
const CLOCK_MARGIN_MS = 30_000

const base = accountFor(Persona.Registration)
const account = { ...base, email: base.email.replace("@", `-reset${Date.now().toString(36)}@`) }
const newPassword = `${account.password}-nueva1`

let resetPath = ""

async function requestReset(screen: Screen, email: string): Promise<void> {
  await screen.getByLabel("Email").fill(email)
  await screen.getByRole("button", "Enviar instrucciones").tap()
  await expect(screen.getByText(REQUESTED_MESSAGE, { exact: false })).toBeVisible({ timeout: 30_000 })
}

describe("password recovery entry point", { tags: ["auth", "password-reset"] }, () => {
  test("PWR-01 sign in links to recovery and any email gets the same neutral answer", async ({ app, screen, browser }) => {
    await app.open(AppRoute.SignIn)
    await screen.getByRole("link", "¿Olvidaste tu contraseña?").tap()
    await browser.waitForURL(/\/recuperar$/, { timeout: 30_000 })
    await expect(screen.getByRole("heading", "Recuperá tu contraseña")).toBeVisible()
    await screen.getByRole("button", "Enviar instrucciones").tap()
    await expect(screen.getByText("Ingresá tu email")).toBeVisible()
    await requestReset(screen, account.email)
    await app.screenshot("recuperar-respuesta-neutral")
  })

  test("PWR-02 a reset link without token explains what to do", async ({ app, screen }) => {
    await app.open(AppRoute.PasswordReset)
    await expect(screen.getByText("El enlace está incompleto", { exact: false })).toBeVisible()
    await expect(screen.getByRole("link", "Pedir un enlace nuevo")).toBeVisible()
  })
})

describe(
  "password recovery with the emailed link",
  { tags: ["auth", "password-reset"], serial: true, skip: !mailOutboxAvailable && "needs a non-production app with MAIL_OUTBOX=1, E2E_MAIL_OUTBOX=1 and E2E_DATABASE_URL" },
  () => {
    test("PWR-03 a student registers and signs out", async ({ app, screen, browser }) => {
      await app.open(AppRoute.Register)
      await fillRegistration(screen, account)
      await browser.waitForURL(/\/dashboard/, { timeout: 30_000 })
      await app.clearState()
    })

    test("PWR-04 the student asks for a reset link and receives it", async ({ app, screen }) => {
      const since = new Date(Date.now() - CLOCK_MARGIN_MS)
      await app.open(AppRoute.PasswordResetRequest)
      await requestReset(screen, account.email)
      const link = linkFrom(await waitForOutboxMail(account.email, PASSWORD_RESET_KIND, since), AppRoute.PasswordReset)
      const url = new URL(link)
      resetPath = `${url.pathname}${url.search}`
    })

    test("PWR-05 the new password follows the registration rules", async ({ app, screen }) => {
      await app.open(resetPath)
      await screen.getByLabel("Contraseña nueva").fill("corta1")
      await screen.getByLabel("Repetí la contraseña").fill("corta1")
      await screen.getByRole("button", "Guardar contraseña").tap()
      await expect(screen.getByText("La contraseña debe tener al menos 10 caracteres")).toBeVisible()
    })

    test("PWR-06 the student sets a new password and signs in with it", async ({ app, screen, browser }) => {
      await app.open(resetPath)
      await screen.getByLabel("Contraseña nueva").fill(newPassword)
      await screen.getByLabel("Repetí la contraseña").fill(newPassword)
      await screen.getByRole("button", "Guardar contraseña").tap()
      await expect(screen.getByText("Listo, cambiaste tu contraseña.", { exact: false })).toBeVisible({ timeout: 30_000 })
      await app.screenshot("restablecer-listo")
      await screen.getByRole("link", "Iniciar sesión").tap()
      await fillSignIn(screen, { email: account.email, password: account.password })
      await expect(screen.getByText(SIGN_IN_ERROR)).toBeVisible({ timeout: 30_000 })
      await fillSignIn(screen, { email: account.email, password: newPassword })
      await browser.waitForURL(/\/dashboard/, { timeout: 30_000 })
      await app.clearState()
    })

    test("PWR-07 the link works only once", async ({ app, screen }) => {
      await app.open(resetPath)
      await screen.getByLabel("Contraseña nueva").fill(`${newPassword}2`)
      await screen.getByLabel("Repetí la contraseña").fill(`${newPassword}2`)
      await screen.getByRole("button", "Guardar contraseña").tap()
      await expect(screen.getByText(INVALID_LINK_MESSAGE)).toBeVisible({ timeout: 30_000 })
      await expect(screen.getByRole("link", "Pedir un enlace nuevo")).toBeVisible()
    })
  },
)
