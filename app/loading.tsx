"use client"

import { motion } from "framer-motion"
import { GraduationCap, BookOpen, Calendar, Search } from "lucide-react"

export default function Loading() {
  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const floatingIcons = [
    { icon: BookOpen, delay: 0, x: -20, y: -10 },
    { icon: Calendar, delay: 0.2, x: 20, y: 10 },
    { icon: Search, delay: 0.4, x: -15, y: 15 },
  ]

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
      
      <div className="relative z-10 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.div
            variants={iconVariants}
            className="relative inline-block"
          >
            <motion.div
              variants={pulseVariants}
              animate="pulse"
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30"
            />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full">
              <GraduationCap className="h-16 w-16 text-white" />
            </div>
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold gradient-text mb-4"
        >
          AdHorarium
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-purple-200 text-lg mb-8"
        >
          Cargando tu experiencia académica...
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center space-x-2 mb-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        <div className="relative">
          {floatingIcons.map(({ icon: Icon, delay, x, y }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 0.6, 
                scale: 1,
                x: [0, x, 0],
                y: [0, y, 0],
              }}
              transition={{
                opacity: { duration: 0.6, delay: delay + 0.8 },
                scale: { duration: 0.6, delay: delay + 0.8 },
                x: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + (index - 1) * 30}%`,
                top: `${50 + (index % 2 === 0 ? -20 : 20)}%`,
              }}
            >
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Icon className="h-6 w-6 text-purple-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center"
        >
          <p className="text-purple-300 text-sm">
            Preparando tus herramientas académicas
          </p>
        </motion.div>
      </div>
    </div>
  )
}
