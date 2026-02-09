import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Star, FileText, Calendar, ExternalLink, Award, Loader2 } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Appreciation() {
  const { session, loading: authLoading } = useAuth()
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)

  const userId = session?.user?.id

  useEffect(() => {
    if (!authLoading && userId) {
      fetchData()
    } else if (!authLoading && !userId) {
      setLoading(false)
    }
  }, [userId, authLoading])

  const fetchData = async () => {
    try {
      console.log('Fetching appreciation letters for:', userId)

      // Fetch employee data for bonus months
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('bonus_service_months')
        .eq('id', userId)
        .maybeSingle()

      if (empError) console.error('Error fetching employee:', empError.message)
      setEmployee(empData)

      // Fetch letters
      const { data: lettersData, error: lettersError } = await supabase
        .from('appreciation_letters')
        .select('*')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false })

      if (lettersError) {
        console.error('Error fetching letters:', lettersError.message)
        throw lettersError
      }

      console.log('Letters found:', lettersData?.length)
      setLetters(lettersData || [])
    } catch (error) {
      console.error('Catch error in fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) return <div className="text-center p-10 font-arabic flex flex-col items-center gap-4 dark:text-slate-400">
    <Loader2 className="animate-spin text-primary" size={40} />
    <span>جاري تحميل كتب الشكر...</span>
  </div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 justify-center md:justify-start">
              <Star className="fill-current" size={32} />
              كتب الشكر والتقدير
            </h1>
            <p className="text-sky-100 opacity-90">سجل التميز والزيادات الخدمية المستلمة</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 text-center">
            <span className="text-sm block mb-1">إجمالي زيادة الخدمة</span>
            <span className="text-4xl font-black">{employee?.bonus_service_months || 0}</span>
            <span className="text-sm mr-2">شهر</span>
          </div>
        </div>

        {/* Decorative Stars */}
        <Star className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <Award className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {letters.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-800 p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Star className="text-slate-300 dark:text-slate-600" size={40} />
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">لا توجد كتب شكر مسجلة حالياً</div>
          </div>
        ) : (
          letters.map((letter) => {
            const isSanction = letter.bonus_months < 0
            return (
              <div key={letter.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all group border-r-4 ${isSanction ? 'border-red-100 dark:border-red-900/30 border-r-red-500' : 'border-slate-100 dark:border-slate-700 border-r-sky-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg transition-colors ${isSanction ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-500 dark:group-hover:bg-red-500 group-hover:text-white' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 dark:group-hover:bg-sky-500 group-hover:text-white'}`}>
                    {isSanction ? <FileText size={24} /> : <Star size={24} />}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${isSanction ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' : 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50'}`}>
                      {isSanction ? `${letter.bonus_months} شهر خصم` : `+${letter.bonus_months} شهر قدم`}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDate(letter.created_at)}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 line-clamp-2 h-12 leading-relaxed">
                  {letter.title}
                </h3>

                <a
                  href={letter.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg transition-all font-bold text-sm shadow-sm ${isSanction ? 'group-hover:bg-red-500 group-hover:text-white' : 'group-hover:bg-primary group-hover:text-white'}`}
                >
                  <ExternalLink size={16} />
                  عرض الكتاب
                </a>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
