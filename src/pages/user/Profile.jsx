import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  User, Briefcase, Calendar, MapPin, GraduationCap,
  Settings, LogOut, ChevronRight, Download, Megaphone, Clock
} from 'lucide-react'
import { calculateServiceDuration, formatDate } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'

export default function Profile() {
  const { session, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [letters, setLetters] = useState([])

  // In a real scenario, we'd get the ID from the Auth session linkage
  // For this MVP where we might not have linked Auth.Users to Employees 1:1 perfectly yet,
  // we will try to find the employee by some unique identifier if possible,
  // OR assume `session.user.id` IS the `employee.id`.
  // Given the schema `id uuid references auth.users`, this is the intended design.
  const userId = session?.user?.id

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
        setLoading(false)
        return
    }
    fetchProfile()
    fetchLetters()
  }, [userId, authLoading])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setEmployee(data)

      // Fetch latest 3 announcements
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      setAnnouncements(annData || [])
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLetters = async () => {
    if (!userId) return
    const { data } = await supabase.from('appreciation_letters').select('*').eq('employee_id', userId).order('created_at', { ascending: false })
    setLetters(data || [])
  }

  if (loading || authLoading) {
    return <div className="p-8 text-center text-slate-500">جاري تحميل الملف الشخصي...</div>
  }

  if (!employee) {
    return (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
            عذراً، لم يتم العثور على بيانات الموظف المرتبطة بهذا الحساب.
            <br />
            ID: {userId}
        </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Announcements Bar */}
      {announcements.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 overflow-hidden relative">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary text-white rounded-lg animate-pulse">
                    <Megaphone size={16} />
                </div>
                <h3 className="font-bold text-primary">إعلانات وتعميمات هامة</h3>
            </div>
            <div className="space-y-3">
                {announcements.map(ann => (
                    <div key={ann.id} className="bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold text-slate-800 text-sm">{ann.title}</h4>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                <Clock size={10} />
                                {formatDate(ann.created_at)}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-sky-500 to-indigo-600"></div>
        <div className="px-6 pb-6">
            <div className="relative flex justify-between items-end -mt-12 mb-4">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-lg">
                        {employee.avatar_url ? (
                            <img src={employee.avatar_url} alt={employee.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                                {employee.full_name?.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mb-1 text-left hidden sm:block">
                     <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-sm font-medium border border-sky-100">
                        {employee.job_title}
                     </span>
                </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">{employee.full_name}</h1>
            <p className="text-slate-500 text-sm mb-4">رقم الشركة: {employee.company_id}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">مكان العمل</p>
                        <p className="font-medium text-sm">{employee.work_location}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">القسم / المنصب</p>
                        <p className="font-medium text-sm">{employee.position}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Award size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">الشهادة / الاختصاص</p>
                        <p className="font-medium text-sm">{employee.certificate} - {employee.specialization}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">تاريخ التعيين</p>
                        <p className="font-medium text-sm">{formatDate(employee.hire_date)}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-xs mb-1">مدة الخدمة</p>
                <p className="text-xl font-bold text-primary">{employee.hire_date ? calculateServiceDuration(employee.hire_date, employee.bonus_service_months).display : '0'}</p>
                <p className="text-xs text-slate-400">تشمل كتب الشكر ({employee.bonus_service_months || 0} شهر)</p>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-xs mb-1">رصيد الإجازات</p>
                <p className="text-2xl font-bold text-amber-500">{employee.leave_balance}</p>
                <p className="text-xs text-slate-400">يوم</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-xs mb-1">نظام الدوام</p>
                <p className="text-lg font-bold text-slate-700">
                    {employee.work_schedule === 'morning' ? 'صباحي' : 'مناوب'}
                </p>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-xs mb-1">الدرجة الوظيفية</p>
                <p className="text-lg font-bold text-sky-600">
                    {calculateJobGrade(employee.certificate, calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal).display}
                </p>
                <p className="text-xs text-slate-400">حسب التحصيل والخدمة</p>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-xs mb-1">الحالة</p>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-600 mr-2">نشط</span>
            </div>
      </div>

      {/* Letters List */}
      {letters.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="text-amber-500" size={20} />
                كتب الشكر والتقدير المستلمة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {letters.map(letter => (
                    <div key={letter.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{letter.title}</span>
                            <span className="text-xs text-amber-700">أضاف {letter.bonus_months} أشهر للخدمة</span>
                        </div>
                        <a href={letter.file_url} target="_blank" className="bg-white text-amber-600 p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            عرض الكتاب
                        </a>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  )
}
