import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminSidebar from './_components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
