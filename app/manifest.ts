import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdHorarium · Planificador académico UTN FRT",
    short_name: "AdHorarium",
    description: "Plan de correlativas, estado de materias, mesas de examen y promedio para estudiantes de la UTN FRT.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F8F5",
    theme_color: "#13294B",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  }
}
