'use client'

import { useState, useEffect } from 'react'
import { Users, BookOpen, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalSubjects: number
  adminCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalSubjects: 0, adminCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, subjectsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/subjects'),
        ])

        if (usersRes.ok && subjectsRes.ok) {
          const usersData = await usersRes.json()
          const subjectsData = await subjectsRes.json()
          const adminCount = usersData.users.filter((u: any) => u.role === 'admin').length

          setStats({
            totalUsers: usersData.users.length,
            totalSubjects: subjectsData.subjects.length,
            adminCount,
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      icon: Users,
      label: 'Usuarios Totales',
      value: stats.totalUsers,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: BookOpen,
      label: 'Materias',
      value: stats.totalSubjects,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      icon: BarChart3,
      label: 'Administradores',
      value: stats.adminCount,
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-400',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-white">Dashboard</h1>
      <p className="text-slate-400 mb-8">Bienvenido al panel de administración de AdHorarium</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className={`p-6 rounded-lg border ${card.bgColor} ${card.borderColor} backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {loading ? '-' : card.value}
                  </p>
                </div>
                <Icon className={`w-12 h-12 ${card.iconColor} opacity-50`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors border border-slate-600/50 hover:border-slate-500"
          >
            <p className="font-medium text-white">Gestionar Usuarios</p>
            <p className="text-sm text-slate-400 mt-1">Crear, editar o eliminar usuarios del sistema</p>
          </Link>
          <Link
            href="/admin/subjects"
            className="p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors border border-slate-600/50 hover:border-slate-500"
          >
            <p className="font-medium text-white">Gestionar Materias</p>
            <p className="text-sm text-slate-400 mt-1">Crear, editar materias y establecer correlativas</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
