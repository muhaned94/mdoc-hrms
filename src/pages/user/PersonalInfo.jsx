
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
    User, Briefcase, Calendar, GraduationCap,
    Award, Phone, Mail, Home, Heart, FileText, Star,
    ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, calculateServiceDuration } from '../../utils/dateUtils'

export default function PersonalInfo() {
    const { session, loading: authLoading } = useAuth()
    const [employee, setEmployee] = useState(null)
    const [letters, setLetters] = useState([])
    const [loading, setLoading] = useState(true)

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
            if (data) fetchLetters(data.id)
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchLetters = async (empId) => {
        if (!empId) return
        const { data } = await supabase.from('appreciation_letters').select('*').eq('employee_id', empId).order('created_at', { ascending: false })
        setLetters(data || [])
    }

    if (loading || authLoading) {
        return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>
    }

    if (!employee) {
        return <div className="p-8 text-center text-red-500">لم يتم العثور على بيانات الموظف</div>
    }

    return (
        <div className="space-y-6 pb-20">



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

                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{employee.full_name}</h1>
                            <p className="text-slate-500 text-sm">رقم الشركة: {employee.company_id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
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

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <User size={18} />
                        </div>
                        <span>المعلومات الشخصية والاتصال</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Home size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">العنوان</p>
                                <p className="text-sm font-medium text-slate-700">
                                    {employee.address || 'غير محدد'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Phone size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">رقم الهاتف</p>
                                <p className="text-sm font-medium text-slate-700 font-mono" dir="ltr">{employee.phone_number || 'غير محدد'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Mail size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">البريد الإلكتروني</p>
                                <p className="text-sm font-medium text-slate-700">{employee.email || 'غير محدد'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Heart size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">الحالة الاجتماعية</p>
                                <p className="text-sm font-medium text-slate-700">
                                    {employee.marital_status === 'single' && 'أعزب/باكر'}
                                    {employee.marital_status === 'married' && 'متزوج'}
                                    {employee.marital_status === 'divorced' && 'مطلق'}
                                    {employee.marital_status === 'widowed' && 'أرمل'}
                                    {(!employee.marital_status) && 'غير محدد'}
                                    {employee.spouse_name && <span className="text-xs text-slate-500 mr-1">({employee.spouse_name})</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Education Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <GraduationCap size={18} />
                        </div>
                        <span>التعليم والمؤهلات</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Award size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">المؤهل العلمي</p>
                                <p className="text-sm font-medium text-slate-700">{employee.certificate} في {employee.specialization}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Briefcase size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">الجامعة / الكلية</p>
                                <p className="text-sm font-medium text-slate-700">
                                    {employee.university_name || '-'} {employee.college_name ? ` - ${employee.college_name}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">سنة التخرج</p>
                                <p className="text-sm font-medium text-slate-700">{employee.graduation_year || '-'}</p>
                            </div>
                        </div>

                        {employee.graduation_certificate_url && (
                            <a href={employee.graduation_certificate_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2 text-primary hover:bg-slate-100 transition-colors cursor-pointer">
                                <FileText size={18} />
                                <span className="text-sm font-bold">عرض نسخة الشهادة</span>
                            </a>
                        )}
                    </div>
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
