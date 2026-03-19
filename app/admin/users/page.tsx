'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import UsersTable from './_components/UsersTable'
import CreateUserModal from './_components/CreateUserModal'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const data = await res.json()
      setUsers(data.users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserCreated = () => {
    setIsModalOpen(false)
    fetchUsers()
  }

  const handleUserUpdated = () => {
    fetchUsers()
  }

  const handleUserDeleted = () => {
    fetchUsers()
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Crea, edita y elimina usuarios del sistema</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            <Plus size={20} />
            Crear Usuario
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
          <UsersTable
            users={users}
            onUserUpdated={handleUserUpdated}
            onUserDeleted={handleUserDeleted}
          />
        )}
      </div>

      {isModalOpen && (
        <CreateUserModal
          onClose={() => setIsModalOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  )
}
