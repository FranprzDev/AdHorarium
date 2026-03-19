'use client'

import { useState } from 'react'
import { Trash2, Edit2, Loader2, LinkIcon } from 'lucide-react'
import EditSubjectModal from './EditSubjectModal'
import CorrelativesModal from './CorrelativesModal'

interface Subject {
  id: number
  name: string
  career_id: number
  career_code: string
  career_name: string
}

interface SubjectsTableProps {
  subjects: Subject[]
  careers: any[]
  onSubjectUpdated: () => void
  onSubjectDeleted: () => void
}

export default function SubjectsTable({
  subjects,
  careers,
  onSubjectUpdated,
  onSubjectDeleted,
}: SubjectsTableProps) {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [correlativesSubject, setCorrelativesSubject] = useState<Subject | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta materia?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar materia')
      onSubjectDeleted()
    } catch (error) {
      alert('Error al eliminar materia')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Materia</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Carrera</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{subject.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{subject.career_name}</td>
                <td className="px-6 py-4 text-sm space-x-2 flex">
                  <button
                    onClick={() => setCorrelativesSubject(subject)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-green-600"
                    title="Gestionar correlativas"
                  >
                    <LinkIcon size={16} />
                  </button>
                  <button
                    onClick={() => setEditingSubject(subject)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    disabled={deletingId === subject.id}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-red-600 disabled:opacity-50"
                  >
                    {deletingId === subject.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          careers={careers}
          onClose={() => setEditingSubject(null)}
          onSubjectUpdated={() => {
            setEditingSubject(null)
            onSubjectUpdated()
          }}
        />
      )}

      {correlativesSubject && (
        <CorrelativesModal
          subject={correlativesSubject}
          subjects={subjects}
          onClose={() => setCorrelativesSubject(null)}
          onCorrelativesUpdated={onSubjectUpdated}
        />
      )}
    </>
  )
}
