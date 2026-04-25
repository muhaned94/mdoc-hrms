import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Building2, ScanLine, Eye, EyeOff, Fingerprint } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner';
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
  const [rememberMe, setRememberMe] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [canUseBiometrics, setCanUseBiometrics] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if biometrics are available (Mock for now, would use Capacitor plugin)
    // if (navigator.credentials) setCanUseBiometrics(true)
    setCanUseBiometrics(true) // Show for demo
  }, [])

  useEffect(() => {
    // Load saved credentials
    const savedCompanyId = localStorage.getItem('mdoc_remember_company_id')
    const savedPassword = localStorage.getItem('mdoc_remember_password')
    if (savedCompanyId && savedPassword) {
      setCompanyId(savedCompanyId)
      setPassword(savedPassword)
      setRememberMe(true)
      
      // Auto-Login if credentials found and not already loading
      if (!loading && !error) {
        setIsAutoLoggingIn(true)
        handleLogin(null, { companyId: savedCompanyId, password: savedPassword })
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

    // If scanned, use those credentials
    const loginCompanyId = scannedCredentials ? scannedCredentials.companyId : companyId
    const loginPassword = scannedCredentials ? scannedCredentials.password : password

    if (!loginCompanyId || !loginPassword) {
      setError('يرجى ادخال البيانات او مسح الباركود بشكل صحيح')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Try to Login via RPC (Secure Function)
      const { data: employee, error: rpcError } = await supabase
        .rpc('login_employee', {
          p_company_id: loginCompanyId,
          p_password: loginPassword
        })

      if (rpcError) throw rpcError

      if (!employee) {
        throw new Error('بيانات الدخول غير صحيحة')
      }

      // 2. Create a "Virtual Session"
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

      // Save credentials if Remember Me is checked
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
      setShowScanner(false) // Close scanner if open
    }
  }

  const handleBiometricLogin = async () => {
    // 1. Check if we have saved credentials
    const savedCompanyId = localStorage.getItem('mdoc_remember_company_id')
    const savedPassword = localStorage.getItem('mdoc_remember_password')

    if (!savedCompanyId || !savedPassword) {
      setError('يرجى تسجيل الدخول يدوياً أولاً وتفعيل "تذكر بياناتي" لتفعيل البصمة.')
      return
    }

    // 2. Trigger Biometric Auth (Mocking the plugin call)
    // In real app: const result = await BiometricAuth.authenticate(...)
    alert('جاري التحقق من الهوية عبر البصمة/الوجه...')
    
    // Simulate success
    setTimeout(() => {
      handleLogin(null, { companyId: savedCompanyId, password: savedPassword })
    }, 1000)
  }

  const handleScan = (rawValue) => {
    try {
      if (!rawValue) return;
      // rawValue should be a JSON string: {"companyId": "...", "password": "..."}
      // Some scanners wrap the result in an object array, handled in our component.

      // Simple validation if it's JSON
      const data = JSON.parse(rawValue);

      if (data && data.companyId && data.password) {
        // Successfully parsed credentials
        handleLogin(null, data);
      } else {
        setError("رمز QR غير صالح. تأكد من استخدام بطاقة الموظف الصحيحة.");
        setShowScanner(false);
      }
    } catch (e) {
      console.error("Scan Error:", e);
      setError("خطأ في قراءة الرمز. حاول مرة أخرى.");
      setShowScanner(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      {isAutoLoggingIn && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
           <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-bounce" />
           <div className="text-center">
             <h2 className="text-xl font-bold text-slate-800">جاري تسجيل الدخول تلقائياً...</h2>
             <p className="text-slate-500 text-sm mt-2">مرحباً بك مجدداً في MDOC HRMS</p>
           </div>
           <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-primary animate-progress-buffer"></div>
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
          <p className="text-slate-500 mt-2">MDOC HRMS</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

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
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="أدخل رقم الشركة"
                    required={!showScanner}
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
                    className="w-full pl-12 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                    required={!showScanner}
                  />
                  <Lock className="absolute right-3 top-3.5 text-slate-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3.5 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">
                  تذكر بياناتي (دخول تلقائي في المرة القادمة)
                </label>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            {(settings.login_method === 'password' || settings.login_method === 'both') && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition-colors duration-200 shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            )}

            {(settings.login_method === 'qr' || settings.login_method === 'both') && (
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className={`w-full font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2
                  ${settings.login_method === 'qr'
                    ? 'bg-primary hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                <ScanLine size={20} />
                {settings.login_method === 'qr' ? 'اضغط للمسح الضوئي' : 'تسجيل الدخول بالباركود'}
              </button>
            )}

            {canUseBiometrics && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                className="w-full bg-slate-800 hover:bg-black text-white font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <Fingerprint size={20} />
                تسجيل الدخول بالبصمة
              </button>
            )}
          </div>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button 
            onClick={() => navigate('/privacy-policy')}
            className="text-sm text-slate-400 hover:text-primary transition-colors"
          >
            سياسة الخصوصية
          </button>
        </div>
      </div>
    </div>
  )
}
