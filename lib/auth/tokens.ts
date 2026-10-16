import { createHash, randomBytes } from "node:crypto"

const TOKEN_BYTES = 32

export type IssuedToken = {
  token: string
  tokenHash: string
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function issueToken(): IssuedToken {
  const token = randomBytes(TOKEN_BYTES).toString("base64url")
  return { token, tokenHash: hashToken(token) }
}
