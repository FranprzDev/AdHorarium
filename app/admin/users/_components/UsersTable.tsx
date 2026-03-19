'use client'

import { useState } from 'react'
import { Trash2, Edit2, Loader2 } from 'lucide-react'
import EditUserModal from './EditUserModal'

interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
}

interface UsersTableProps {
  users: User[]
  onUserUpdated: () => void
  onUserDeleted: () => void
}

export default function UsersTable({ users, onUserUpdated, onUserDeleted }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar usuario')
      onUserDeleted()
    } catch (error) {
      alert('Error al eliminar usuario')
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Creado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.full_name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm space-x-2 flex">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-red-600 disabled:opacity-50"
                  >
                    {deletingId === user.id ? (
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

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={() => {
            setEditingUser(null)
            onUserUpdated()
          }}
        />
      )}
    </>
  )
}
