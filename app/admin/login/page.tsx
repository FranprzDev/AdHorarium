"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthStore } from "@/stores/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()
  const { signInAdmin, isLoading } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSigningIn(true)

    try {
      const result = await signInAdmin(email, password)

      if (result.success) {
        router.push("/admin/dashboard")
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (error) {
      setError("Error inesperado al iniciar sesión")
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <AuroraBackground className="min-h-screen">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-purple-500/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20">
                  <Shield className="h-8 w-8 text-purple-300" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold gradient-text">Acceso Administrativo</CardTitle>
              <CardDescription className="text-purple-200">Ingresa tus credenciales de administrador</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-purple-300" />
                      ) : (
                        <Eye className="h-4 w-4 text-purple-300" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={isLoading || isSigningIn} className="w-full primary-button">
                  {isSigningIn ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/" className="text-purple-300 hover:text-white text-sm">
                  ← Volver al inicio
                </Link>
              </div>

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-xs text-center">
                  <strong>Credenciales de prueba:</strong>
                  <br />
                  Email: admin@example.com
                  <br />
                  Contraseña: fran123
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuroraBackground>
  )
}
