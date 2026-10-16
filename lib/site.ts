/** Canonical production origin, used for absolute URLs in metadata, robots.txt and the sitemap. */
export const SITE_URL = "https://adhorarium.vercel.app"

/** Public, indexable pages. Everything behind sign in, the API and shared timetables stay out of search engines. */
export const PUBLIC_PATHS = ["/", "/careers", "/demo", "/privacidad", "/ingresar", "/registro"]

export const PRIVATE_PATH_PREFIXES = ["/dashboard", "/admin", "/api/", "/horarios/", "/acceso-denegado"]
