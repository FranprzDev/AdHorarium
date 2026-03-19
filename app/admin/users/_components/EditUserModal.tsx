'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.enum(['user', 'admin']),
})

type EditUserValues = z.infer<typeof editUserSchema>

interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
}

interface EditUserModalProps {
  user: User
  onClose: () => void
  onUserUpdated: () => void
}

export default function EditUserModal({ user, onClose, onUserUpdated }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: user.full_name,
      role: user.role,
    },
  })

  const onSubmit = async (data: EditUserValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al actualizar usuario')

      onUserUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Editar Usuario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">El email no puede ser modificado</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
            <input
              {...register('full_name')}
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
            {errors.full_name && <p className="text-red-600 text-sm mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
