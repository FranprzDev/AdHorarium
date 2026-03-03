"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/useAuthStore"
import { LogIn, UserPlus, Eye, EyeOff, School } from "lucide-react"

// -------- Schemas --------
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

const registerSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

// -------- Google Button --------
function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-950/40 text-white hover:bg-violet-800/40 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continuar con Google
    </button>
  )
}

// -------- Divider --------
function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-violet-500/30" />
      <span className="text-violet-400 text-xs">o</span>
      <div className="flex-1 h-px bg-violet-500/30" />
    </div>
  )
}

// -------- Login Tab --------
function LoginTab({ onSuccess }: { onSuccess: () => void }) {
  const { signInWithPassword, signInWithGoogle, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginValues) => {
    clearError()
    await signInWithPassword(values.email, values.password)
    const user = useAuthStore.getState().user
    if (user) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <GoogleButton onClick={signInWithGoogle} disabled={isLoading} />
      <Divider />

      <div className="space-y-1">
        <Label htmlFor="login-email" className="text-violet-200 text-sm">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          className="glass-input"
          {...register("email")}
        />
        {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="login-password" className="text-violet-200 text-sm">Contraseña</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            className="glass-input pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-200 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full primary-button py-6 text-base font-semibold"
      >
        <LogIn className="h-4 w-4 mr-2" />
        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  )
}

// -------- Register Tab --------
function RegisterTab({ onSuccess }: { onSuccess: () => void }) {
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterValues) => {
    clearError()
    await signUp(values.email, values.password, values.full_name)
    const user = useAuthStore.getState().user
    if (user) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <GoogleButton onClick={signInWithGoogle} disabled={isLoading} />
      <Divider />

      <div className="space-y-1">
        <Label htmlFor="reg-name" className="text-violet-200 text-sm">Nombre completo</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Juan García"
          autoComplete="name"
          className="glass-input"
          {...register("full_name")}
        />
        {errors.full_name && <p className="text-red-400 text-xs">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="reg-email" className="text-violet-200 text-sm">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          className="glass-input"
          {...register("email")}
        />
        {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="reg-password" className="text-violet-200 text-sm">Contraseña</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            className="glass-input pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-200 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="reg-confirm" className="text-violet-200 text-sm">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="Repetí tu contraseña"
            autoComplete="new-password"
            className="glass-input pr-10"
            {...register("confirm_password")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-200 transition-colors"
            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirm_password && <p className="text-red-400 text-xs">{errors.confirm_password.message}</p>}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full primary-button py-6 text-base font-semibold"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {isLoading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  )
}

// -------- Main Modal --------
interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "login" | "register"
}

export function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const { clearError } = useAuthStore()

  const handleSuccess = () => {
    onOpenChange(false)
  }

  const handleTabChange = () => {
    clearError()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-violet-950/95 border border-violet-500/30 backdrop-blur-xl shadow-2xl shadow-violet-900/50 p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-violet-500/20">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-r from-violet-600 to-pink-600 p-2 rounded-full">
                <School className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">AdHorarium</DialogTitle>
            </div>
            <p className="text-violet-300 text-sm">UTN FRT — Plataforma académica</p>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-6">
          <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
            <TabsList className="w-full bg-violet-900/50 border border-violet-500/20 mt-4 mb-2 p-1">
              <TabsTrigger
                value="login"
                className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-violet-300 transition-colors"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-violet-300 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Crear cuenta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginTab onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterTab onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
