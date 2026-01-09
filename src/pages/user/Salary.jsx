import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Download, DollarSign, TrendingUp, CreditCard, FileText, Wallet } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Salary() {
  const { session } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [slips, setSlips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      const userId = session.user.id

      // Fetch Basic Salary Info
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('nominal_salary, total_salary, incentive')
        .eq('id', userId)
        .single()

      if (empError) throw empError
      setEmployee(empData)

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

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

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
            <p className="text-sky-100 font-medium opacity-90">عرض شريط الراتب والحوافز والمخصصات الشهرية</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center min-w-[160px]">
            <span className="text-xs font-bold block mb-1 opacity-80">الراتب الكلي (تقديري)</span>
            <span className="text-2xl font-black tracking-tight">{employee?.total_salary?.toLocaleString()}</span>
            <span className="text-xs mr-1 opacity-80">د.ع</span>
          </div>
        </div>

        {/* Decorations */}
        <CreditCard className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <TrendingUp className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      {/* Salary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100} /></div>
          <p className="text-indigo-100 mb-2">الراتب الكلي</p>
          <h2 className="text-3xl font-bold tracking-tight">
            {employee?.total_salary?.toLocaleString()} <span className="text-lg opacity-70">د.ع</span>
          </h2>
          <p className="text-xs text-indigo-200 mt-4">* يشمل المخصصات والحوافز</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <DollarSign size={18} />
              <span>الراتب الاسمي</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {employee?.nominal_salary?.toLocaleString()} <span className="text-sm text-slate-400">د.ع</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t">
            <span className="text-xs text-slate-400">يخضع للاستقطاعات التقاعدية</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <TrendingUp size={18} />
              <span>حافز شهري (تقديري)</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600">
              {employee?.incentive?.toLocaleString()} <span className="text-sm text-slate-400">د.ع</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t">
            <span className="text-xs text-slate-400">يتغير حسب الأرباح الشهرية</span>
          </div>
        </div>
      </div >

      {/* Recent Slips List */}
      < div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">أشرطة الراتب</h3>
        </div>

        {
          slips.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <FileText className="text-slate-300 mb-2" size={48} />
              <p>لا توجد بيانات رواتب لعرضها حالياً.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {slips.map((slip) => (
                <div key={slip.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {slip.month_year ? formatDate(slip.month_year) : 'شريط راتب'}
                      </p>
                      <p className="text-xs text-slate-500">تم الرفع: {formatDate(slip.created_at)}</p>
                    </div>
                  </div>
                  <a
                    href={slip.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
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
