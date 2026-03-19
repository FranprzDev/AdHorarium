'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const editSubjectSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  career_id: z.string().min(1, 'Selecciona una carrera'),
})

type EditSubjectValues = z.infer<typeof editSubjectSchema>

interface Subject {
  id: number
  name: string
  career_id: number
}

interface EditSubjectModalProps {
  subject: Subject
  careers: any[]
  onClose: () => void
  onSubjectUpdated: () => void
}

export default function EditSubjectModal({
  subject,
  careers,
  onClose,
  onSubjectUpdated,
}: EditSubjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<EditSubjectValues>({
    resolver: zodResolver(editSubjectSchema),
    defaultValues: {
      name: subject.name,
      career_id: subject.career_id.toString(),
    },
  })

  const onSubmit = async (data: EditSubjectValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          career_id: parseInt(data.career_id),
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al actualizar materia')

      onSubjectUpdated()
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
          <h2 className="text-xl font-bold">Editar Materia</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Materia</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Carrera</label>
            <select
              {...register('career_id')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              {careers.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.name}
                </option>
              ))}
            </select>
            {errors.career_id && (
              <p className="text-red-600 text-sm mt-1">{errors.career_id.message}</p>
            )}
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
