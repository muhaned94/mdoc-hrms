import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Camera, Mail, Phone, MapPin, Briefcase, Calendar, Award } from 'lucide-react'
import { calculateServiceDuration } from '../../utils/dateUtils'

export default function UserProfile() {
  const { session } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // In a real scenario, we'd get the ID from the Auth session linkage
  // For this MVP where we might not have linked Auth.Users to Employees 1:1 perfectly yet,
  // we will try to find the employee by some unique identifier if possible, 
  // OR assume `session.user.id` IS the `employee.id`.
  // Given the schema `id uuid references auth.users`, this is the intended design.
  const userId = session?.user?.id

  useEffect(() => {
    if (userId) fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setEmployee(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
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
                        <p className="font-medium text-sm">{employee.hire_date}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-xs mb-1">مدة الخدمة</p>
                <p className="text-xl font-bold text-primary">{employee.hire_date ? calculateServiceDuration(employee.hire_date).display : '0'}</p>
                <p className="text-xs text-slate-400">محسوبة من تاريخ التعيين</p>
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
                <p className="text-slate-400 text-xs mb-1">الحالة</p>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-600 mr-2">نشط</span>
            </div>
      </div>
    </div>
  )
}
