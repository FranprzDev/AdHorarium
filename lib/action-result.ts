import { ZodError } from "zod"
import { getErrorMessage } from "@/lib/errors"

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export function actionError(error: unknown): { ok: false; error: string } {
  if (error instanceof ZodError) return { ok: false, error: error.issues[0]?.message ?? "Datos inválidos" }
  return { ok: false, error: getErrorMessage(error) }
}

export async function runAction<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() }
  } catch (error) {
    console.error(error)
    return actionError(error)
  }
}
