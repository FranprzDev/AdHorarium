"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import { Button } from "@/components/ui/button"
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Search,
  ArrowRight,
  Github,
  Linkedin,
  LogIn,
  School,
  Clock,
  CheckCircle,
  Users,
  Sparkles,
  LayoutDashboard,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const { signIn, isLoading, user } = useAuthStore()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signIn("google")
    } catch (error) {
      console.error("Error signing in:", error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-violet-300" />,
      title: "Plan de Correlativas",
      description:
        "Visualiza y gestiona el plan de correlativas de tu carrera para planificar mejor tu recorrido académico.",
    },
    {
      icon: <Calendar className="h-8 w-8 text-violet-300" />,
      title: "Gestor de Horarios",
      description: "Crea y organiza tu horario de cursado de manera eficiente, evitando superposiciones.",
    },
    {
      icon: <Search className="h-8 w-8 text-violet-300" />,
      title: "Buscador de Mesa",
      description: "Encuentra rápidamente en qué mesa se rinde cada materia de tu carrera.",
    },
  ]

  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-violet-300" />,
      title: "Ahorra tiempo",
      description: "Organiza tu carrera de manera eficiente",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-violet-300" />,
      title: "Toma mejores decisiones",
      description: "Con información clara y accesible",
    },
    {
      icon: <Users className="h-6 w-6 text-violet-300" />,
      title: "Únete a la comunidad",
      description: "Comparte y aprende con otros estudiantes",
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <School className="h-8 w-8 text-purple-300" />
            <div className="text-2xl font-bold gradient-text">UTN FRT</div>
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
              {isSigningIn ? "Iniciando sesión..." : "Iniciar sesión con Google"}
            </Button>
          )}
        </header>

        {/* Hero section */}
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <GraduationCap className="h-16 w-16 text-purple-300" />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-bold gradient-text mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Gestiona tu carrera universitaria
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-purple-200 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Herramientas para estudiantes de ingeniería de la UTN FRT que te ayudarán a organizar tu carrera,
              gestionar horarios y encontrar información sobre mesas de examen.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={handleSignIn}
                disabled={isLoading || isSigningIn}
                className="primary-button text-lg px-8 py-6 flex items-center gap-2"
                size="lg"
              >
                {isSigningIn ? "Iniciando sesión..." : "Comenzar ahora"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/demo">
                <Button
                  variant="outline"
                  className="secondary-button text-lg px-8 py-6 flex items-center gap-2"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5" />
                  Ver demo
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Benefits section */}
        <motion.section className="py-16" variants={containerVariants} initial="hidden" animate="visible">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div key={index} variants={itemVariants} className="glass-card p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-purple-600/20">{benefit.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-purple-200">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features section */}
        <motion.section className="py-16" variants={containerVariants} initial="hidden" animate="visible">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Características principales</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} className="glass-card p-6" variants={itemVariants}>
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How it works section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Cómo funciona</h2>
          <div className="glass-card p-8 max-w-3xl mx-auto">
            <ol className="space-y-6">
              <motion.li
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Inicia sesión con Google</h3>
                  <p className="text-purple-200">
                    Accede fácilmente con tu cuenta de Google para comenzar a utilizar todas las herramientas.
                  </p>
                </div>
              </motion.li>
              <motion.li
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Selecciona tu carrera</h3>
                  <p className="text-purple-200">
                    Elige tu carrera para personalizar la información que verás en la plataforma.
                  </p>
                </div>
              </motion.li>
              <motion.li
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Explora las herramientas</h3>
                  <p className="text-purple-200">
                    Utiliza el plan de correlativas, gestor de horarios y buscador de mesa para organizar mejor tu
                    carrera universitaria.
                  </p>
                </div>
              </motion.li>
            </ol>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-purple-500/30 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-purple-200 mb-4 md:mb-0">
              © {new Date().getFullYear()} UTN FRT - Desarrollado por Francisco Perez
            </div>
            <div className="flex gap-4">
              <a
                href="https://github.com/franprzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/franprzdev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
