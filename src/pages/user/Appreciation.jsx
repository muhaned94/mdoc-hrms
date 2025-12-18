import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Star, FileText, Calendar, ExternalLink, Award } from 'lucide-react'

export default function Appreciation() {
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch employee data for bonus months
      const { data: empData } = await supabase
        .from('employees')
        .select('bonus_service_months')
        .eq('id', user.id)
        .single()
      
      setEmployee(empData)

      // Fetch letters
      const { data: lettersData, error } = await supabase
        .from('appreciation_letters')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLetters(lettersData || [])
    } catch (error) {
      console.error('Error fetching appreciation data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center p-10 font-arabic">جاري التحميل...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 justify-center md:justify-start">
              <Star className="fill-current" size={32} />
              كتب الشكر والتقدير
            </h1>
            <p className="text-amber-100 opacity-90">سجل التميز والزيادات الخدمية المستلمة</p>
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
          <div className="col-span-full bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Star className="text-slate-300" size={40} />
            </div>
            <div className="text-slate-500 font-medium">لا توجد كتب شكر مسجلة حالياً</div>
          </div>
        ) : (
          letters.map((letter) => (
            <div key={letter.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all group border-r-4 border-r-amber-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    +{letter.bonus_months} شهر
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(letter.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-800 mb-4 line-clamp-2 h-12 leading-relaxed">
                {letter.title}
              </h3>
              
              <a 
                href={letter.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-primary group-hover:text-white transition-all font-bold text-sm shadow-sm"
              >
                <ExternalLink size={16} />
                عرض الكتاب
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
