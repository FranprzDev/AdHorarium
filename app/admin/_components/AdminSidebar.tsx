'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, BookOpen, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/subjects', label: 'Materias', icon: BookOpen },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()

  return (
    <aside className="w-64 bg-slate-900 text-white border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">AdHorarium</h1>
        <p className="text-sm text-slate-400 mt-2">Panel de Administración</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="text-sm">
          <p className="text-slate-400">Administrador</p>
          <p className="text-white font-medium truncate">{user?.full_name}</p>
          <p className="text-slate-400 text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm font-medium"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
