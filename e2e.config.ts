import type { E2EConfig } from "e2e"
import { web } from "@e2e-dev/web"
import { baseUrl, isProduction } from "./e2e/support/env"

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

/**
 * End-to-end suite (TesterArmy e2e, web engine). Deterministic locators and assertions only: no agent steps, so no
 * model is needed. Runs serially because the tests share accounts and catalog rows and the app rate limits sign in,
 * registration, share links and the assistant per client.
 */
export default {
  tests: "e2e/tests/**/*.e2e.ts",
  targets: [
    {
      name: "web",
      engine: web({
        locale: "es-AR",
        timezoneId: "America/Argentina/Buenos_Aires",
        ...(bypassSecret ? { headers: { "x-vercel-protection-bypass": bypassSecret } } : {}),
      }),
      app: { url: baseUrl, identity: "adhorarium", environment: isProduction ? "production" : "staging" },
    },
  ],
  workers: 1,
  retries: 0,
  timeout: 120_000,
  actionTimeout: 20_000,
  assertionTimeout: 15_000,
  trace: "on",
  output: process.env.E2E_OUTPUT_DIR ?? ".e2e",
  reporters: ["list", "junit", "markdown"],
} satisfies E2EConfig
