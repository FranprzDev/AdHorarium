import type { MetadataRoute } from "next"
import { PUBLIC_PATHS, SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []
  for (const path of PUBLIC_PATHS) {
    entries.push({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority: path === "/" ? 1 : 0.6 })
  }
  return entries
}
