"use server"

import { getDb } from "@/db/client"
import { applySysacadImport } from "@/db/queries/sysacad-import"
import { runAction, type ActionResult } from "@/lib/action-result"
import { requireUserId } from "@/lib/auth/session"
import type { SysacadImportSummary } from "@/lib/sysacad/plan"
import { sysacadImportInputSchema, type SysacadImportInput } from "@/lib/sysacad/validation"

/** Saves the subject states the student confirmed on /importar/sysacad. */
export async function importSysacadStatesAction(input: SysacadImportInput): Promise<ActionResult<SysacadImportSummary>> {
  return runAction(async () => {
    const userId = await requireUserId()
    return applySysacadImport(getDb(), userId, sysacadImportInputSchema.parse(input))
  })
}
