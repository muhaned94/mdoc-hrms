import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Building2 } from 'lucide-react'

export default function Login() {
  const [companyId, setCompanyId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Try to Login via RPC (Secure Function)
      const { data: employee, error: rpcError } = await supabase
        .rpc('login_employee', { 
            p_company_id: companyId, 
            p_password: password 
        })

      if (rpcError) throw rpcError

      if (!employee) {
         throw new Error('بيانات الدخول غير صحيحة')
      }

      // 2. Create a "Virtual Session"
      // Since we are using custom auth to support "Visible Passwords", we simulate a session.
      // In a real production app, this is insecure.
      const sessionData = {
        user: {
            id: employee.id,
            email: `${employee.company_id}@mdoc.hrms`,
            user_metadata: {
                role: employee.role,
                full_name: employee.full_name
            }
        },
        access_token: 'marketing-token', // Dummy
      }

      // Save to LocalStorage (Simple Auth)
      localStorage.setItem('mdoc_session', JSON.stringify(sessionData))
      
      // Update AuthContext listeners
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('mdoc-auth-update'))

      if (employee.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/user/profile')
      }

    } catch (err) {
      setError('فشل تسجيل الدخول. تأكد من رقم الشركة وكلمة المرور.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">تسجيل الدخول</h1>
          <p className="text-slate-500 mt-2">MDOC HRMS</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">رقم الشركة</label>
            <div className="relative">
              <input
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="أدخل رقم الشركة"
                required
              />
              <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition-colors duration-200 shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
