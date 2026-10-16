import type { Browser } from "@e2e-dev/web"
import type { App, Locator, Screen } from "e2e"
import { expect } from "e2e"
import { promoteToAdmin } from "./db"
import type { Account } from "./env"

export enum AppRoute {
  Home = "/",
  Careers = "/careers",
  Demo = "/demo",
  Privacy = "/privacidad",
  AccessDenied = "/acceso-denegado",
  SignIn = "/ingresar",
  Register = "/registro",
  Dashboard = "/dashboard",
  Subjects = "/dashboard/materias",
  Schedule = "/dashboard/horarios",
  ExamTables = "/dashboard/mesas",
  Profile = "/dashboard/profile",
  Admin = "/admin",
}

export const SYSTEMS_CAREER = "Ingeniería en Sistemas de Información"
export const ELECTRONICS_CAREER = "Ingeniería Electrónica"

export const SIGN_IN_ERROR = "Email o contraseña incorrectos."
const SIGN_IN_TIMEOUT_MS = 30_000

/** Picks an option of a Radix Select identified by its accessible name. */
export async function chooseOption(scope: Screen, comboboxName: string | RegExp, option: string | RegExp, screen: Screen = scope): Promise<void> {
  await scope.getByRole("combobox", comboboxName).tap()
  await screen.getByRole("option", option).tap()
}

/** The Sonner toaster region; toasts are matched inside it so page text never satisfies a toast assertion. */
export function toasts(browser: Browser): Locator {
  return browser.locator("[data-sonner-toaster]")
}

export async function expectToast(browser: Browser, text: string | RegExp): Promise<void> {
  await expect(toasts(browser).getByText(text, { exact: false }).first()).toBeVisible({ timeout: 15_000 })
}

export async function fillSignIn(screen: Screen, account: Pick<Account, "email" | "password">): Promise<void> {
  await screen.getByLabel("Email").fill(account.email)
  await screen.getByLabel("Contraseña").fill(account.password)
  await screen.getByRole("button", "Ingresar").tap()
}

export async function fillRegistration(screen: Screen, account: Account, confirmPassword = account.password): Promise<void> {
  await screen.getByLabel("Nombre").fill(account.name)
  await screen.getByLabel("Email").fill(account.email)
  await screen.getByLabel("Contraseña").fill(account.password)
  await screen.getByLabel("Repetí la contraseña").fill(confirmPassword)
  await screen.getByRole("button", "Crear cuenta").tap()
}

/** Chooses a career in the first-visit dialog when it is open. */
export async function chooseCareerIfAsked(screen: Screen, career: string): Promise<boolean> {
  const dialog = screen.getByRole("dialog", "Selecciona tu carrera")
  try {
    await dialog.waitFor({ timeout: 8_000 })
  } catch {
    return false
  }
  await chooseOption(dialog, "Carrera", career, screen)
  await dialog.getByRole("button", "Guardar").tap()
  await expect(dialog).toBeHidden()
  return true
}

type EnsureAccountOptions = { app: App; screen: Screen; browser: Browser; account: Account; promote?: boolean }

/**
 * Signs in with the persona's account, registering it first when it does not exist yet. A run split into several
 * invocations reuses the account, so registration (5 per hour per client) happens once per run id.
 */
export async function ensureSignedIn({ app, screen, browser, account, promote = false }: EnsureAccountOptions): Promise<void> {
  await app.open(AppRoute.SignIn)
  await fillSignIn(screen, account)
  const signedIn = await waitForDashboardOrError(screen, browser)
  if (!signedIn) {
    await app.open(AppRoute.Register)
    await fillRegistration(screen, account)
    await browser.waitForURL(/\/dashboard$/, { timeout: SIGN_IN_TIMEOUT_MS })
    if (promote) {
      await promoteToAdmin(account.email)
      // The role is read from the database on sign in, so start a fresh session.
      await app.clearState()
      await app.open(AppRoute.SignIn)
      await fillSignIn(screen, account)
      await browser.waitForURL(/\/dashboard$/, { timeout: SIGN_IN_TIMEOUT_MS })
    }
  }
  await chooseCareerIfAsked(screen, SYSTEMS_CAREER)
}

async function waitForDashboardOrError(screen: Screen, browser: Browser): Promise<boolean> {
  const deadline = Date.now() + SIGN_IN_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (/\/dashboard/.test(await browser.url())) return true
    if (await screen.getByText(SIGN_IN_ERROR).isVisible()) return false
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error("Sign in neither reached the dashboard nor showed an error")
}
