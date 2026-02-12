import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Download, DollarSign, TrendingUp, CreditCard, FileText, Wallet } from 'lucide-react'
import { formatDate, formatMonthYear } from '../../utils/dateUtils'

export default function Salary() {
  const { session } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [slips, setSlips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
      // Mark as read
      localStorage.setItem(`last_salary_check_${session.user.id}`, new Date().toISOString())
    }
  }, [session])

  const fetchData = async () => {
    try {
      const userId = session.user.id

      // Fetch Slips
      const { data: slipsData, error: slipsError } = await supabase
        .from('salary_slips')
        .select('*')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false })

      if (slipsError) throw slipsError
      setSlips(slipsData)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      {/* Unified Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
              <Wallet className="fill-current/20" size={32} />
              تفاصيل الراتب
            </h1>
            <p className="text-sky-100 font-medium opacity-90">عرض شريط الراتب والحوافز والمخصصات الشهرية المرفوعة من الإدارة</p>
          </div>
        </div>

        {/* Decorations */}
        <CreditCard className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <TrendingUp className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      {/* Recent Slips List */}
      < div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden" >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-lg dark:text-white">أشرطة الراتب</h3>
        </div>

        {
          slips.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
              <FileText className="text-slate-300 dark:text-slate-600 mb-2" size={48} />
              <p>لا توجد بيانات رواتب لعرضها حالياً.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {slips.map((slip) => (
                <div key={slip.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {slip.month_year ? formatMonthYear(slip.month_year) : 'شريط راتب'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">تم الرفع: {formatDate(slip.created_at)}</p>
                    </div>
                  </div>
                  <a
                    href={slip.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download size={16} />
                    <span>تحميل PDF</span>
                  </a>
                </div>
              ))}
            </div>
          )
        }
      </div >
    </div >
  )
}
