import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login')
    }
  }, [user, isAdmin, loading, navigate])

  if (loading) return null // Handled by App Suspense but for safety
  if (!user || !isAdmin) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
    { label: 'الموظفين', path: '/admin/employees', icon: Users },
    { label: 'إضافة موظف', path: '/admin/add-employee', icon: UserPlus },
  ]

  return (
    <div className="flex h-screen bg-slate-100 font-sans" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b p-4 flex justify-between items-center">
         <h1 className="text-xl font-bold text-primary">MDOC Admin</h1>
         <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-10 w-64 bg-white shadow-xl transform transition-transform duration-300 md:translate-x-0 md:static md:shadow-md flex flex-col pt-16 md:pt-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b hidden md:block">
          <h1 className="text-2xl font-bold text-primary">MDOC HRMS</h1>
          <p className="text-sm text-slate-500">لوحة المسؤول</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 space-x-reverse w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-0 md:hidden"
            onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
