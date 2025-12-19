import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X, Megaphone, BarChart3, MessageSquareWarning } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingReports, setPendingReports] = useState(0)

  useEffect(() => {
    fetchPendingReports()
    // Poll every minute for new reports
    const interval = setInterval(fetchPendingReports, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingReports = async () => {
    const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
    
    if (!error) setPendingReports(count || 0)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
    { label: 'الموظفين', path: '/admin/employees', icon: Users },
    { label: 'إضافة موظف', path: '/admin/add-employee', icon: UserPlus },
    { label: 'الإعلانات', path: '/admin/announcements', icon: Megaphone },
    { label: 'التقارير', path: '/admin/reports', icon: BarChart3 },
    { label: 'الشكاوي والدعم', path: '/admin/complaints', icon: MessageSquareWarning, badge: pendingReports },
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
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                </span>
              )}
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
