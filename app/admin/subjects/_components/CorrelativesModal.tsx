'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Trash2, Plus } from 'lucide-react'

interface Subject {
  id: number
  name: string
  career_id: number
}

interface Correlative {
  id: number
  correlative_id: number
  correlation_type: 'must_approve' | 'must_take' | 'enables'
  correlative_name: string
}

interface CorrelativesModalProps {
  subject: Subject
  subjects: Subject[]
  onClose: () => void
  onCorrelativesUpdated: () => void
}

const CORRELATION_TYPES = {
  must_approve: 'Debe estar aprobada',
  must_take: 'Debe estar cursada',
  enables: 'Habilita',
}

export default function CorrelativesModal({
  subject,
  subjects,
  onClose,
  onCorrelativesUpdated,
}: CorrelativesModalProps) {
  const [correlatives, setCorrelatives] = useState<Correlative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCorrelative, setSelectedCorrelative] = useState('')
  const [selectedType, setSelectedType] = useState('must_approve')

  useEffect(() => {
    fetchCorrelatives()
  }, [])

  const fetchCorrelatives = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/admin/subjects/correlatives?subjectId=${subject.id}`)
      if (!res.ok) throw new Error('Error al cargar correlativas')
      const data = await res.json()
      setCorrelatives(data.correlatives)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCorrelative = async () => {
    if (!selectedCorrelative) {
      setError('Selecciona una materia')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/subjects/correlatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subject.id,
          correlative_id: parseInt(selectedCorrelative),
          correlation_type: selectedType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al agregar correlativa')
      }

      setSelectedCorrelative('')
      setSelectedType('must_approve')
      await fetchCorrelatives()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCorrelative = async (correlativeId: number) => {
    if (!confirm('¿Estás seguro?')) return

    try {
      const res = await fetch(
        `/api/admin/subjects/correlatives?id=${correlativeId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Error al eliminar correlativa')
      await fetchCorrelatives()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const availableSubjects = subjects.filter(
    (s) => s.id !== subject.id && !correlatives.some((c) => c.correlative_id === s.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Correlativas de {subject.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-semibold text-gray-700">Agregar Correlativa</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                  <select
                    value={selectedCorrelative}
                    onChange={(e) => setSelectedCorrelative(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 text-sm"
                  >
                    <option value="">Selecciona una materia</option>
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Correlativa</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 text-sm"
                  >
                    {Object.entries(CORRELATION_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddCorrelative}
                  disabled={isSaving || !selectedCorrelative}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Correlativas Actuales</h3>
                {correlatives.length === 0 ? (
                  <p className="text-sm text-gray-600">No hay correlativas configuradas</p>
                ) : (
                  <div className="space-y-2">
                    {correlatives.map((corr) => (
                      <div
                        key={corr.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{corr.correlative_name}</p>
                          <p className="text-xs text-gray-600">
                            {CORRELATION_TYPES[corr.correlation_type]}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCorrelative(corr.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
