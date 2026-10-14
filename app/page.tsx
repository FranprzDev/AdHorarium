"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { AuthProvider } from "@/types/enums"
import { Button } from "@/components/ui/button"
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Search,
  ArrowRight,
  Github,
  LogIn,
  School,
  CheckCircle,
  LayoutDashboard,
  Network,
  Settings,
  Target,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isLoading = status === "loading"
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signIn(AuthProvider.Google, { redirectTo: "/dashboard" })
    } catch (error) {
      console.error("Error signing in:", error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-violet-300" />,
      title: "Plan de correlativas",
      description: "Consultá el plan de estudios de cada ingeniería con sus correlativas para cursar y para rendir. Los planes se pueden ver sin iniciar sesión.",
      benefits: ["Planes públicos por carrera", "Correlativas regulares y aprobadas", "Materias ordenadas por nivel"],
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-violet-300" />,
      title: "Estado de tus materias",
      description: "Marcá cada materia como no cursada, cursando, regular o promocionada y cargá la nota de las que promocionaste.",
      benefits: ["Progreso guardado en tu cuenta", "Notas de 1 a 10", "Filtro por ciencias básicas y materias de carrera"],
    },
    {
      icon: <Network className="h-8 w-8 text-violet-300" />,
      title: "Grafo de correlativas",
      description: "Elegí una materia y mirá qué necesitás para cursarla y qué materias te habilita.",
      benefits: ["Requisitos de cada materia", "Materias que habilita", "Vista por nivel"],
    },
    {
      icon: <Search className="h-8 w-8 text-violet-300" />,
      title: "Buscador de mesa",
      description: "Encontrá en qué mesa de examen (Mesa I, II o III) se rinde cada materia de tu carrera.",
      benefits: ["Materias agrupadas por mesa", "Búsqueda por carrera"],
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-violet-300" />,
      title: "Promedio y conversión GPA",
      description: "Calculá tu promedio con las notas que cargaste y su equivalencia aproximada en la escala GPA de 0 a 4.",
      benefits: ["Promedio de materias promocionadas", "Tabla de equivalencias GPA"],
    },
    {
      icon: <Calendar className="h-8 w-8 text-violet-300" />,
      title: "Horarios (en desarrollo)",
      description: "Una primera versión para seleccionar las materias de cada nivel que querés cursar. Todavía no arma ni compara horarios.",
      benefits: ["Selección de materias por nivel"],
    },
  ]

  const facts = [
    {
      icon: <Shield className="h-6 w-6 text-violet-300" />,
      title: "Ingreso con Google",
      description: "Iniciás sesión con tu cuenta de Google. Qué datos guardamos y para qué está detallado en la política de privacidad.",
    },
    {
      icon: <Settings className="h-6 w-6 text-violet-300" />,
      title: "Planes mantenidos por administradores",
      description: "Las materias y correlativas se cargan desde los planes oficiales y los administradores las corrigen desde un panel propio.",
    },
    {
      icon: <Github className="h-6 w-6 text-violet-300" />,
      title: "Código abierto",
      description: "El código está publicado en GitHub. Si encontrás un error en un plan o en la app, podés reportarlo ahí.",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex justify-between items-center py-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-50" />
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
                <School className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold gradient-text">AdHorarium</div>
            <div className="hidden md:block text-sm text-purple-300 ml-2">UTN FRT</div>
          </div>
          {user ? (
            <Link href="/dashboard">
              <Button className="primary-button flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleSignIn}
              disabled={isLoading || isSigningIn}
              className="primary-button flex items-center gap-2"
            >
              <LogIn className="h-5 w-5" />
              {isSigningIn ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          )}
        </header>

        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-full">
                  <GraduationCap className="h-20 w-20 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.h1
              className="text-5xl md:text-7xl font-bold gradient-text mb-6"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Tu carrera universitaria,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
                en un solo lugar
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-purple-200 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <strong>AdHorarium</strong> es una herramienta para estudiantes de ingeniería de la UTN FRT: consultá el plan
              de correlativas, registrá el estado y las notas de tus materias y averiguá en qué mesa se rinde cada una.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Button
                onClick={handleSignIn}
                disabled={isLoading || isSigningIn}
                className="primary-button text-xl px-10 py-8 flex items-center gap-3 shadow-2xl shadow-purple-500/25"
                size="lg"
              >
                {isSigningIn ? "Iniciando sesión..." : "Comenzar gratis"}
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Link href="/careers">
                <Button
                  variant="outline"
                  className="secondary-button text-xl px-10 py-8 flex items-center gap-3"
                  size="lg"
                >
                  <BookOpen className="h-6 w-6" />
                  Ver planes de estudio
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <motion.section className="py-20" variants={containerVariants} initial="hidden" animate="visible">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold gradient-text text-center mb-4">Qué es AdHorarium</h2>
            <p className="text-xl text-purple-200 text-center mb-16 max-w-3xl mx-auto">
              Un proyecto hecho por estudiantes para estudiantes de ingeniería de la UTN FRT
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {facts.map((benefit, index) => (
                <motion.div key={index} variants={itemVariants} className="glass-card p-8 text-center group hover:scale-105 transition-transform duration-300 h-full flex flex-col">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-colors">
                      {benefit.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-purple-200 flex-1">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="py-20" variants={containerVariants} initial="hidden" animate="visible">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold gradient-text text-center mb-4">Lo que podés hacer hoy</h2>
            <p className="text-xl text-purple-200 text-center mb-16 max-w-3xl mx-auto">
              Estas son las herramientas que ya funcionan en la app
            </p>
            <div className="grid lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div key={index} className="glass-card p-8 group hover:scale-105 transition-all duration-300 h-full flex flex-col" variants={itemVariants}>
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-purple-200 mb-6 leading-relaxed flex-1">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-purple-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold gradient-text text-center mb-16">Cómo funciona AdHorarium</h2>
            <div className="glass-card p-12 max-w-4xl mx-auto">
              <div className="space-y-12">
                {[
                  {
                    step: 1,
                    title: "Inicia sesión de forma segura",
                    description: "Ingresá con tu cuenta de Google. No hace falta crear una contraseña nueva.",
                    icon: <Shield className="h-8 w-8 text-green-400" />
                  },
                  {
                    step: 2,
                    title: "Elegí tu carrera",
                    description: "Seleccioná tu carrera para ver su plan de estudios y empezar a cargar el estado de tus materias.",
                    icon: <Target className="h-8 w-8 text-blue-400" />
                  },
                  {
                    step: 3,
                    title: "Usá las herramientas",
                    description: "Marcá tus materias, revisá qué te falta para cursar cada una, buscá tu mesa de examen y mirá tu promedio.",
                    icon: <Zap className="h-8 w-8 text-purple-400" />
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-6 items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {item.icon}
                        <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                      </div>
                      <p className="text-purple-200 text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-purple-500/30 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3 mb-6 md:mb-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-50" />
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
                    <School className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold gradient-text">AdHorarium</div>
                  <div className="text-purple-300 text-sm">© {new Date().getFullYear()} - Plataforma académica para UTN FRT</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/privacidad" className="text-purple-200 hover:text-white transition-colors text-sm">
                  Política de privacidad
                </Link>
                <div className="text-purple-200 text-sm">Código abierto:</div>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/FranprzDev/AdHorarium"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-200 hover:text-white transition-colors p-2 rounded-full hover:bg-purple-600/20"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
