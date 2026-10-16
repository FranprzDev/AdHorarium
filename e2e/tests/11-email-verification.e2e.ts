import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { linkFrom, waitForOutboxMail } from "../support/db"
import { accountFor, mailOutboxAvailable, Persona } from "../support/env"
import { AppRoute, chooseCareerIfAsked, expectToast, fillRegistration, SYSTEMS_CAREER } from "../support/ui"

const EMAIL_VERIFICATION_KIND = "email_verification"
const BANNER_NAME = "Confirmación de email"
const CLOCK_MARGIN_MS = 30_000
const BANNER_SETTLE_MS = 3_000

const base = accountFor(Persona.Registration)
const account = { ...base, email: base.email.replace("@", `-verify${Date.now().toString(36)}@`) }

let verifyPath = ""

describe("email verification entry point", { tags: ["auth", "email-verification"] }, () => {
  test("EMV-01 a verification link without token explains what to do", async ({ app, screen }) => {
    await app.open(AppRoute.VerifyEmail)
    await expect(screen.getByRole("heading", "Confirmá tu email")).toBeVisible()
    await expect(screen.getByText("El enlace está incompleto", { exact: false })).toBeVisible()
  })
})

describe(
  "email verification with the emailed link",
  { tags: ["auth", "email-verification"], serial: true, skip: !mailOutboxAvailable && "needs a non-production app with MAIL_OUTBOX=1, E2E_MAIL_OUTBOX=1 and E2E_DATABASE_URL" },
  () => {
    test("EMV-02 a new student sees the banner and can ask for a new link", async ({ app, screen, browser }) => {
      await app.open(AppRoute.Register)
      await fillRegistration(screen, account)
      await browser.waitForURL(/\/dashboard/, { timeout: 30_000 })
      await chooseCareerIfAsked(screen, SYSTEMS_CAREER)
      const banner = screen.getByRole("region", BANNER_NAME)
      await expect(banner).toBeVisible({ timeout: 30_000 })
      await app.screenshot("verificacion-aviso")
      const since = new Date(Date.now() - CLOCK_MARGIN_MS)
      await banner.getByRole("button", "Reenviar email").tap()
      await expectToast(browser, "Te enviamos un enlace nuevo")
      const url = new URL(linkFrom(await waitForOutboxMail(account.email, EMAIL_VERIFICATION_KIND, since), AppRoute.VerifyEmail))
      verifyPath = `${url.pathname}${url.search}`
    })

    test("EMV-03 the link confirms the email and the banner goes away", async ({ app, screen, browser }) => {
      await app.open(verifyPath)
      await screen.getByRole("button", "Confirmar mi email").tap()
      await expect(screen.getByText("Listo, confirmaste tu email.")).toBeVisible({ timeout: 30_000 })
      await screen.getByRole("link", "Ir a mi panel").first().tap()
      await browser.waitForURL(/\/dashboard/, { timeout: 30_000 })
      await expect(screen.getByRole("heading", `Plan de Estudios - ${SYSTEMS_CAREER}`)).toBeVisible({ timeout: 30_000 })
      await new Promise((resolve) => setTimeout(resolve, BANNER_SETTLE_MS))
      await expect(screen.getByRole("region", BANNER_NAME)).toBeHidden()
    })

    test("EMV-04 the link works only once", async ({ app, screen }) => {
      await app.open(verifyPath)
      await screen.getByRole("button", "Confirmar mi email").tap()
      await expect(screen.getByText("El enlace no es válido, ya se usó o venció.", { exact: false })).toBeVisible({ timeout: 30_000 })
    })
  },
)
