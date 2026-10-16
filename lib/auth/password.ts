import { compare, hash } from "bcryptjs"

/** bcrypt work factor for stored password hashes. */
export const BCRYPT_COST = 12

const TIMING_GUARD_INPUT = "adhorarium-timing-guard"

let timingGuardHash: Promise<string> | null = null

/** Hash compared against when the account does not exist or has no password, so both paths cost the same. */
function getTimingGuardHash(cost: number): Promise<string> {
  if (!timingGuardHash) timingGuardHash = hash(TIMING_GUARD_INPUT, cost)
  return timingGuardHash
}

export async function hashPassword(password: string, cost: number = BCRYPT_COST): Promise<string> {
  return hash(password, cost)
}

/**
 * Checks a password against a stored hash. A missing hash still runs a bcrypt comparison
 * so callers cannot tell "unknown account" from "wrong password" by response time.
 */
export async function verifyPassword(password: string, storedHash: string | null, cost: number = BCRYPT_COST): Promise<boolean> {
  if (storedHash === null) {
    await compare(password, await getTimingGuardHash(cost))
    return false
  }
  return compare(password, storedHash)
}
