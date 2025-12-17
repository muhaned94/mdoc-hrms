import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, FileText, CreditCard, Award, LogOut } from 'lucide-react'

export default function UserLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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
                <Link to="/user/orders" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الأوامر الإدارية</Link>
                <Link to="/user/courses" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">الدورات</Link>
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
