'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import SubjectsTable from './_components/SubjectsTable'
import CreateSubjectModal from './_components/CreateSubjectModal'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [careers, setCareers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchSubjects(), fetchCareers()])
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/subjects')
      if (!res.ok) throw new Error('Error al cargar materias')
      const data = await res.json()
      setSubjects(data.subjects)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchCareers = async () => {
    try {
      const res = await fetch('/api/careers')
      if (!res.ok) throw new Error('Error al cargar carreras')
      const data = await res.json()
      setCareers(data.careers)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubjectCreated = () => {
    setIsModalOpen(false)
    fetchSubjects()
  }

  const handleSubjectUpdated = () => {
    fetchSubjects()
  }

  const handleSubjectDeleted = () => {
    fetchSubjects()
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Materias</h1>
            <p className="text-gray-600 mt-1">Crea, edita y configura las materias y sus correlativas</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            <Plus size={20} />
            Crear Materia
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-violet-600" />
          </div>
        ) : (
          <SubjectsTable
            subjects={subjects}
            careers={careers}
            onSubjectUpdated={handleSubjectUpdated}
            onSubjectDeleted={handleSubjectDeleted}
          />
        )}
      </div>

      {isModalOpen && (
        <CreateSubjectModal
          careers={careers}
          onClose={() => setIsModalOpen(false)}
          onSubjectCreated={handleSubjectCreated}
        />
      )}
    </div>
  )
}
