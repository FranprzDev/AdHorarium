import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { sql } from "../support/db"
import { accountFor, databaseUrl, Persona } from "../support/env"
import { AppRoute, chooseCareerIfAsked, expectToast, fillRegistration, fillSignIn, SIGN_IN_ERROR, SYSTEMS_CAREER } from "../support/ui"

const base = accountFor(Persona.Registration)
const account = { ...base, email: base.email.replace("@", `-delete${Date.now().toString(36)}@`) }

describe("self-service account deletion", { tags: ["auth", "account-deletion"], serial: true }, () => {
  test("DEL-01 a throwaway student registers and opens the deletion dialog from the profile", async ({ app, screen, browser }) => {
    await app.open(AppRoute.Register)
    await fillRegistration(screen, account)
    await browser.waitForURL(/\/dashboard/, { timeout: 30_000 })
    await chooseCareerIfAsked(screen, SYSTEMS_CAREER)
    await app.open(AppRoute.Profile)
    await screen.getByRole("button", "Eliminar mi cuenta").tap()
    const dialog = screen.getByRole("alertdialog", "¿Eliminar tu cuenta para siempre?")
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", "Cancelar").tap()
    await expect(dialog).toBeHidden()
  })

  test("DEL-02 a wrong password keeps the account", async ({ screen }) => {
    await screen.getByRole("button", "Eliminar mi cuenta").tap()
    const dialog = screen.getByRole("alertdialog", "¿Eliminar tu cuenta para siempre?")
    await dialog.getByLabel("Ingresá tu contraseña para confirmar").fill(`${account.password}x`)
    await dialog.getByRole("button", "Eliminar definitivamente").tap()
    await expect(dialog.getByText("La contraseña no es correcta.")).toBeVisible({ timeout: 30_000 })
  })

  test("DEL-03 the right password deletes the account, signs out and shows a toast", async ({ app, screen, browser }) => {
    const dialog = screen.getByRole("alertdialog", "¿Eliminar tu cuenta para siempre?")
    await dialog.getByLabel("Ingresá tu contraseña para confirmar").fill(account.password)
    await dialog.getByRole("button", "Eliminar definitivamente").tap()
    await expectToast(browser, "Eliminamos tu cuenta")
    await browser.waitForURL(/\/$/, { timeout: 30_000 })
    await app.screenshot("cuenta-eliminada")
  })

  test("DEL-04 the deleted credentials no longer sign in", async ({ app, screen }) => {
    await app.open(AppRoute.SignIn)
    await fillSignIn(screen, account)
    await expect(screen.getByText(SIGN_IN_ERROR)).toBeVisible({ timeout: 30_000 })
    if (databaseUrl) {
      const { rows } = await sql<{ count: string }>("select count(*)::text as count from users where email = $1", [account.email])
      expect(rows[0].count).toBe("0")
    }
  })
})
