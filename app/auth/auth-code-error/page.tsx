"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-card p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-red-600/20">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Error de Autenticación
        </h1>
        
        <p className="text-purple-200 mb-6">
          Hubo un problema al procesar tu solicitud de autenticación. 
          Por favor, intenta iniciar sesión nuevamente.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="primary-button w-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
          
          <p className="text-sm text-purple-300">
            Si el problema persiste, contacta al soporte técnico.
          </p>
        </div>
      </motion.div>
    </div>
  )
} 