/** Where a signed in user lands when no valid callback path was requested. */
export const DEFAULT_AFTER_SIGN_IN_PATH = "/dashboard"

const PARSE_BASE = "http://callback.invalid"

/**
 * Turns a `callbackUrl` into a same-site path. Relative paths are kept; absolute URLs (Auth.js
 * middleware sends them, e.g. `https://adhorarium.vercel.app/admin`) are kept only when their host is
 * `currentHost`. Anything else falls back to the dashboard, so a crafted link cannot leave the site.
 */
export function safeCallbackPath(candidate: string | null | undefined, currentHost: string | null): string {
  if (!candidate || candidate.startsWith("//") || candidate.startsWith("/\\")) return DEFAULT_AFTER_SIGN_IN_PATH
  if (candidate.startsWith("/")) return candidate

  let url: URL
  try {
    url = new URL(candidate, PARSE_BASE)
  } catch {
    return DEFAULT_AFTER_SIGN_IN_PATH
  }
  const isWebUrl = url.protocol === "https:" || url.protocol === "http:"
  if (!isWebUrl || !currentHost || url.host !== currentHost) return DEFAULT_AFTER_SIGN_IN_PATH
  return `${url.pathname}${url.search}${url.hash}`
}
