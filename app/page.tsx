"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Github,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Network,
  Search,
  Settings,
  Shield,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/brand/theme-toggle"
import { PlanPreview } from "@/components/brand/plan-preview"

const REPOSITORY_URL = "https://github.com/FranprzDev/AdHorarium"

const FEATURES = [
  {
    icon: BookOpen,
    title: "Plan de correlativas",
    description:
      "Consultá el plan de estudios de cada ingeniería con sus correlativas para cursar y para rendir. Los planes se pueden ver sin iniciar sesión.",
    benefits: ["Planes públicos por carrera", "Correlativas regulares y aprobadas", "Materias ordenadas por nivel"],
  },
  {
    icon: GraduationCap,
    title: "Estado de tus materias",
    description:
      "Marcá cada materia como no cursada, cursando, regular o promocionada y cargá la nota de las que promocionaste.",
    benefits: ["Progreso guardado en tu cuenta", "Notas de 1 a 10", "Filtro por ciencias básicas y materias de carrera"],
  },
  {
    icon: Network,
    title: "Grafo de correlativas",
    description: "Elegí una materia y mirá qué necesitás para cursarla y qué materias te habilita.",
    benefits: ["Requisitos de cada materia", "Materias que habilita", "Vista por nivel"],
  },
  {
    icon: Search,
    title: "Buscador de mesa",
    description: "Encontrá en qué mesa de examen (Mesa I, II o III) se rinde cada materia de tu carrera.",
    benefits: ["Materias agrupadas por mesa", "Búsqueda por carrera"],
  },
  {
    icon: TrendingUp,
    title: "Promedio y conversión GPA",
    description:
      "Calculá tu promedio con las notas que cargaste y su equivalencia aproximada en la escala GPA de 0 a 4.",
    benefits: ["Promedio de materias promocionadas", "Tabla de equivalencias GPA"],
  },
  {
    icon: Calendar,
    title: "Horarios (en desarrollo)",
    description:
      "Una primera versión para seleccionar las materias de cada nivel que querés cursar. Todavía no arma ni compara horarios.",
    benefits: ["Selección de materias por nivel"],
  },
]

const FACTS = [
  {
    icon: Shield,
    title: "Cuenta con email y contraseña",
    description:
      "Creás tu cuenta de estudiante con tu email y una contraseña que guardamos cifrada. Qué datos guardamos y para qué está detallado en la política de privacidad.",
  },
  {
    icon: Settings,
    title: "Planes mantenidos por administradores",
    description:
      "Las materias y correlativas se cargan desde los planes oficiales y los administradores las corrigen desde un panel propio.",
  },
  {
    icon: Github,
    title: "Código abierto",
    description: "El código está publicado en GitHub. Si encontrás un error en un plan o en la app, podés reportarlo ahí.",
  },
]

const STEPS = [
  {
    title: "Creá tu cuenta",
    description: "Registrate con tu email y una contraseña, o ingresá con la cuenta que ya tenés.",
  },
  {
    title: "Elegí tu carrera",
    description: "Seleccioná tu carrera para ver su plan de estudios y empezar a cargar el estado de tus materias.",
  },
  {
    title: "Usá las herramientas",
    description:
      "Marcá tus materias, revisá qué te falta para cursar cada una, buscá tu mesa de examen y mirá tu promedio.",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isLoading = status === "loading"

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="AdHorarium, inicio">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <Link
              href="/careers"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Planes de estudio
            </Link>
            <Link
              href="/demo"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Demo
            </Link>
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/ingresar">
                  <LogIn className="h-4 w-4" />
                  Iniciar sesión
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/70">
          <div className="grid-paper pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="eyebrow">UTN · Facultad Regional Tucumán</p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Tu carrera universitaria, <span className="text-brand-strong">en un solo lugar</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">AdHorarium</strong> es una herramienta para estudiantes de
                ingeniería de la UTN FRT: consultá el plan de correlativas, registrá el estado y las notas de tus materias y
                averiguá en qué mesa se rinde cada una.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 px-6 text-base">
                  <Link href="/registro">
                    <UserPlus className="h-4 w-4" />
                    Comenzar gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 bg-card px-6 text-base">
                  <Link href="/careers">
                    <BookOpen className="h-4 w-4" />
                    Ver planes de estudio
                  </Link>
                </Button>
              </div>
            </div>
            <PlanPreview className="hidden sm:block" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading title="Qué es AdHorarium" subtitle="Un proyecto hecho por estudiantes para estudiantes de ingeniería de la UTN FRT" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FACTS.map((fact) => (
              <article key={fact.title} className="surface-card p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <fact.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{fact.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{fact.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/70 bg-card/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading title="Lo que podés hacer hoy" subtitle="Estas son las herramientas que ya funcionan en la app" />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="surface-card flex h-full flex-col p-6">
                  <feature.icon className="h-6 w-6 text-brand-strong" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  <ul className="mt-5 space-y-2 border-t border-border pt-4">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading title="Cómo funciona AdHorarium" />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="surface-card p-6">
                <span className="font-serif text-4xl font-semibold text-brand-strong">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Logo />
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} · Plataforma académica para UTN FRT</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <Link href="/privacidad" className="transition-colors hover:text-foreground">
              Política de privacidad
            </Link>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              Código abierto en GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
