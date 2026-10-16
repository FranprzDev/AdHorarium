import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda AdHorarium, para qué los usa y cómo pedir su eliminación.",
}

const LAST_UPDATED = "16 de octubre de 2026"
const CONTACT_EMAIL = "franciscoperezdeveloper@gmail.com"
const REPOSITORY_ISSUES_URL = "https://github.com/FranprzDev/AdHorarium/issues"

type PolicySection = {
  title: string
  paragraphs: string[]
  items?: string[]
}

const SECTIONS: PolicySection[] = [
  {
    title: "Quién es responsable",
    paragraphs: [
      "AdHorarium es un proyecto académico de código abierto para estudiantes de ingeniería de la UTN Facultad Regional Tucumán, desarrollado por Francisco Miguel Perez. No es un servicio oficial de la universidad.",
    ],
  },
  {
    title: "Qué datos guardamos",
    paragraphs: ["Cuando creás tu cuenta o iniciás sesión guardamos únicamente:"],
    items: [
      "Tu nombre y tu dirección de correo electrónico.",
      "Si te registrás con email y contraseña, un hash de tu contraseña (bcrypt): nunca guardamos ni registramos la contraseña en texto plano.",
      "Si ingresás con Google, la URL de tu foto de perfil, el identificador de tu cuenta de Google y los datos técnicos del inicio de sesión que Google devuelve, necesarios para vincular tu cuenta.",
      "La carrera que elegís dentro de la aplicación.",
      "El estado de cada materia que cargás (no cursada, cursando, regular o promocionada) y las notas que ingresás.",
      "Tu rol en la aplicación (estudiante o administrador).",
    ],
  },
  {
    title: "Para qué los usamos",
    paragraphs: [
      "Usamos estos datos solo para que puedas iniciar sesión y para mostrarte tu progreso académico: el plan de correlativas con el estado de tus materias, las materias que podés cursar, tu promedio y su equivalencia GPA. No los usamos con fines publicitarios ni para elaborar perfiles.",
      "La sesión se mantiene con una cookie propia de inicio de sesión. No usamos cookies de publicidad ni de seguimiento.",
      "Para saber qué páginas se usan y qué tan rápido cargan usamos Vercel Web Analytics y Speed Insights, que no usan cookies ni guardan datos que te identifiquen: solo registran la página visitada (sin parámetros de la URL ni el código de los horarios compartidos), la ubicación aproximada (país y ciudad), el navegador, el tipo de dispositivo y métricas de rendimiento, de forma agregada.",
    ],
  },
  {
    title: "Con quién los compartimos",
    paragraphs: [
      "No vendemos ni compartimos tus datos con terceros. Los datos se alojan en los proveedores de infraestructura que hacen funcionar el sitio: Vercel (alojamiento de la aplicación) y Neon (base de datos PostgreSQL). Google interviene solo si elegís ingresar con tu cuenta de Google.",
    ],
  },
  {
    title: "Cómo pedir la eliminación",
    paragraphs: [
      `Podés pedir que eliminemos tu cuenta y todos tus datos (incluidos los estados y notas de tus materias) abriendo un issue en el repositorio del proyecto o escribiendo a ${CONTACT_EMAIL}. También podés pedir una copia de tus datos o su corrección por los mismos medios.`,
    ],
  },
  {
    title: "Cambios en esta política",
    paragraphs: ["Si esta política cambia, publicaremos la nueva versión en esta misma página con su fecha de actualización."],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link href="/" className="mb-8 inline-flex min-h-6 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <p className="eyebrow mb-3">AdHorarium</p>
        <h1 className="mb-3 font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Política de privacidad</h1>
        <p className="mb-10 text-sm text-muted-foreground">Última actualización: {LAST_UPDATED}</p>
        <div className="surface-card space-y-10 p-6 md:p-10">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-serif text-2xl font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Correo:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline underline-offset-4 hover:text-foreground">
                {CONTACT_EMAIL}
              </a>
              <br />
              Issues del repositorio:{" "}
              <a href={REPOSITORY_ISSUES_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-foreground">
                github.com/FranprzDev/AdHorarium/issues
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
