import { z } from "zod"

const MAX_CONFIRMATION_LENGTH = 254

export const accountDeletionInputSchema = z.object({
  confirmation: z.string({ required_error: "Completá la confirmación" }).min(1, "Completá la confirmación").max(MAX_CONFIRMATION_LENGTH),
})

export type AccountDeletionInput = z.input<typeof accountDeletionInputSchema>
