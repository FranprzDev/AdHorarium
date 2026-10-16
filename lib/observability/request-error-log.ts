import { LogEvent, LogLevel } from "@/types/enums"

/** Fields Next.js passes to `onRequestError` (instrumentation.ts) that are worth keeping in a log line. */
export type RequestErrorRequest = {
  path: string
  method: string
}

export type RequestErrorContext = {
  routerKind: string
  routePath: string
  routeType: string
  renderSource?: string
}

export type RequestErrorLogEntry = {
  level: LogLevel.Error
  event: LogEvent.RequestError
  digest: string | null
  name: string
  message: string
  method: string
  path: string
  routePath: string
  routeType: string
  routerKind: string
  renderSource: string | null
  stack: string | null
}

const MAX_STACK_LENGTH = 4000

function readDigest(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error)) return null
  return typeof error.digest === "string" ? error.digest : null
}

/** Drops the query string: it can hold tokens or emails and the route already identifies the page. */
function stripQuery(path: string): string {
  const queryStart = path.indexOf("?")
  return queryStart === -1 ? path : path.slice(0, queryStart)
}

/**
 * Builds one structured log line for a server error. The digest is the same "Código de referencia" the error page
 * shows, so a user's report can be matched to the Vercel runtime log.
 */
export function buildRequestErrorLog(error: unknown, request: RequestErrorRequest, context: RequestErrorContext): RequestErrorLogEntry {
  const isError = error instanceof Error
  return {
    level: LogLevel.Error,
    event: LogEvent.RequestError,
    digest: readDigest(error),
    name: isError ? error.name : "UnknownError",
    message: isError ? error.message : String(error),
    method: request.method,
    path: stripQuery(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource ?? null,
    stack: isError && error.stack ? error.stack.slice(0, MAX_STACK_LENGTH) : null,
  }
}
