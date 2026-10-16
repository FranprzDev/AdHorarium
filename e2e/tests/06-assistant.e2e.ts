import { describe, test } from "@e2e-dev/web"
import { expect } from "e2e"
import { assistantEnabled, Persona } from "../support/env"
import { AppRoute } from "../support/ui"

const QUESTION = "¿Qué materias puedo cursar el próximo cuatrimestre?"
const ANSWER_TIMEOUT_MS = 90_000

/*
 * One question only: the assistant is rate limited (6 per minute per student) and every answer is a paid model call.
 * The answer is generated text, so the test checks that one arrives without an error, not what it says.
 */
describe("schedule assistant", { tags: ["assistant"], session: Persona.StudentA, skip: !assistantEnabled && "assistant runs against production or with E2E_ASSISTANT=1" }, () => {
  test("ASI-01 the assistant panel opens and answers a starter question", { timeout: 150_000 }, async ({ app, screen }) => {
    await app.open(AppRoute.Schedule)
    await screen.getByRole("button", "Asistente").tap()
    const panel = screen.getByRole("dialog", "Asistente de horarios")
    await expect(panel.getByText("Podés empezar con una de estas preguntas:")).toBeVisible()
    await panel.getByRole("button", QUESTION).tap()

    const conversation = panel.getByRole("log", "Conversación con el asistente")
    await expect(conversation.getByRole("listitem")).toHaveCount(2, { timeout: ANSWER_TIMEOUT_MS })
    await expect(panel.getByRole("button", "Enviar")).toBeVisible({ timeout: ANSWER_TIMEOUT_MS })
    const answer = (await conversation.getByRole("listitem").last().textContent()) ?? ""
    expect(answer.replace("Asistente:", "").trim().length).toBeGreaterThan(20)
    await expect(panel.getByRole("alert")).toBeHidden()
    await app.screenshot("asistente-respuesta")
  })
})
