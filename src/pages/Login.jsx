import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Building2, ScanLine } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner';
import QRCodeScannerComponent from '../components/QRCodeScanner';
import { useSettings } from '../context/SettingsContext'

export default function Login() {
  const { settings, loading: settingsLoading } = useSettings()
  const [companyId, setCompanyId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const navigate = useNavigate()

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
      {showScanner && (
        <QRCodeScannerComponent
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                    required={!showScanner}
                  />
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                </div>
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
          </div>
        </form>
      </div>
    </div>
  )
}
