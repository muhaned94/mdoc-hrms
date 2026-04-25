import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Building2, ScanLine, Eye, EyeOff } from 'lucide-react'
import QRCodeScannerComponent from '../components/QRCodeScanner';
import { useSettings } from '../context/SettingsContext'

export default function Login() {
  const { settings, loading: settingsLoading } = useSettings()
  const [companyId, setCompanyId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Load saved credentials
    const savedCompanyId = localStorage.getItem('mdoc_remember_company_id')
    const savedPassword = localStorage.getItem('mdoc_remember_password')
    const skipAutoLogin = localStorage.getItem('mdoc_skip_auto_login')

    if (savedCompanyId && savedPassword) {
      setCompanyId(savedCompanyId)
      setPassword(savedPassword)
      setRememberMe(true)
      
      // Auto-Login if not skipped
      if (!loading && !error && skipAutoLogin !== 'true') {
        setIsAutoLoggingIn(true)
        handleLogin(null, { companyId: savedCompanyId, password: savedPassword })
      }
      
      if (skipAutoLogin === 'true') {
        localStorage.removeItem('mdoc_skip_auto_login')
      }
    }
  }, [])

  useEffect(() => {
    if (!settingsLoading && settings.login_method === 'qr') {
      setShowScanner(true)
    }
  }, [settings.login_method, settingsLoading])

  const handleLogin = async (e, scannedCredentials = null) => {
    if (e) e.preventDefault()

    const loginCompanyId = scannedCredentials ? scannedCredentials.companyId : companyId
    const loginPassword = scannedCredentials ? scannedCredentials.password : password

    if (!loginCompanyId || !loginPassword) {
      setError('يرجى ادخال البيانات او مسح الباركود بشكل صحيح')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: employee, error: rpcError } = await supabase
        .rpc('login_employee', {
          p_company_id: loginCompanyId,
          p_password: loginPassword
        })

      if (rpcError) throw rpcError

      if (!employee) {
        throw new Error('بيانات الدخول غير صحيحة')
      }

      const sessionData = {
        user: {
          id: employee.id,
          email: `${employee.company_id}@mdoc.hrms`,
          user_metadata: {
            role: employee.role,
            full_name: employee.full_name
          }
        },
        access_token: 'marketing-token',
      }

      localStorage.setItem('mdoc_session', JSON.stringify(sessionData))
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('mdoc-auth-update'))

      if (rememberMe) {
        localStorage.setItem('mdoc_remember_company_id', loginCompanyId)
        localStorage.setItem('mdoc_remember_password', loginPassword)
      } else {
        localStorage.removeItem('mdoc_remember_company_id')
        localStorage.removeItem('mdoc_remember_password')
      }

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
      setShowScanner(false)
    }
  }

  const handleScan = (rawValue) => {
    try {
      if (!rawValue) return;
      const data = JSON.parse(rawValue);
      if (data && data.companyId && data.password) {
        handleLogin(null, data);
      } else {
        setError("رمز QR غير صالح.");
        setShowScanner(false);
      }
    } catch (e) {
      setError("خطأ في قراءة الرمز.");
      setShowScanner(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      {isAutoLoggingIn && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center space-y-6">
           <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-bounce" />
           <div className="text-center">
             <h2 className="text-xl font-bold text-slate-800">جاري تسجيل الدخول...</h2>
           </div>
        </div>
      )}
      {showScanner && (
        <QRCodeScannerComponent
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-32 h-32 flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="MDOC Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">تسجيل الدخول</h1>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

        <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
          {(settings.login_method === 'password' || settings.login_method === 'both') && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رقم الشركة</label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200"
                    placeholder="أدخل رقم الشركة"
                  />
                  <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 rounded-lg border border-slate-200"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-3 top-3.5 text-slate-400" size={18} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-3.5 text-slate-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="rememberMe" className="text-sm text-slate-600">تذكر بياناتي</label>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            {(settings.login_method === 'password' || settings.login_method === 'both') && (
              <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-lg">
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            )}

            {(settings.login_method === 'qr' || settings.login_method === 'both') && (
              <button type="button" onClick={() => setShowScanner(true)} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                <ScanLine size={20} />
                تسجيل الدخول بالباركود
              </button>
            )}
          </div>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button onClick={() => navigate('/privacy-policy')} className="text-sm text-slate-400">سياسة الخصوصية</button>
        </div>
      </div>
    </div>
  )
}
