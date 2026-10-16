import type { Metadata } from "next"

/** Signed-in pages whose metadata lives here because their page component is a client component. */
export enum PrivatePage {
  Plan = "plan",
  Subjects = "subjects",
  Schedule = "schedule",
  ExamTables = "exam-tables",
  Profile = "profile",
  Admin = "admin",
}

/**
 * Title (rendered through the root template "%s · AdHorarium") and description of each signed-in page.
 * These pages are kept out of search engines by robots.txt; the metadata is for the browser tab, history and
 * bookmarks, so each title names what the page does.
 */
export const PRIVATE_PAGE_METADATA: Record<PrivatePage, Metadata & { title: string; description: string }> = {
  [PrivatePage.Plan]: {
    title: "Plan de correlativas",
    description: "Tu plan de estudios con correlativas: tocá una materia para ver qué necesitás para cursarla y qué te habilita.",
  },
  [PrivatePage.Subjects]: {
    title: "Mis materias",
    description: "Marcá el estado de tus materias, cargá tus notas y seguí tu avance en la carrera.",
  },
  [PrivatePage.Schedule]: {
    title: "Gestor de horarios",
    description: "Elegí las comisiones de tus materias, revisá superposiciones y exportá o compartí tu horario.",
  },
  [PrivatePage.ExamTables]: {
    title: "Buscador de mesa",
    description: "Buscá una materia y mirá en qué mesa de examen se rinde.",
  },
  [PrivatePage.Profile]: {
    title: "Mi perfil",
    description: "Tu carrera, tu promedio y tu avance académico en un solo lugar.",
  },
  [PrivatePage.Admin]: {
    title: "Administración",
    description: "Gestioná las materias, correlativas y comisiones con horarios de cada plan de estudios.",
  },
}
