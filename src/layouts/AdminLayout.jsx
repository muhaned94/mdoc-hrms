
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, UserPlus, Megaphone, LogOut, BarChart3, MessageSquareWarning, Send, Database, Menu, X, Activity, GitGraph, FileText, Settings, Upload, GraduationCap } from 'lucide-react'
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
    { label: 'التعاميم والكتب', path: '/admin/circulars', icon: FileText },
    { label: 'التقارير', path: '/admin/reports', icon: BarChart3 },
    { label: 'تحليل النظام', path: '/admin/analytics', icon: Activity },
    { label: 'الرسائل المرسلة', path: '/admin/messages', icon: Send },
    { label: 'رفع الرواتب دفعة واحدة', path: '/admin/bulk-salary-upload', icon: Upload },
    { label: 'رفع الدورات الجماعي', path: '/admin/bulk-course-assign', icon: GraduationCap },
    { label: 'سجل الموظفين الشامل', path: '/admin/employees-grid', icon: Database },
    { label: 'الشكاوي والدعم', path: '/admin/complaints', icon: MessageSquareWarning, badge: pendingReports },
    { label: 'إعدادات النظام', path: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 dark:border-slate-700 z-20 border-b p-4 flex justify-between items-center transition-colors">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600 dark:text-slate-200">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
        <h1 className="text-xl font-bold text-primary">MDOC Admin</h1>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-10 w-64 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-xl transform transition-transform duration-300 md:translate-x-0 md:static md:shadow-md flex flex-col pt-16 md:pt-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b dark:border-slate-700 hidden md:block">
          <h1 className="text-2xl font-bold text-primary">MDOC HRMS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">لوحة المسؤول</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <item.icon size={20} className={location.pathname === item.path ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-white'} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t dark:border-slate-700">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 space-x-reverse w-full p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
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
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 w-full bg-slate-50 dark:bg-slate-900 transition-colors">
        <Outlet />
      </main>
    </div>
  )
}
