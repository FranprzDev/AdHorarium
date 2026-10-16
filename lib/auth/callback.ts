/** Where a signed in user lands when no valid callback path was requested. */
export const DEFAULT_AFTER_SIGN_IN_PATH = "/dashboard"

/** Accepts only same-origin absolute paths, so a crafted `callbackUrl` cannot send the user to another site. */
export function safeCallbackPath(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return DEFAULT_AFTER_SIGN_IN_PATH
  }
  return candidate
}
