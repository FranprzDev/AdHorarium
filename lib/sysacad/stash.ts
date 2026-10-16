import { SysacadFragmentKey } from "./types"

/**
 * The payload travels in the URL fragment, which a sign-in redirect drops. The import page moves it into
 * sessionStorage (this tab only, cleared when the tab closes) and removes it from the address bar.
 */
export const SYSACAD_STASH_KEY = "adhorarium.sysacad-import"

function hasPayload(fragment: string): boolean {
  const params = new URLSearchParams(fragment.replace(/^#/, ""))
  return params.has(SysacadFragmentKey.Plain) || params.has(SysacadFragmentKey.Deflated)
}

/** Moves a payload fragment from the current URL into sessionStorage. Returns true when there was one. */
export function stashFragmentFromLocation(): boolean {
  const { hash, pathname, search } = window.location
  if (!hasPayload(hash)) return false
  window.sessionStorage.setItem(SYSACAD_STASH_KEY, hash.replace(/^#/, ""))
  window.history.replaceState(null, "", `${pathname}${search}`)
  return true
}

export function readStashedFragment(): string | null {
  return window.sessionStorage.getItem(SYSACAD_STASH_KEY)
}

export function clearStashedFragment(): void {
  window.sessionStorage.removeItem(SYSACAD_STASH_KEY)
}
