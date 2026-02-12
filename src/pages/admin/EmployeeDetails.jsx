import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Save, Upload, FileText, ArrowRight, UserCog, Shield, Trash, Trash2, GraduationCap, Plus, Star, Edit3, AlertTriangle, Eye, Briefcase, User, Wallet } from 'lucide-react'
import { calculateServiceDuration, formatDate, formatMonthYear } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'
import UserQRCode from '../../components/UserQRCode'

export default function EmployeeDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
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
    const [newCourse, setNewCourse] = useState({ course_name: '', course_date: '' })

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
            await supabase.from('courses').insert({ employee_id: id, ...newCourse })
            setNewCourse({ course_name: '', course_date: '' })
            fetchDocuments()
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
        if (n && d) {
            await supabase.from('courses').update({ course_name: n, course_date: d }).eq('id', course.id)
            fetchDocuments()
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

    const courseStatus = (() => {
        const gradeInfo = calculateJobGrade(employee.certificate, calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal)
        const req = gradeInfo.coursesRequired || 0
        const cur = courses.length
        return { required: req, current: cur, deficit: Math.max(0, req - cur), grade: gradeInfo.grade }
    })()

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate('/admin/employees')} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400">
                        <ArrowRight size={24} />
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-inner">
                        {employee.full_name?.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{employee.full_name}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">#{employee.company_id}</span>
                            <span>•</span>
                            <span>{employee.job_title}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button onClick={() => setMessageOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                        <FileText size={18} />
                        إرسال رسالة
                    </button>
                    <UserQRCode employee={employee} />
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

                            {/* Section 5: Contact & Personal */}
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
                                                <span className={`text-[10px] font-bold ${isSanction ? 'text-red-600' : 'text-amber-600'}`}>{isSanction ? 'عقوبة' : 'شكر'}</span>
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
                        <div className="flex gap-2 mb-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button onClick={() => { setLetterType('thanks'); setBonusMonths(1) }} className={`flex-1 py-1 text-xs font-bold rounded ${letterType === 'thanks' ? 'bg-white dark:bg-slate-600 text-green-600' : 'text-slate-400'}`}>شكر</button>
                            <button onClick={() => { setLetterType('sanction'); setBonusMonths(-1) }} className={`flex-1 py-1 text-xs font-bold rounded ${letterType === 'sanction' ? 'bg-white dark:bg-slate-600 text-red-600' : 'text-slate-400'}`}>عقوبة</button>
                        </div>
                        <label className="block w-full text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer">
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
                </div>
            </div>
        </div>
    )
}
