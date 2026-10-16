import { z } from "zod"

/** bcrypt only uses the first 72 bytes of its input, so longer passwords are rejected instead of silently truncated. */
export const MAX_PASSWORD_BYTES = 72
export const MIN_PASSWORD_LENGTH = 10
const MAX_EMAIL_LENGTH = 254
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 80

const textEncoder = new TextEncoder()

export const emailSchema = z
  .string({ required_error: "Ingresá tu email" })
  .trim()
  .toLowerCase()
  .min(1, "Ingresá tu email")
  .max(MAX_EMAIL_LENGTH, "El email es demasiado largo")
  .email("Ingresá un email válido")

/** Password rules for new accounts. */
export const newPasswordSchema = z
  .string({ required_error: "Ingresá una contraseña" })
  .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
  .refine((password) => textEncoder.encode(password).length <= MAX_PASSWORD_BYTES, "La contraseña es demasiado larga")
  .refine((password) => /\p{L}/u.test(password) && /\d/.test(password), "La contraseña debe combinar letras y números")

/** Sign in only checks shape: strength rules belong to registration, not to login. */
export const signInInputSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Ingresá tu contraseña" })
    .min(1, "Ingresá tu contraseña")
    .refine((password) => textEncoder.encode(password).length <= MAX_PASSWORD_BYTES, "La contraseña es demasiado larga"),
})

export const registerInputSchema = z
  .object({
    name: z
      .string({ required_error: "Ingresá tu nombre" })
      .trim()
      .min(MIN_NAME_LENGTH, "Ingresá tu nombre")
      .max(MAX_NAME_LENGTH, "El nombre es demasiado largo"),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string({ required_error: "Repetí la contraseña" }),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type SignInInput = z.infer<typeof signInInputSchema>
export type RegisterInput = z.input<typeof registerInputSchema>
