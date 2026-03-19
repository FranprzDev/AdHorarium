'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'user' })
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.full_name) {
      setError('Completa todos los campos')
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }

      await fetchUsers()
      setFormData({ email: '', full_name: '', role: 'user' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setError('Error al guardar usuario')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || 'Error al eliminar')
      }
    } catch (err) {
      setError('Error al eliminar usuario')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Usuarios</h1>
          <p className="text-slate-400 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ email: '', full_name: '', role: 'user' })
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingId}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
            <input
              type="text"
              placeholder="Nombre Completo"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white font-medium"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-white font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No hay usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700/50 bg-slate-700/30">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Rol</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Fecha</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.full_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'bg-slate-600/50 text-slate-300'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(user.id)
                          setFormData({
                            email: user.email,
                            full_name: user.full_name,
                            role: user.role,
                          })
                          setShowForm(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
