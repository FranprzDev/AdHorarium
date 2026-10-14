import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de privacidad - AdHorarium",
  description: "Qué datos guarda AdHorarium, para qué los usa y cómo pedir su eliminación.",
}

const LAST_UPDATED = "14 de octubre de 2026"
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
    paragraphs: ["Cuando iniciás sesión con Google guardamos únicamente:"],
    items: [
      "Tu nombre, tu dirección de correo electrónico y la URL de tu foto de perfil, tal como los entrega Google.",
      "El identificador de tu cuenta de Google y los datos técnicos del inicio de sesión que Google devuelve, necesarios para vincular tu cuenta.",
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
    ],
  },
  {
    title: "Con quién los compartimos",
    paragraphs: [
      "No vendemos ni compartimos tus datos con terceros. Los datos se alojan en los proveedores de infraestructura que hacen funcionar el sitio: Vercel (alojamiento de la aplicación) y Neon (base de datos PostgreSQL). Google interviene solo en el inicio de sesión.",
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
    <div className="min-h-screen gradient-bg">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Política de privacidad</h1>
        <p className="text-purple-300 mb-10">Última actualización: {LAST_UPDATED}</p>
        <div className="glass-card p-8 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-purple-200 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="list-disc pl-6 space-y-2 text-purple-200">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Contacto</h2>
            <p className="text-purple-200 leading-relaxed">
              Correo:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-white">
                {CONTACT_EMAIL}
              </a>
              <br />
              Issues del repositorio:{" "}
              <a href={REPOSITORY_ISSUES_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                github.com/FranprzDev/AdHorarium/issues
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
