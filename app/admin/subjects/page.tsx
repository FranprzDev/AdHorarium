'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react'

interface Subject {
  id: string
  name: string
  career_id: string
  career_name: string
  career_code: string
}

interface Correlative {
  id: string
  subject_id: string
  correlative_id: string
  correlative_name: string
  correlation_type: 'must_approve' | 'must_take' | 'enables'
}

interface Career {
  id: string
  code: string
  name: string
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [correlatives, setCorrelatives] = useState<Correlative[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showCorrelativeForm, setShowCorrelativeForm] = useState(false)
  const [error, setError] = useState('')
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [subjectFormData, setSubjectFormData] = useState({ name: '', career_id: '' })
  const [correlativeFormData, setCorrelativeFormData] = useState({
    subject_id: '',
    correlative_id: '',
    correlation_type: 'must_approve' as const,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subjectsRes, correlativesRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/correlatives'),
      ])

      if (subjectsRes.ok && correlativesRes.ok) {
        const subjectsData = await subjectsRes.json()
        const correlativesData = await correlativesRes.json()
        setSubjects(subjectsData.subjects)
        setCorrelatives(correlativesData.correlatives)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCareers = async () => {
    try {
      const res = await fetch('/api/careers')
      if (res.ok) {
        const data = await res.json()
        setCareers(data.careers)
      }
    } catch (err) {
      console.error('Error fetching careers:', err)
    }
  }

  useEffect(() => {
    if (showSubjectForm && careers.length === 0) {
      fetchCareers()
    }
  }, [showSubjectForm, careers.length])

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!subjectFormData.name || !subjectFormData.career_id) {
      setError('Completa todos los campos')
      return
    }

    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectFormData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear materia')
        return
      }

      await fetchData()
      setSubjectFormData({ name: '', career_id: '' })
      setShowSubjectForm(false)
    } catch (err) {
      setError('Error al crear materia')
    }
  }

  const handleCreateCorrelative = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!correlativeFormData.subject_id || !correlativeFormData.correlative_id) {
      setError('Selecciona ambas materias')
      return
    }

    try {
      const res = await fetch('/api/admin/correlatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correlativeFormData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear correlativa')
        return
      }

      await fetchData()
      setCorrelativeFormData({
        subject_id: '',
        correlative_id: '',
        correlation_type: 'must_approve',
      })
      setShowCorrelativeForm(false)
    } catch (err) {
      setError('Error al crear correlativa')
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('¿Eliminar esta materia?')) return

    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Error al eliminar')
      }
    } catch (err) {
      setError('Error al eliminar materia')
    }
  }

  const handleDeleteCorrelative = async (id: string) => {
    if (!confirm('¿Eliminar esta correlativa?')) return

    try {
      const res = await fetch(`/api/admin/correlatives?correlativeId=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchData()
      } else {
        setError('Error al eliminar')
      }
    } catch (err) {
      setError('Error al eliminar correlativa')
    }
  }

  const getCorrelativesForSubject = (subjectId: string) => {
    return correlatives.filter((c) => c.subject_id === subjectId)
  }

  const correlationTypeLabel = {
    must_approve: 'Debe aprobarse',
    must_take: 'Debe cursarse',
    enables: 'Habilita',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Materias</h1>
          <p className="text-slate-400 mt-1">Gestiona materias y sus correlativas</p>
        </div>
        <button
          onClick={() => {
            setShowSubjectForm(!showSubjectForm)
            setShowCorrelativeForm(false)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva Materia
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
          {error}
        </div>
      )}

      {showSubjectForm && (
        <form onSubmit={handleCreateSubject} className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Nueva Materia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={subjectFormData.name}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
            <select
              value={subjectFormData.career_id}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, career_id: e.target.value })}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Selecciona carrera</option>
              {careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white font-medium"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowSubjectForm(false)}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-white font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {showCorrelativeForm && (
        <form onSubmit={handleCreateCorrelative} className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Nueva Correlativa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select
              value={correlativeFormData.subject_id}
              onChange={(e) =>
                setCorrelativeFormData({ ...correlativeFormData, subject_id: e.target.value })
              }
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Materia principal</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.career_code})
                </option>
              ))}
            </select>
            <select
              value={correlativeFormData.correlation_type}
              onChange={(e) =>
                setCorrelativeFormData({
                  ...correlativeFormData,
                  correlation_type: e.target.value as any,
                })
              }
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="must_approve">Debe aprobarse</option>
              <option value="must_take">Debe cursarse</option>
              <option value="enables">Habilita</option>
            </select>
            <select
              value={correlativeFormData.correlative_id}
              onChange={(e) =>
                setCorrelativeFormData({ ...correlativeFormData, correlative_id: e.target.value })
              }
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Materia correlativa</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.career_code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white font-medium"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowCorrelativeForm(false)}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-white font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando...</div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No hay materias</div>
        ) : (
          subjects.map((subject) => {
            const subjectCorrelatives = getCorrelativesForSubject(subject.id)
            const isExpanded = expandedSubject === subject.id

            return (
              <div
                key={subject.id}
                className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <button
                    onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-white">{subject.name}</p>
                      <p className="text-sm text-slate-400">
                        {subject.career_code} - {subject.career_name}
                      </p>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCorrelativeFormData({ ...correlativeFormData, subject_id: subject.id })
                        setShowCorrelativeForm(true)
                      }}
                      className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
                    >
                      + Correlativa
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {isExpanded && subjectCorrelatives.length > 0 && (
                  <div className="border-t border-slate-700/50 bg-slate-900/30 p-4">
                    <p className="text-sm font-semibold text-slate-300 mb-3">Correlativas:</p>
                    <div className="space-y-2">
                      {subjectCorrelatives.map((corr) => (
                        <div
                          key={corr.id}
                          className="flex items-center justify-between p-2 bg-slate-700/30 rounded border border-slate-600/30"
                        >
                          <div>
                            <p className="text-sm text-slate-300">{corr.correlative_name}</p>
                            <p className="text-xs text-slate-400">
                              {
                                correlationTypeLabel[
                                  corr.correlation_type as keyof typeof correlationTypeLabel
                                ]
                              }
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCorrelative(corr.id)}
                            className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
