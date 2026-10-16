import type { Instrumentation } from "next"
import { buildRequestErrorLog } from "@/lib/observability/request-error-log"

/**
 * Runs on the server for every uncaught error in a page, route handler, server action or middleware. One JSON line per
 * error on stderr: Vercel stores it in the project's Runtime Logs (free on Hobby), searchable by the digest the error
 * page shows to the user.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  console.error(JSON.stringify(buildRequestErrorLog(error, request, context)))
}
