
import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  User, Wallet, Mail, FileText, Award, GraduationCap, Files,
  LifeBuoy, Settings, LogOut, Menu, X, Home, FileUser
} from 'lucide-react'

export default function UserLayout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth Check
  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      fetchNewCircularsCount()
      const interval = setInterval(() => {
        fetchUnreadCount()
        fetchNewCircularsCount()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (!error) setUnreadCount(count || 0)
    } catch (e) {
      console.error(e)
    }
  }

  const [newCircularsCount, setNewCircularsCount] = useState(0)

  const fetchNewCircularsCount = async () => {
    try {
      const lastCheck = localStorage.getItem('last_circulars_check')

      let query = supabase.from('circulars').select('*', { count: 'exact', head: true })

      if (lastCheck) {
        query = query.gt('created_at', lastCheck)
      }

      const { count, error } = await query

      if (!error) setNewCircularsCount(count || 0)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading || !user) return null

  const navItems = [
    { label: 'الرئيسية', path: '/user/profile', icon: Home }, // Profile is main
    { label: 'المعلومات الشخصية', path: '/user/personal-info', icon: FileUser },
    { label: 'الراتب', path: '/user/salary', icon: Wallet },
    { label: 'الرسائل', path: '/user/messages', icon: Mail, badge: unreadCount },
    { label: 'الأوامر الإدارية', path: '/user/orders', icon: FileText },
    { label: 'التعاميم الادارية', path: '/user/circulars', icon: Files, badge: newCircularsCount },
    { label: ' كتب الشكر والعقوبات', path: '/user/appreciation', icon: Award },
    { label: 'الدورات', path: '/user/courses', icon: GraduationCap },
    { label: 'المستمسكات', path: '/user/documents', icon: Files },
    { label: 'الدعم والشكاوي', path: '/user/support', icon: LifeBuoy },
    { label: 'الإعدادات', path: '/user/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200" dir="rtl">

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 z-20 border-b dark:border-slate-700 p-4 flex justify-between items-center shadow-sm transition-colors">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600 dark:text-slate-300">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
        <h1 className="text-xl font-bold text-primary">MDOC Portal</h1>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-20 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 md:translate-x-0 md:static md:shadow-md flex flex-col pt-16 md:pt-0 border-l dark:border-slate-700
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b dark:border-slate-700 hidden md:block">
          <h1 className="text-2xl font-bold text-primary">MDOC HRMS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">بوابة الموظف</p>
        </div>

        {/* User Info Teaser */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700 flex items-center gap-3 mx-4 mt-4 rounded-xl transition-colors">
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">نشط الآن</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary dark:hover:text-primary'
                }`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <item.icon size={20} className={location.pathname === item.path ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${location.pathname === item.path
                  ? 'bg-white text-primary'
                  : 'bg-red-500 text-white'
                  }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t dark:border-slate-700">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 space-x-reverse w-full p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 w-full bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
