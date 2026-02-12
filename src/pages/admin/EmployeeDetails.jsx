import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { Save, Upload, FileText, ArrowRight, UserCog, Shield, Trash, Trash2, GraduationCap, Plus, Star, Edit3, AlertTriangle, Eye, Briefcase, User, Wallet, Clock, Calendar, MessageSquare, QrCode, X, MapPin } from 'lucide-react'
import { calculateServiceDuration, formatDate, formatMonthYear } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'
import { countWeightedCourses } from '../../utils/courseUtils'
import UserQRCode from '../../components/UserQRCode'

export default function EmployeeDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { settings } = useSettings()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [employee, setEmployee] = useState(null)

    // Document Upload States
    const [uploadingOrder, setUploadingOrder] = useState(false)
    const [uploadingSlip, setUploadingSlip] = useState(false)
    const [uploadingLetter, setUploadingLetter] = useState(false)
    const [bonusMonths, setBonusMonths] = useState(1)
    const [orders, setOrders] = useState([])
    const [slips, setSlips] = useState([])
    const [slipDate, setSlipDate] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
    const [letters, setLetters] = useState([])

    // Courses State
    const [courses, setCourses] = useState([])
    const [addingCourse, setAddingCourse] = useState(false)
    const [newCourse, setNewCourse] = useState({ course_name: '', course_date: '', duration: 'أسبوع', location: '' })

    // Messaging State
    const [messageOpen, setMessageOpen] = useState(false)
    const [messageData, setMessageData] = useState({ title: '', body: '' })
    const [sendingMessage, setSendingMessage] = useState(false)

    // Letters State
    const [letterType, setLetterType] = useState('thanks') // 'thanks' | 'sanction'

    useEffect(() => {
        fetchEmployee()
        fetchDocuments()
        fetchLetters()
    }, [id])

    const fetchEmployee = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setEmployee(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDocuments = async () => {
        const { data: ordersData } = await supabase.from('admin_orders').select('*').eq('employee_id', id)
        setOrders(ordersData || [])

        const { data: slipsData } = await supabase.from('salary_slips').select('*').eq('employee_id', id)
        setSlips(slipsData || [])

        const { data: coursesData } = await supabase.from('courses').select('*').eq('employee_id', id).order('course_date', { ascending: false })
        setCourses(coursesData || [])
    }

    const fetchLetters = async () => {
        try {
            const { data, error } = await supabase
                .from('appreciation_letters')
                .select('*')
                .eq('employee_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setLetters(data || [])
        } catch (err) {
            console.error(err)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setEmployee(prev => ({ ...prev, [name]: value }))
    }

    const handleUpdateEmployee = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { error } = await supabase
                .from('employees')
                .update(employee)
                .eq('id', id)
            if (error) throw error
            alert('تم تحديث البيانات بنجاح')
        } catch (err) {
            alert('فشل التحديث: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleFileUpload = async (file, type) => {
        if (!file) return
        const setter = type === 'order' ? setUploadingOrder : type === 'slip' ? setUploadingSlip : setUploadingLetter
        setter(true)

        try {
            const ext = file.name.split('.').pop()
            const bucket = type === 'slip' ? 'salary-slips' : 'documents'
            const fileName = `${id}/${Date.now()}_${type}.${ext}`

            const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)

            if (type === 'order') {
                const title = prompt('أدخل عنوان الكتاب أو الأمر الإداري:')
                await supabase.from('admin_orders').insert({ employee_id: id, title: title || 'أمر إداري جديد', file_url: publicUrl })
            } else if (type === 'slip') {
                await supabase.from('salary_slips').insert({ employee_id: id, month_year: `${slipDate}-01`, file_url: publicUrl })
            } else if (type === 'letter') {
                const title = prompt('أدخل عنوان كتاب الشكر أو العقوبة:')
                const { error: insErr } = await supabase.from('appreciation_letters').insert({
                    employee_id: id,
                    title: title || (letterType === 'thanks' ? 'كتاب شكر وتقدير' : 'عقوبة إدارية'),
                    file_url: publicUrl,
                    bonus_months: bonusMonths
                })
                if (insErr) throw insErr

                const { data: emp } = await supabase.from('employees').select('bonus_service_months').eq('id', id).single()
                await supabase.from('employees').update({ bonus_service_months: (emp.bonus_service_months || 0) + bonusMonths }).eq('id', id)
                await fetchEmployee()
            }

            await fetchDocuments()
            await fetchLetters()
            alert('تم الرفع بنجاح')
        } catch (err) {
            alert('فشل الرفع: ' + err.message)
        } finally {
            setter(false)
        }
    }

    const handleCertUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        try {
            const ext = file.name.split('.').pop()
            const fileName = `${id}/graduation_cert_${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)
            await supabase.from('employees').update({ graduation_certificate_url: publicUrl }).eq('id', id)
            setEmployee(prev => ({ ...prev, graduation_certificate_url: publicUrl }))
            alert('تم تحديث الوثيقة بنجاح')
        } catch (err) {
            alert('فشل الرفع')
        }
    }

    const handleOfficialDocUpload = async (e, docKey) => {
        const file = e.target.files[0]
        if (!file) return
        try {
            const ext = file.name.split('.').pop()
            const fileName = `${id}/${docKey}_${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)
            await supabase.from('employees').update({ [docKey]: publicUrl }).eq('id', id)
            setEmployee(prev => ({ ...prev, [docKey]: publicUrl }))
        } catch (err) {
            alert('فشل الرفع')
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!messageData.title || !messageData.body) return
        setSendingMessage(true)
        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: id,
                title: messageData.title,
                body: messageData.body
            })
            if (error) throw error
            alert('تم إرسال الرسالة بنجاح')
            setMessageOpen(false)
            setMessageData({ title: '', body: '' })
        } catch (err) {
            alert('فشل الإرسال')
        } finally {
            setSendingMessage(false)
        }
    }

    const handleDeleteLetter = async (letterId, bonusValue) => {
        if (!confirm('حذف هذا الكتاب؟')) return
        try {
            await supabase.from('appreciation_letters').delete().eq('id', letterId)
            const { data: emp } = await supabase.from('employees').select('bonus_service_months').eq('id', id).single()
            await supabase.from('employees').update({ bonus_service_months: (emp.bonus_service_months || 0) - bonusValue }).eq('id', id)
            await fetchLetters()
            await fetchEmployee()
        } catch (err) {
            alert('فشل الحذف')
        }
    }

    const handleEditLetterTitle = async (letterId) => {
        const newTitle = prompt('أدخل العنوان الجديد:')
        if (newTitle) {
            await supabase.from('appreciation_letters').update({ title: newTitle }).eq('id', letterId)
            fetchLetters()
        }
    }

    const handleDeleteOrder = async (orderId) => {
        if (!confirm('حذف؟')) return
        await supabase.from('admin_orders').delete().eq('id', orderId)
        fetchDocuments()
    }

    const handleEditOrderTitle = async (orderId) => {
        const newTitle = prompt('تعديل العنوان:')
        if (newTitle) {
            await supabase.from('admin_orders').update({ title: newTitle }).eq('id', orderId)
            fetchDocuments()
        }
    }

    const handleAddCourse = async (e) => {
        e.preventDefault()
        setAddingCourse(true)
        try {
            const { error } = await supabase.from('courses').insert({ employee_id: id, ...newCourse })
            if (error) throw error
            setNewCourse({ course_name: '', course_date: '', duration: 'أسبوع', location: '' })
            fetchDocuments()
        } catch (err) {
            alert('فشل إضافة الدورة: ' + (err.message.includes('duration') ? 'يجب تحديث قاعدة البيانات كما ذكرنا سابقاً' : err.message))
        } finally {
            setAddingCourse(false)
        }
    }

    const handleDeleteCourse = async (courseId) => {
        if (confirm('حذف الدورة؟')) {
            await supabase.from('courses').delete().eq('id', courseId)
            fetchDocuments()
        }
    }

    const handleEditCourse = async (course) => {
        const n = prompt('الاسم:', course.course_name)
        const d = prompt('التاريخ:', course.course_date)
        const dur = prompt('المدة (مثلاً: أسبوع / أسبوعين):', course.duration || 'أسبوع')
        const loc = prompt('مكان الانعقاد:', course.location || '')
        if (n && d) {
            try {
                const { error } = await supabase.from('courses').update({ course_name: n, course_date: d, duration: dur, location: loc }).eq('id', course.id)
                if (error) throw error
                fetchDocuments()
            } catch (err) {
                alert('فشل التعديل: ' + (err.message.includes('duration') ? 'يجب تحديث قاعدة البيانات' : err.message))
            }
        }
    }

    const handleDeleteSlip = async (slipId) => {
        if (confirm('حذف الشريط؟')) {
            await supabase.from('salary_slips').delete().eq('id', slipId)
            fetchDocuments()
        }
    }

    const handleEditSlipDate = async (slipId) => {
        const d = prompt('التاريخ (YYYY-MM):')
        if (d) {
            await supabase.from('salary_slips').update({ month_year: d }).eq('id', slipId)
            fetchDocuments()
        }
    }

    const handleDeleteCert = async () => {
        if (confirm('حذف الوثيقة؟')) {
            await supabase.from('employees').update({ graduation_certificate_url: null }).eq('id', id)
            setEmployee(prev => ({ ...prev, graduation_certificate_url: null }))
        }
    }

    const handleDeleteDocument = async (k, n) => {
        if (confirm(`حذف ${n}?`)) {
            await supabase.from('employees').update({ [k]: null }).eq('id', id)
            setEmployee(prev => ({ ...prev, [k]: null }))
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-500">جاري التحميل...</div>
    if (!employee) return <div className="p-10 text-center text-red-500">الموظف غير موجود</div>

    // Calculate Course Status based on CURRENT GRADE date
    const serviceDuration = calculateServiceDuration(employee.hire_date, employee.bonus_service_months);
    const gradeInfo = calculateJobGrade(employee.certificate, serviceDuration.yearsDecimal, settings.course_settings);

    // Calculate Grade Start Date
    // Hire Date + Years used to reach current grade
    const gradeStartDate = new Date(employee.hire_date);
    if (gradeInfo.yearsOfServiceUsedForPromotion) {
        gradeStartDate.setFullYear(gradeStartDate.getFullYear() + Math.floor(gradeInfo.yearsOfServiceUsedForPromotion));
        // Add remaining months if any (approximate)
        const decimalPart = gradeInfo.yearsOfServiceUsedForPromotion % 1;
        gradeStartDate.setMonth(gradeStartDate.getMonth() + Math.round(decimalPart * 12));
    }

    // Filter courses: Only count courses taken AFTER the grade start date
    // Use 'courses' state, NOT 'employee.courses' which might be stale
    const coursesInCurrentGrade = courses.filter(c => {
        if (!c.course_date) return false;
        return new Date(c.course_date) >= gradeStartDate;
    });

    const weightedCount = countWeightedCourses(coursesInCurrentGrade, settings.course_settings?.two_week_weight || 2);

    const courseStatus = {
        current: weightedCount,
        required: gradeInfo.coursesRequired,
        deficit: Math.max(0, gradeInfo.coursesRequired - weightedCount),
        grade: gradeInfo.grade
    };

    return (
        <>
            <div className="space-y-6 pb-20">
                {/* Profile Strip Header */}
                <div className="bg-white dark:bg-slate-800 p-4 px-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => navigate('/admin/employees')} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400">
                            <ArrowRight size={20} />
                        </button>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                            {employee.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">{employee.full_name}</h1>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                <span className="font-mono bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px] font-bold">#{employee.company_id}</span>
                                <span className="opacity-30">•</span>
                                <span className="font-medium truncate">{employee.job_title}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                        <button
                            onClick={() => setMessageOpen(true)}
                            className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary hover:text-white transition-all text-sm group"
                        >
                            <MessageSquare size={18} className="transition-transform group-hover:scale-110" />
                            إرسال رسالة
                        </button>
                        <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden md:block mx-1"></div>
                        <button
                            onClick={() => {
                                const sidePanel = document.querySelector('.qr-card-anchor');
                                sidePanel?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                            title="الانتقال للرمز"
                        >
                            <QrCode size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Panel: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <form onSubmit={handleUpdateEmployee} className="space-y-10">
                                {/* Section 1: Basic Info */}
                                <div>
                                    <h4 className="font-bold text-base mb-4 text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <UserCog size={18} className="text-primary" />
                                        المعلومات الأساسية
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الاسم الكامل</label>
                                            <input type="text" name="full_name" value={employee.full_name || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الرقم الوظيفي</label>
                                            <input type="text" name="company_id" value={employee.company_id || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الجنس</label>
                                            <select name="gender" value={employee.gender || 'male'} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                                <option value="male">ذكر</option>
                                                <option value="female">أنثى</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">تاريخ التعيين</label>
                                            <input type="date" name="hire_date" value={employee.hire_date || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">موقع العمل</label>
                                            <input type="text" name="work_location" value={employee.work_location || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">نظام العمل</label>
                                            <select name="work_schedule" value={employee.work_schedule || 'morning'} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                                <option value="morning">صباحي</option>
                                                <option value="shift">مناوب</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Job Details */}
                                <div>
                                    <h4 className="font-bold text-base mb-4 text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <Briefcase size={18} className="text-indigo-500" />
                                        المعلومات الوظيفية
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">العنوان الوظيفي</label>
                                            <input type="text" name="job_title" value={employee.job_title || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">المنصب</label>
                                            <input type="text" name="position" value={employee.position || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">رصيد الإجازات</label>
                                            <input type="number" name="leave_balance" value={employee.leave_balance || 0} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">مدة الخدمة (محسوبة)</label>
                                            <div className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300">
                                                {calculateServiceDuration(employee.hire_date, employee.bonus_service_months).display}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الدرجة الوظيفية (محسوبة)</label>
                                            <div className="w-full p-2.5 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold">
                                                {calculateJobGrade(employee.certificate, calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal).display}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Education */}
                                <div>
                                    <h4 className="font-bold text-base mb-4 text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <GraduationCap size={18} className="text-purple-500" />
                                        التحصيل الدراسي
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الشهادة</label>
                                            <input type="text" name="certificate" value={employee.certificate || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الاختصاص</label>
                                            <input type="text" name="specialization" value={employee.specialization || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">اسم الجامعة</label>
                                            <input type="text" name="university_name" value={employee.university_name || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">اسم الكلية</label>
                                            <input type="text" name="college_name" value={employee.college_name || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">سنة التخرج</label>
                                            <input type="text" name="graduation_year" value={employee.graduation_year || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">صورة وثيقة التخرج</label>
                                            <div className="flex items-center gap-2">
                                                <label className="flex-1 cursor-pointer">
                                                    <div className="flex items-center justify-center p-2.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                        <Upload size={16} className="mr-2" />
                                                        <span className="text-xs">تحديث</span>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleCertUpload} />
                                                </label>
                                                {employee.graduation_certificate_url && (
                                                    <div className="flex gap-1">
                                                        <a href={employee.graduation_certificate_url} target="_blank" className="p-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30">
                                                            <Eye size={18} />
                                                        </a>
                                                        <button type="button" onClick={handleDeleteCert} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: Contact & Personal */}
                                <div>
                                    <h4 className="font-bold text-base mb-4 text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <User size={18} className="text-orange-500" />
                                        المعلومات الشخصية والاتصال
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</label>
                                            <input type="text" name="phone_number" value={employee.phone_number || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-mono text-left direction-ltr" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">البريد الإلكتروني</label>
                                            <input type="email" name="email" value={employee.email || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-left direction-ltr" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">عنوان السكن</label>
                                            <input type="text" name="address" value={employee.address || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الحالة الاجتماعية</label>
                                            <select name="marital_status" value={employee.marital_status || 'single'} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                                <option value="single">أعزب/باكر</option>
                                                <option value="married">متزوج</option>
                                                <option value="divorced">مطلق</option>
                                                <option value="widowed">أرمل</option>
                                            </select>
                                        </div>
                                        {employee.marital_status === 'married' && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">اسم الزوج/الزوجة</label>
                                                <input type="text" name="spouse_name" value={employee.spouse_name || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 6: Security */}
                                <div className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <h4 className="font-bold text-base mb-2 text-slate-800 dark:text-white flex items-center gap-2">
                                        <Shield size={18} className="text-red-500" />
                                        الأمان
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">كلمة المرور الحالية</label>
                                        <input type="text" value={employee.visible_password || ''} readOnly className="w-full md:w-1/2 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono" />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" disabled={saving} className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-sky-600 font-bold shadow-lg shadow-primary/20 w-full md:w-auto flex items-center justify-center gap-2">
                                        {saving ? 'جاري الحفظ...' : <><Save size={18} /> حفظ كافة التغييرات</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* QR Code Anchor Card */}
                        <div className="qr-card-anchor bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                                <QrCode className="text-primary" size={20} />
                                بطاقة الدخول الذكية
                            </h3>
                            <UserQRCode employee={employee} />
                        </div>

                        {/* Official Documents */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><Shield className="text-primary" size={20} /> المستمسكات الرسمية</h3>
                            <div className="space-y-3">
                                {[
                                    { id: 'national_id', name: 'البطاقة الوطنية', key: 'national_id_url' },
                                    { id: 'residency_card', name: 'بطاقة السكن', key: 'residency_card_url' },
                                    { id: 'marriage_contract', name: 'عقد الزواج', key: 'marriage_contract_url' },
                                    { id: 'ration_card', name: 'البطاقة التموينية', key: 'ration_card_url' }
                                ].map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{doc.name}</span>
                                            <span className={`text-xs ${employee[doc.key] ? 'text-green-500' : 'text-slate-400'}`}>{employee[doc.key] ? 'متوفر' : 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {employee[doc.key] ? (
                                                <>
                                                    <a href={employee[doc.key]} target="_blank" className="text-xs font-bold text-primary px-2 py-1 rounded">فتح</a>
                                                    <button onClick={() => handleDeleteDocument(doc.key, doc.name)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                                                </>
                                            ) : (
                                                <label className="cursor-pointer text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                    <Upload size={14} /> رفع
                                                    <input type="file" className="hidden" onChange={(e) => handleOfficialDocUpload(e, doc.key)} accept=".jpg,.jpeg,.png,.pdf" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Appreciation Letters */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><FileText className="text-slate-500" size={20} /> الكتب (شكر / عقوبات)</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                                {letters.map(doc => {
                                    const isSanction = doc.bonus_months < 0
                                    return (
                                        <div key={doc.id} className={`p-4 rounded-xl border ${isSanction ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold ${isSanction ? 'text-red-600' : 'text-green-600'}`}>{isSanction ? 'عقوبة' : 'شكر'}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${isSanction ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>
                                                            {doc.bonus_months > 0 ? `+${doc.bonus_months} شهر` : `${doc.bonus_months} شهر`}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{doc.title}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <a href={doc.file_url} target="_blank" className="p-1.5 text-slate-400 hover:text-primary"><Eye size={16} /></a>
                                                    <button onClick={() => handleDeleteLetter(doc.id, doc.bonus_months)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex gap-2 mb-3 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button onClick={() => { setLetterType('thanks'); setBonusMonths(1) }} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${letterType === 'thanks' ? 'bg-white dark:bg-slate-600 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>شكر وتقدير</button>
                                <button onClick={() => { setLetterType('sanction'); setBonusMonths(-1) }} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${letterType === 'sanction' ? 'bg-white dark:bg-slate-600 text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>عقوبة / خصم</button>
                            </div>

                            {/* Bonus/Deduction Value Selector */}
                            <div className="mb-4 space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 block px-1">
                                    {letterType === 'thanks' ? 'مدة القدم (أشهر):' : 'مدة الخصم (أشهر):'}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {letterType === 'thanks' ? (
                                        <>
                                            <button onClick={() => setBonusMonths(1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${bonusMonths === 1 ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>شهر واحد</button>
                                            <button onClick={() => setBonusMonths(6)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${bonusMonths === 6 ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>6 أشهر</button>
                                            <input
                                                type="number"
                                                placeholder="مخصص"
                                                value={bonusMonths !== 1 && bonusMonths !== 6 ? bonusMonths : ''}
                                                onChange={(e) => setBonusMonths(parseInt(e.target.value) || 0)}
                                                className="w-16 px-2 py-1.5 text-xs font-bold text-center border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setBonusMonths(-1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${bonusMonths === -1 ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>شهر واحد</button>
                                            <button onClick={() => setBonusMonths(-3)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${bonusMonths === -3 ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>3 أشهر</button>
                                            <input
                                                type="number"
                                                placeholder="مخصص"
                                                value={bonusMonths !== -1 && bonusMonths !== -3 ? Math.abs(bonusMonths) : ''}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setBonusMonths(val > 0 ? -val : val);
                                                }}
                                                className="w-16 px-2 py-1.5 text-xs font-bold text-center border border-slate-200 rounded-lg outline-none focus:border-red-400"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <label className={`cursor-pointer block w-full p-3 border-2 border-dashed rounded-xl text-center transition-colors ${uploadingLetter ? 'bg-slate-50 border-slate-300' : letterType === 'thanks' ? 'border-green-200 hover:bg-green-50' : 'border-red-200 hover:bg-red-50'}`}>
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'letter')} />
                                <span className="text-xs font-bold text-slate-500">{uploadingLetter ? 'جاري الرفع...' : 'رفع كتاب'}</span>
                            </label>
                        </div>

                        {/* Salary Slips */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><FileText className="text-green-500" size={20} /> أشرطة الراتب</h3>
                            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                {slips.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold">{formatMonthYear(doc.month_year)}</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">شريط الراتب</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <a href={doc.file_url} target="_blank" className="p-1 px-2 bg-primary/10 text-primary rounded text-xs">عرض</a>
                                            <button onClick={() => handleDeleteSlip(doc.id)} className="p-1 text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <input type="month" value={slipDate} onChange={e => setSlipDate(e.target.value)} className="w-full text-xs p-2 rounded border dark:bg-slate-700 dark:text-white mb-2 outline-none" />
                            <label className="block w-full text-center border-2 border-dashed border-green-200 dark:border-green-800 rounded-lg p-3 cursor-pointer">
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'slip')} />
                                <span className="text-xs font-bold text-green-600">{uploadingSlip ? 'جاري الرفع...' : 'رفع شريط'}</span>
                            </label>
                        </div>

                        {/* Courses Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                                        <Star className="text-amber-500" size={20} />
                                        الدورات والترقية
                                    </h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${courseStatus.deficit > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {courseStatus.deficit > 0 ? `نقص ${courseStatus.deficit}` : 'مستوفي'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    تم احتساب المطلوب بناءً على الدرجة الوظيفية الحالية
                                </p>
                            </div>

                            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                                {courses.map(course => (
                                    <div key={course.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 group">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{course.course_name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {formatDate(course.course_date)}
                                                </span>
                                                {course.duration && (
                                                    <span className="text-[10px] bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {course.duration}
                                                    </span>
                                                )}
                                                {course.location && (
                                                    <span className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <MapPin size={10} />
                                                        {course.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => handleEditCourse(course)} className="text-slate-400 hover:text-primary"><Edit3 size={14} /></button>
                                            <button type="button" onClick={() => handleDeleteCourse(course.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {addingCourse ? (
                                <div className="space-y-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-primary/20">
                                    <input
                                        type="text"
                                        placeholder="اسم الدورة"
                                        value={newCourse.course_name}
                                        onChange={e => setNewCourse({ ...newCourse, course_name: e.target.value })}
                                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="date"
                                            value={newCourse.course_date}
                                            onChange={e => setNewCourse({ ...newCourse, course_date: e.target.value })}
                                            className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
                                        />
                                        <select
                                            value={newCourse.duration}
                                            onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })}
                                            className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="أسبوع">أسبوع</option>
                                            <option value="أسبوعين">أسبوعين</option>
                                            <option value="3 أيام">3 أيام</option>
                                            <option value="أخرى">أخرى</option>
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="مكان الانعقاد"
                                        value={newCourse.location}
                                        onChange={e => setNewCourse({ ...newCourse, location: e.target.value })}
                                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
                                    />
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={handleAddCourse} className="flex-1 bg-primary text-white py-1.5 rounded text-xs font-bold">إضافة</button>
                                        <button onClick={() => setAddingCourse(false)} className="flex-1 bg-slate-200 text-slate-600 py-1.5 rounded text-xs font-bold">إلغاء</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingCourse(true)}
                                    className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-primary hover:border-primary/50 text-xs font-bold flex items-center justify-center gap-1"
                                >
                                    <Plus size={14} /> إضافة دورة
                                </button>
                            )}

                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2 px-1">
                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>المجموع الموزون للدورات:</span>
                                    <span className="font-bold text-primary">{courseStatus.current}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>المطلوب للدرجة {courseStatus.grade} (فقط):</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{courseStatus.required}</span>
                                </div>
                                <div className="text-[9px] text-slate-400 text-center bg-slate-50 dark:bg-slate-800 p-1 rounded border border-slate-100 dark:border-slate-700">
                                    يتم احتساب الدورات من تاريخ: {gradeStartDate.toLocaleDateString('en-GB')}
                                </div>
                                {courseStatus.deficit > 0 && (
                                    <div className="flex justify-between items-center text-[10px] bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30">
                                        <span>النقص الحالي:</span>
                                        <span>{courseStatus.deficit} دورات</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {messageOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white">إرسال رسالة للموظف</h3>
                            <button onClick={() => setMessageOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">عنوان الرسالة</label>
                                <input
                                    type="text"
                                    required
                                    value={messageData.title}
                                    onChange={e => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="مثلاً: تنبيه إداري، تحديث بيانات..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">نص الرسالة</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={messageData.body}
                                    onChange={e => setMessageData(prev => ({ ...prev, body: e.target.value }))}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    placeholder="اكتب رسالتك هنا..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={sendingMessage}
                                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    {sendingMessage ? 'جاري الإرسال...' : (
                                        <>
                                            <MessageSquare size={20} />
                                            إرسال الرسالة
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageOpen(false)}
                                    className="px-6 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
