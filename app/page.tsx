"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Search,
  ArrowRight,
  Github,
  LogIn,
  School,
  Clock,
  CheckCircle,
  Users,
  Sparkles,
  LayoutDashboard,
  Target,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Quote,
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
      title: "Plan de Correlativas Inteligente",
      description: "Visualiza y gestiona el plan de correlativas de tu carrera con un sistema inteligente que te sugiere el mejor camino académico.",
      benefits: ["Visualización interactiva", "Sugerencias personalizadas", "Seguimiento de progreso"]
    },
    {
      icon: <Calendar className="h-8 w-8 text-violet-300" />,
      title: "Gestor de Horarios Avanzado",
      description: "Crea y organiza tu horario de cursado con detección automática de conflictos y optimización de tiempos libres.",
      benefits: ["Detección de conflictos", "Optimización automática", "Sincronización multiplataforma"]
    },
    {
      icon: <Search className="h-8 w-8 text-violet-300" />,
      title: "Buscador de Mesa Inteligente",
      description: "Encuentra rápidamente información sobre mesas de examen con filtros avanzados y notificaciones automáticas.",
      benefits: ["Búsqueda instantánea", "Filtros avanzados", "Notificaciones personalizadas"]
    },
  ]

  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-violet-300" />,
      title: "Ahorra tiempo valioso",
      description: "Automatiza la planificación académica y optimiza tu tiempo de estudio"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-violet-300" />,
      title: "Mejora tu rendimiento",
      description: "Organización eficiente que se traduce en mejores resultados académicos"
    },
    {
      icon: <Users className="h-6 w-6 text-violet-300" />,
      title: "Únete a la comunidad",
      description: "Conecta con otros estudiantes y comparte experiencias académicas"
    },
  ]

  const testimonials = [
    {
      name: "María González",
      career: "Ingeniería en Sistemas",
      year: "4to año",
      content: "AdHorarium me ayudó a organizar mi carrera de manera increíble. Ahora puedo planificar mis materias sin conflictos y optimizar mi tiempo de estudio.",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      career: "Ingeniería Civil",
      year: "3er año",
      content: "La función de correlativas es genial. Me permite ver exactamente qué materias puedo cursar y cuáles son mis prioridades para avanzar más rápido.",
      rating: 5
    },
    {
      name: "Ana Martínez",
      career: "Ingeniería Química",
      year: "5to año",
      content: "El buscador de mesa me salvó muchas veces. Ya no tengo que buscar en mil lugares para saber cuándo y dónde rendir mis finales.",
      rating: 5
    }
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
                organizada y optimizada
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-purple-200 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <strong>AdHorarium</strong> es la plataforma definitiva para estudiantes de ingeniería de la UTN FRT. 
              Gestiona correlativas, optimiza horarios y encuentra información de mesas con inteligencia artificial.
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
            <h2 className="text-4xl font-bold gradient-text text-center mb-4">¿Por qué elegir AdHorarium?</h2>
            <p className="text-xl text-purple-200 text-center mb-16 max-w-3xl mx-auto">
              Más que una herramienta, es tu compañero académico inteligente
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
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
            <h2 className="text-4xl font-bold gradient-text text-center mb-4">Características que marcan la diferencia</h2>
            <p className="text-xl text-purple-200 text-center mb-16 max-w-3xl mx-auto">
              Herramientas diseñadas específicamente para estudiantes de ingeniería
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
            <h2 className="text-4xl font-bold gradient-text text-center mb-4">Lo que dicen nuestros estudiantes</h2>
            <p className="text-xl text-purple-200 text-center mb-16 max-w-3xl mx-auto">
              Testimonios reales de estudiantes que transformaron su experiencia académica
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="h-full"
                >
                  <Card className="glass-card p-6 h-full flex flex-col">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <Quote className="h-8 w-8 text-purple-400 mr-3" />
                        <div className="flex">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-purple-200 mb-6 italic leading-relaxed flex-1">"{testimonial.content}"</p>
                      <div className="border-t border-purple-400/20 pt-4">
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-purple-300 text-sm">{testimonial.career}</div>
                        <div className="text-purple-400 text-xs">{testimonial.year}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold gradient-text text-center mb-16">Cómo funciona AdHorarium</h2>
            <div className="glass-card p-12 max-w-4xl mx-auto">
              <div className="space-y-12">
                {[
                  {
                    step: 1,
                    title: "Inicia sesión de forma segura",
                    description: "Accede con tu cuenta de Google de forma rápida y segura. Tu privacidad está protegida con los más altos estándares de seguridad.",
                    icon: <Shield className="h-8 w-8 text-green-400" />
                  },
                  {
                    step: 2,
                    title: "Configura tu perfil académico",
                    description: "Selecciona tu carrera y año de cursado. AdHorarium se adapta automáticamente a tu plan de estudios específico.",
                    icon: <Target className="h-8 w-8 text-blue-400" />
                  },
                  {
                    step: 3,
                    title: "Explora las herramientas inteligentes",
                    description: "Utiliza el plan de correlativas, gestor de horarios y buscador de mesa. Cada herramienta está optimizada para tu éxito académico.",
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
