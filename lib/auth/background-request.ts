/**
 * Headers Next.js adds to the client-side fetches a page makes in the background: server action calls, React Server
 * Component payloads and router prefetches. Document navigations never carry them.
 */
export enum BackgroundRequestHeader {
  ServerAction = "next-action",
  ReactServerComponent = "rsc",
  RouterPrefetch = "next-router-prefetch",
}

export function isBackgroundRequest(headers: Headers): boolean {
  for (const header of Object.values(BackgroundRequestHeader)) {
    if (headers.has(header)) return true
  }
  return false
}

/**
 * The Auth.js middleware re-issues the session cookie on every request it handles. A background request that was sent
 * before "Salir" and answered after the sign-out response would store that cookie again and keep the user signed in,
 * so background responses keep the access decision but drop the refreshed cookie. Document navigations still refresh it.
 */
export function withoutBackgroundSessionRefresh(requestHeaders: Headers, response: Response): Response {
  if (isBackgroundRequest(requestHeaders)) response.headers.delete("set-cookie")
  return response
}
