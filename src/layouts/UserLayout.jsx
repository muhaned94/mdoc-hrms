import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { User, FileText, CreditCard, Award, LogOut } from 'lucide-react'

export default function UserLayout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  // Fetch Unread Messages Count
  useEffect(() => {
    if (user) {
        fetchUnreadCount()
        // Simple polling for now
        const interval = setInterval(fetchUnreadCount, 30000)
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

  if (loading) return null
  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center flex-1 overflow-x-auto no-scrollbar">
              <h1 className="text-xl font-bold text-primary ml-6 shrink-0">MDOC HRMS</h1>
              <nav className="flex space-x-4 space-x-reverse whitespace-nowrap">
                <Link to="/user/profile" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الملف الشخصي</Link>
                <Link to="/user/salary" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الراتب</Link>
                <Link to="/user/messages" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 relative">
                    الرسائل
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {unreadCount}
                        </span>
                    )}
                </Link>
                <Link to="/user/orders" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الأوامر الإدارية</Link>
                <Link to="/user/appreciation" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">كتب الشكر</Link>
                <Link to="/user/courses" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الدورات</Link>
                <Link to="/user/documents" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">المستمسكات</Link>
                <Link to="/user/support" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الدعم والشكاوي</Link>
                <Link to="/user/settings" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الإعدادات</Link>
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
