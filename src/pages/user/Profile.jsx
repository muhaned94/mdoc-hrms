
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
    User, Calendar, GraduationCap,
    Megaphone, Clock, CreditCard,
    ChevronLeft, Mail, Star, Phone, Home, Heart, Award, Briefcase, FileText, Bell
} from 'lucide-react'
import { calculateServiceDuration, formatDate } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'

export default function Profile() {
    const { session, loading: authLoading } = useAuth()
    const [employee, setEmployee] = useState(null)

    // Dashboard Data State
    const [announcements, setAnnouncements] = useState([])
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [courseDeficit, setCourseDeficit] = useState(0)
    const [loading, setLoading] = useState(true)

    const userId = session?.user?.id

    // Calculate generic stats for display
    const serviceDuration = employee?.hire_date ? calculateServiceDuration(employee.hire_date, employee.bonus_service_months || 0) : { display: '0', yearsDecimal: 0 }
    const gradeInfo = employee?.certificate ? calculateJobGrade(employee.certificate, serviceDuration.yearsDecimal) : { display: '-' }


    useEffect(() => {
        if (authLoading) return
        if (!userId) {
            setLoading(false)
            return
        }
        fetchDashboardData()
    }, [userId, authLoading])

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Employee Basic Info
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', userId)
                .single()

            if (empError) throw empError
            setEmployee(empData)

            // 2. Fetch Announcements (With Expiration Fix)
            if (empData) {
                fetchAnnouncements(empData.work_location)
            }

            // 3. Fetch Unread Messages Count
            const { count: msgCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('is_read', false)

            setUnreadMessages(msgCount || 0)

            // 4. Calculate Course Status
            const { data: courses } = await supabase
                .from('courses')
                .select('id')
                .eq('employee_id', userId)

            if (empData && courses) {
                const serviceYears = calculateServiceDuration(empData.hire_date, empData.bonus_service_months || 0).yearsDecimal
                const gInfo = calculateJobGrade(empData.certificate, serviceYears)
                const numericGrade = gInfo.grade || 10

                const required = numericGrade >= 6 ? 4 : 5
                const current = courses.length
                const deficit = Math.max(required - current, 0)
                setCourseDeficit(deficit)
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAnnouncements = async (location) => {
        try {
            let query = supabase
                .from('announcements')
                .select('*')
                .or(`expiration_date.is.null,expiration_date.gte.${new Date().toISOString().split('T')[0]}`)
                .order('created_at', { ascending: false })
                .limit(5)

            const { data, error } = await query

            if (error) throw error

            const filtered = data ? data.filter(a => a.target_location === 'all' || a.target_location === location) : []
            setAnnouncements(filtered)

            if (filtered.length > 0) {
                filtered.forEach(async (ann) => {
                    await supabase.rpc('record_announcement_view', {
                        ann_id: ann.id,
                        emp_id: userId
                    })
                })
            }
        } catch (err) {
            console.warn('Announcements Error:', err.message)
        }
    }

    if (loading || authLoading) {
        return <div className="p-8 text-center text-slate-500">جاري تحميل لوحة التحكم...</div>
    }

    if (!employee) {
        return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">

            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">مرحباً، {employee.full_name.split(' ')[0]} 👋</h1>
                    <p className="text-slate-500 text-sm">أهلاً بك في البوابة الإلكترونية للموظفين</p>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-200">
                    <img src={employee.avatar_url || `https://ui-avatars.com/api/?name=${employee.full_name}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Announcements Bar */}
            {announcements.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 overflow-hidden relative">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-500 text-white rounded-lg animate-pulse">
                            <Megaphone size={16} />
                        </div>
                        <h3 className="font-bold text-red-700">إعلانات وتعميمات هامة</h3>
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

            {/* Main Stats Grid (Enhanced Colors) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-100 text-center flex flex-col items-center justify-center h-full hover:shadow-md transition-all">
                    <p className="text-blue-400 text-xs mb-1 font-bold">مدة الخدمة</p>
                    <p className="text-xl font-black text-blue-700">
                        {serviceDuration.display}
                    </p>
                    <p className="text-[10px] text-blue-400/70 mt-1">تشمل كتب الشكر</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl shadow-sm border border-amber-100 text-center flex flex-col items-center justify-center h-full hover:shadow-md transition-all">
                    <p className="text-amber-400 text-xs mb-1 font-bold">رصيد الإجازات</p>
                    <p className="text-2xl font-black text-amber-600">{employee.leave_balance}</p>
                    <p className="text-[10px] text-amber-400/70 mt-1">يوم</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center h-full hover:shadow-md transition-all">
                    <p className="text-slate-400 text-xs mb-1 font-bold">نظام الدوام</p>
                    <p className="text-lg font-black text-slate-700">
                        {employee.work_schedule === 'morning' ? 'صباحي' : 'مناوب'}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl shadow-sm border border-emerald-100 text-center flex flex-col items-center justify-center h-full hover:shadow-md transition-all">
                    <p className="text-emerald-400 text-xs mb-1 font-bold">الدرجة الوظيفية</p>
                    <p className="text-lg font-black text-emerald-600">
                        {gradeInfo.display}
                    </p>
                    <p className="text-[10px] text-emerald-400/70 mt-1">الدرجة الحالية</p>
                </div>
            </div>

            {/* Interactive Colorful Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal Info Card */}
                <Link to="/user/personal-info" className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white relative overflow-hidden group shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300 hover:-translate-y-1 hover:rotate-[0.5deg]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <User size={140} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/10 group-hover:bg-white/30 transition-colors">
                                <User size={24} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight">المعلومات الشخصية</h3>
                            <p className="text-indigo-100 text-sm leading-relaxed opacity-90 font-medium max-w-xs">ملفك الشخصي، المؤهلات العلمية، والسجل الوظيفي التفصيلي.</p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-all border border-white/5">
                            <span>عرض التفاصيل</span>
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* Messages Card */}
                <Link to="/user/messages" className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-6 text-white relative overflow-hidden group shadow-lg shadow-sky-200/50 transition-all hover:shadow-sky-300 hover:-translate-y-1 hover:rotate-[0.5deg]">
                    <div className="absolute -bottom-4 -left-4 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500 rotate-12">
                        <Mail size={140} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/10 group-hover:bg-white/30 transition-colors">
                                <Mail size={24} className="text-white" />
                            </div>
                            {unreadMessages > 0 ? (
                                <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30 animate-pulse flex items-center gap-1.5 border border-white/20">
                                    <Bell size={12} fill="currentColor" />
                                    {unreadMessages} جديد
                                </span>
                            ) : (
                                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                    محدث
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight">الرسائل والتبليغات</h3>
                            <p className="text-sky-100 text-sm leading-relaxed opacity-90 font-medium">
                                {unreadMessages > 0
                                    ? `لديك ${unreadMessages} رسائل غير مقروءة تتطلب انتباهك الفوري.`
                                    : 'صندوق الوارد الخاص بك محدث، لا توجد إشعارات جديدة.'}
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Courses Card */}
                <Link to="/user/courses" className={`rounded-3xl p-6 text-white relative overflow-hidden group shadow-lg transition-all hover:-translate-y-1 hover:rotate-[0.5deg] ${courseDeficit > 0 ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-200 hover:shadow-orange-300' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 hover:shadow-emerald-300'}`}>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500 scale-110">
                        <GraduationCap size={140} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/10 group-hover:bg-white/30 transition-colors">
                                <GraduationCap size={24} className="text-white" />
                            </div>
                            {courseDeficit > 0 ? (
                                <span className="bg-white/90 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                    ⚠️ مطلوب إجراء
                                </span>
                            ) : (
                                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 border border-white/10">
                                    <Star size={12} fill="currentColor" /> مكتمل
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight">الدورات والتدريب</h3>
                            <p className="text-white/90 text-sm leading-relaxed font-medium">
                                {courseDeficit > 0
                                    ? `تنبيه: أنت بحاجة للمشاركة في ${courseDeficit} دورات إضافية.`
                                    : 'ممتاز! لقد استوفيت جميع متطلبات الدورات التدريبية.'}
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Salary Card */}
                <Link to="/user/salary" className="bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-3xl p-6 text-white relative overflow-hidden group shadow-lg shadow-fuchsia-200/50 transition-all hover:shadow-fuchsia-300 hover:-translate-y-1 hover:rotate-[0.5deg]">
                    <div className="absolute bottom-0 left-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <CreditCard size={140} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/10 group-hover:bg-white/30 transition-colors">
                                <CreditCard size={24} className="text-white" />
                            </div>
                            <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                الراتب الكلي
                            </span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-1 tracking-tight">تفاصيل الراتب</h3>
                            <p className="text-fuchsia-100 text-xs mb-3 opacity-80 font-medium">عرض شريط الراتب والحوافز الشهرية</p>
                            <div className="flex items-baseline gap-1 text-white">
                                <span className="text-4xl font-black tracking-tighter drop-shadow-sm">{employee.total_salary?.toLocaleString()}</span>
                                <span className="text-sm font-medium opacity-80">د.ع</span>
                            </div>
                        </div>
                    </div>
                </Link>

            </div>
        </div>
    )
}
