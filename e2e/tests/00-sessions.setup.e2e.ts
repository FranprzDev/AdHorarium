import { test } from "@e2e-dev/web"
import { expect } from "e2e"
import { accountFor, adminAvailable, Persona } from "../support/env"
import { ensureSignedIn } from "../support/ui"

/*
 * One setup per persona, so a partial run (one file) only signs in the accounts it needs. Each setup registers its
 * account the first time a run id is used and signs in on later invocations of the same run.
 */

test.setup("student A signs in", { sessions: [Persona.StudentA] }, async ({ app, screen, browser, session }) => {
  await ensureSignedIn({ app, screen, browser, account: accountFor(Persona.StudentA) })
  await expect(screen.getByRole("navigation", "Secciones")).toBeVisible()
  await session.save(Persona.StudentA)
})

test.setup("student B signs in", { sessions: [Persona.StudentB] }, async ({ app, screen, browser, session }) => {
  await ensureSignedIn({ app, screen, browser, account: accountFor(Persona.StudentB) })
  await expect(screen.getByRole("navigation", "Secciones")).toBeVisible()
  await session.save(Persona.StudentB)
})

if (adminAvailable) {
  test.setup("admin signs in", { sessions: [Persona.Admin] }, async ({ app, screen, browser, session }) => {
    await ensureSignedIn({ app, screen, browser, account: accountFor(Persona.Admin), promote: true })
    await expect(screen.getByRole("link", "Administración")).toBeVisible()
    await session.save(Persona.Admin)
  })
}
