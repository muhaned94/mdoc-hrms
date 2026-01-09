import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Save, Upload, FileText, ArrowRight, UserCog, Shield, Trash, Trash2, GraduationCap, Plus, Star, Edit3, AlertTriangle, Eye } from 'lucide-react'
import { calculateServiceDuration, formatDate } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'

export default function EmployeeDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    /* ... */
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!messageData.title || !messageData.body) return

        if (!user) {
            alert('خطأ: المستخدم غير مسجل الدخول')
            return
        }

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
            console.error(err)
            alert('فشل إرسال الرسالة: ' + (err.message || 'خطأ غير معروف'))
        } finally {
            setSendingMessage(false)
        }
    }
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
            // navigate('/admin/employees')
        } finally {
            setLoading(false)
        }
    }

    const fetchDocuments = async () => {
        // Fetch orders and salary slips
        const { data: ordersData } = await supabase.from('admin_orders').select('*').eq('employee_id', id)
        setOrders(ordersData || [])

        const { data: slipsData } = await supabase.from('salary_slips').select('*').eq('employee_id', id)
        setSlips(slipsData || [])

        const { data: coursesData } = await supabase.from('courses').select('*').eq('employee_id', id).order('course_date', { ascending: false })
        setCourses(coursesData || [])

        fetchLetters() // Ensure letters are fetched with documents
    }

    const fetchLetters = async () => {
        try {
            const { data, error } = await supabase
                .from('appreciation_letters')
                .select('*')
                .eq('employee_id', id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching letters:', error.message)
                return
            }
            setLetters(data || [])
        } catch (err) {
            console.error('Catch error in fetchLetters:', err)
        }
    }

    const handleDeleteLetter = async (letterId, bonusValue) => {
        if (!confirm('هل أنت متأكد من حذف كتاب الشكر هذا؟ سيتم خصم مدة الخدمة المضافة.')) return
        try {
            const { error: delErr } = await supabase.from('appreciation_letters').delete().eq('id', letterId)
            if (delErr) throw delErr

            const { data: emp, error: empErr } = await supabase.from('employees').select('bonus_service_months').eq('id', id).single()
            if (empErr) throw empErr

            const { error: updErr } = await supabase.from('employees').update({
                bonus_service_months: (emp.bonus_service_months || 0) - bonusValue
            }).eq('id', id)
            if (updErr) throw updErr

            await fetchLetters()
            await fetchEmployee()
        } catch (err) {
            alert('فشل حذف الكتاب: ' + err.message)
        }
    }

    const handleEditLetterTitle = async (letterId) => {
        const newTitle = prompt('أدخل العنوان الجديد:')
        if (!newTitle) return
        try {
            const { error } = await supabase.from('appreciation_letters').update({ title: newTitle }).eq('id', letterId)
            if (error) throw error
            await fetchLetters()
        } catch (err) {
            alert('فشل تحديث العنوان')
        }
    }

    const handleDeleteOrder = async (orderId) => {
        if (!confirm('هل أنت متأكد من حذف هذا الأمر الإداري؟')) return
        try {
            const { error } = await supabase.from('admin_orders').delete().eq('id', orderId)
            if (error) throw error
            fetchDocuments()
        } catch (err) {
            alert('فشل الحذف')
        }
    }

    const handleEditOrderTitle = async (orderId) => {
        const newTitle = prompt('أدخل العنوان الجديد للأمر الإداري:')
        if (!newTitle) return
        try {
            const { error } = await supabase.from('admin_orders').update({ title: newTitle }).eq('id', orderId)
            if (error) throw error
            fetchDocuments()
        } catch (err) {
            alert('فشل التعديل')
        }
    }

    const handleAddCourse = async (e) => {
        e.preventDefault()
        setAddingCourse(true)
        try {
            const { error } = await supabase.from('courses').insert({
                employee_id: id,
                course_name: newCourse.course_name,
                course_date: newCourse.course_date
            })
            if (error) throw error
            setNewCourse({ course_name: '', course_date: '' })
            fetchDocuments() // Refresh list
        } catch (err) {
            alert('فشل إضافة الدورة')
        } finally {
            setAddingCourse(false)
        }
    }

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return
        try {
            const { error } = await supabase.from('courses').delete().eq('id', courseId)
            if (error) throw error
            fetchDocuments()
        } catch (err) {
            alert('فشل الحذف')
        }
    }

    const handleEditCourse = async (course) => {
        const newName = prompt('تعديل اسم الدورة:', course.course_name)
        if (!newName) return
        const newDate = prompt('تعديل تاريخ الدورة (YYYY-MM-DD):', course.course_date)
        if (!newDate) return

        try {
            const { error } = await supabase.from('courses').update({
                course_name: newName,
                course_date: newDate
            }).eq('id', course.id)
            if (error) throw error
            fetchDocuments()
        } catch (err) {
            alert('فشل تعديل الدورة')
        }
    }

    const handleDeleteSlip = async (slipId) => {
        if (!confirm('هل أنت متأكد من حذف شريط الراتب هذا؟')) return
        try {
            const { error } = await supabase.from('salary_slips').delete().eq('id', slipId)
            if (error) throw error
            fetchDocuments()
        } catch (err) {
            alert('فشل حذف شريط الراتب')
        }
    }

    const handleEditSlipDate = async (slipId) => {
        const newDate = prompt('أدخل التاريخ الجديد (YYYY-MM):')
        if (!newDate) return
        try {
            // Validate format or just pass it
            const { error } = await supabase.from('salary_slips').update({ month_year: newDate }).eq('id', slipId)
            if (error) throw error
            fetchDocuments()
        } catch (err) {
            alert('فشل تحديث تاريخ شريط الراتب')
        }
    }

    const handleDeleteCert = async () => {
        if (!confirm('هل أنت متأكد من حذف وثيقة التخرج؟')) return
        try {
            const { error } = await supabase.from('employees').update({ graduation_certificate_url: null }).eq('id', id)
            if (error) throw error

            setEmployee(prev => ({ ...prev, graduation_certificate_url: null }))
            alert('تم حذف الوثيقة بنجاح')
        } catch (err) {
            alert('فشل حذف الوثيقة: ' + err.message)
        }
    }

    // --- Official Documents Handlers (Admin Only) ---
    const handleDeleteDocument = async (docKey, docName) => {
        if (!confirm(`هل أنت متأكد من حذف ${docName}؟`)) return
        try {
            const { error } = await supabase.from('employees').update({ [docKey]: null }).eq('id', id)
            if (error) throw error
            setEmployee(prev => ({ ...prev, [docKey]: null }))
        } catch (err) {
            alert('فشل حذف المستمسك: ' + err.message)
        }
    }

    const handleOfficialDocUpload = async (e, docKey) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const ext = file.name.split('.').pop()
            const fileName = `${id}/${docKey}_${Date.now()}.${ext}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName)

            // 3. Update Database
            const { error: updateError } = await supabase
                .from('employees')
                .update({ [docKey]: publicUrl })
                .eq('id', id)

            if (updateError) throw updateError

            setEmployee(prev => ({ ...prev, [docKey]: publicUrl }))
            alert('تم رفع المستمسك بنجاح')
        } catch (err) {
            console.error(err)
            alert('فشل رفع المستمسك: ' + err.message)
        }
    }




    const handleChange = (e) => {
        const { name, value } = e.target
        setEmployee(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Sanitize payload: remove non-updatable fields
            const { id: _, created_at, ...updates } = employee

            const { error } = await supabase
                .from('employees')
                .update(updates)
                .eq('id', id)

            if (error) throw error
            alert('تم تحديث البيانات بنجاح')
        } catch (error) {
            console.error('Update Error:', error)
            alert('حدث خطأ أثناء التحديث: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleFileUpload = async (file, type) => {
        if (!file) return
        const bucket = (type === 'order' || type === 'letter') ? 'documents' : 'salary-slips' // Ensure buckets exist
        const ext = file.name.split('.').pop()
        const fileName = `${id}/${Date.now()}.${ext}`

        try {
            if (type === 'order') setUploadingOrder(true)
            else if (type === 'letter') setUploadingLetter(true)
            else setUploadingSlip(true)

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file)

            if (error) throw error

            const publicUrl = supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl

            // Insert into DB
            if (type === 'order') {
                const { error: insErr } = await supabase.from('admin_orders').insert({
                    employee_id: id,
                    title: file.name,
                    file_url: publicUrl
                })
                if (insErr) throw insErr
            } else if (type === 'letter') {
                const { error: insErr } = await supabase.from('appreciation_letters').insert({
                    employee_id: id,
                    title: file.name,
                    file_url: publicUrl,
                    bonus_months: bonusMonths
                })
                if (insErr) throw insErr

                // Update employee total bonus months
                const { data: emp, error: empErr } = await supabase.from('employees').select('bonus_service_months').eq('id', id).single()
                if (empErr) throw empErr

                const { error: updErr } = await supabase.from('employees').update({
                    bonus_service_months: (emp.bonus_service_months || 0) + bonusMonths
                }).eq('id', id)
                if (updErr) throw updErr

                await fetchLetters()
                await fetchEmployee() // Refresh for service calc
            } else {
                const { error: insErr } = await supabase.from('salary_slips').insert({
                    employee_id: id,
                    month_year: slipDate ? `${slipDate}-01` : new Date().toISOString(),
                    file_url: publicUrl
                })
                if (insErr) throw insErr
            }

            fetchDocuments()
        } catch (err) {
            alert('فشل الرفع: ' + err.message)
        } finally {
            if (type === 'order') setUploadingOrder(false)
            else setUploadingSlip(false)
        }
    }

    const handleCertUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const ext = file.name.split('.').pop()
            const fileName = `certificates/${id}_${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('documents').getPublicUrl(fileName)

            // Update local state immediately so user sees change pending save
            setEmployee(prev => ({ ...prev, graduation_certificate_url: data.publicUrl }))

            // Optional: Auto-save field to DB immediately 
            // const { error: dbError } = await supabase.from('employees').update({ graduation_certificate_url: data.publicUrl }).eq('id', id)
            // if (dbError) throw dbError

            alert('تم رفع الشهادة بنجاح. اضغط "حفظ التغييرات" لتثبيت التعديلات.')
        } catch (err) {
            alert('فشل رفع الملف: ' + err.message)
        }
    }

    // Course Requirements Logic
    const getCourseStatus = () => {
        if (!employee) return { required: 0, current: 0, deficit: 0, text: '' }

        const serviceYears = calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal
        const gradeInfo = calculateJobGrade(employee.certificate, serviceYears)
        const numericGrade = gradeInfo.grade || 10 // Default to lower rank if unknown

        // Grade 6+ (6,7,8...) -> 4 courses
        // Grade 5- (5,4,3,2,1) -> 5 courses
        const required = numericGrade >= 6 ? 4 : 5
        const current = courses.length
        const deficit = Math.max(required - current, 0)

        return { required, current, deficit, grade: numericGrade }
    }

    const courseStatus = getCourseStatus()


    if (loading) return <div className="text-center p-10">جاري التحميل...</div>
    if (!employee) return <div className="text-center p-10">الموظف غير موجود</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/employees')} className="p-2 hover:bg-slate-200 rounded-full">
                    <ArrowRight size={24} />
                </button>
                <h1 className="text-2xl font-bold">{employee.full_name}</h1>
                <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-500">{employee.company_id}</span>
                <div className="flex-1"></div>
                <button
                    onClick={() => setMessageOpen(true)}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-bold"
                >
                    <FileText size={18} />
                    إرسال رسالة/تبليغ
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <UserCog className="text-primary" size={20} />
                            بيانات الموظف
                        </h3>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Simplified fields for brevity - would encompass all fields */}
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">الاسم الكامل</label>
                                <input name="full_name" value={employee.full_name || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">العنوان الوظيفي</label>
                                <input name="job_title" value={employee.job_title || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">المنصب</label>
                                <input name="position" value={employee.position || ''} onChange={handleChange} className="w-full p-2 border rounded" placeholder="مثال: مدير قسم" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">الشهادة</label>
                                <input name="certificate" value={employee.certificate || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        value={employee.full_name}
                                        onChange={(e) => setEmployee({ ...employee, full_name: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={employee.phone_number || ''}
                                        onChange={(e) => setEmployee({ ...employee, phone_number: e.target.value })}
                                        className="w-full border rounded-lg p-2 font-mono text-left direction-ltr"
                                        placeholder="07xxxxxxxxx"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={employee.email || ''}
                                        onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                                        className="w-full border rounded-lg p-2 font-mono text-left direction-ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">عنوان السكن</label>
                                    <input
                                        type="text"
                                        value={employee.address || ''}
                                        onChange={(e) => setEmployee({ ...employee, address: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">رقم الشركة</label>
                                    <input
                                        type="text"
                                        value={employee.company_id}
                                        onChange={(e) => setEmployee({ ...employee, company_id: e.target.value })}
                                        className="w-full border rounded-lg p-2 bg-slate-50 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">المنصب</label>
                                    <input
                                        type="text"
                                        value={employee.position || ''}
                                        onChange={(e) => setEmployee({ ...employee, position: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">العنوان الوظيفي</label>
                                    <input
                                        type="text"
                                        value={employee.job_title}
                                        onChange={(e) => setEmployee({ ...employee, job_title: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">موقع العمل</label>
                                    <input
                                        type="text"
                                        value={employee.work_location}
                                        onChange={(e) => setEmployee({ ...employee, work_location: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">نظام العمل</label>
                                    <select
                                        value={employee.work_schedule}
                                        onChange={(e) => setEmployee({ ...employee, work_schedule: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="morning">صباحي</option>
                                        <option value="shift">مناوبات</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">تاريخ التعيين</label>
                                    <input
                                        type="date"
                                        value={employee.hire_date}
                                        onChange={(e) => setEmployee({ ...employee, hire_date: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">الشهادة</label>
                                    <input
                                        type="text"
                                        value={employee.certificate || ''}
                                        onChange={(e) => setEmployee({ ...employee, certificate: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">الاختصاص</label>
                                    <input
                                        type="text"
                                        value={employee.specialization || ''}
                                        onChange={(e) => setEmployee({ ...employee, specialization: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">مدة الخدمة (محسوبة)</label>
                                    <div className="w-full border rounded-lg p-2 bg-slate-50 text-slate-700">
                                        {calculateServiceDuration(employee.hire_date, employee.bonus_service_months).display}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">الدرجة الوظيفية (محسوبة)</label>
                                    <div className="w-full border rounded-lg p-2 bg-sky-50 text-sky-700 font-bold">
                                        {calculateJobGrade(employee.certificate, calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal).display}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm text-slate-500 mb-1">رصيد الإجازات</label>
                                <input
                                    type="number"
                                    value={employee.leave_balance || 0}
                                    onChange={(e) => setEmployee({ ...employee, leave_balance: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">الراتب الاسمي</label>
                                <input type="number" name="nominal_salary" value={employee.nominal_salary || 0} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">الراتب الكلي</label>
                                <input type="number" name="total_salary" value={employee.total_salary || 0} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">الحافز الشهري (تقديري)</label>
                                <input type="number" name="incentive" value={employee.incentive || 0} onChange={handleChange} className="w-full p-2 border rounded bg-green-50 border-green-200" />
                            </div>

                            <div className="md:col-span-2 border-t pt-2 mt-2">
                                <h4 className="font-bold text-sm mb-3 text-slate-700 flex items-center gap-2">معلومات الاتصال والشخصية</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">رقم الهاتف</label>
                                        <input name="phone_number" value={employee.phone_number || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">البريد الإلكتروني</label>
                                        <input name="email" value={employee.email || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </div>



                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">الحالة الاجتماعية</label>
                                        <select name="marital_status" value={employee.marital_status || 'single'} onChange={handleChange} className="w-full p-2 border rounded">
                                            <option value="single">أعزب/باكر</option>
                                            <option value="married">متزوج</option>
                                            <option value="divorced">مطلق</option>
                                            <option value="widowed">أرمل</option>
                                        </select>
                                    </div>
                                    {employee.marital_status === 'married' && (
                                        <div className="space-y-1">
                                            <label className="text-sm text-slate-500">اسم الزوج/الزوجة</label>
                                            <input name="spouse_name" value={employee.spouse_name || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">الجنس</label>
                                        <select name="gender" value={employee.gender || 'male'} onChange={handleChange} className="w-full p-2 border rounded">
                                            <option value="male">ذكر</option>
                                            <option value="female">أنثى</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* New Section: Education */}
                            <div className="md:col-span-2 border-t pt-2 mt-2">
                                <h4 className="font-bold text-sm mb-3 text-slate-700 flex items-center gap-2">التعليم والشهادة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">اسم الجامعة</label>
                                        <input name="university_name" value={employee.university_name || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">اسم الكلية</label>
                                        <input name="college_name" value={employee.college_name || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">سنة التخرج</label>
                                        <input name="graduation_year" value={employee.graduation_year || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-500">صورة وثيقة التخرج</label>
                                        <div className="flex flex-col gap-2">
                                            {employee.graduation_certificate_url && (
                                                <div className="flex items-center gap-4">
                                                    <a href={employee.graduation_certificate_url} target="_blank" className="text-primary hover:underline font-bold text-sm flex items-center gap-1">
                                                        <FileText size={16} /> عرض الحالية
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={handleDeleteCert}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="حذف الوثيقة"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <input type="file" onChange={handleCertUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" accept="image/*,.pdf" />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-bold text-sm mb-3 text-slate-700 flex items-center gap-2">
                                    <Shield size={16} /> Data Security
                                </h4>
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-500">كلمة المرور (غير مشفرة)</label>
                                    <input name="visible_password" value={employee.visible_password || ''} onChange={handleChange} className="w-full p-2 border rounded bg-slate-50 font-mono" />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-sky-600 w-full md:w-auto">
                                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Side Panel: Documents */}
                <div className="space-y-6">
                    {/* Official Documents (New Section) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Shield className="text-primary" size={20} />
                            المستمسكات الرسمية
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'national_id', name: 'البطاقة الوطنية', key: 'national_id_url' },
                                { id: 'residency_card', name: 'بطاقة السكن', key: 'residency_card_url' },
                                { id: 'marriage_contract', name: 'عقد الزواج', key: 'marriage_contract_url' },
                                { id: 'ration_card', name: 'البطاقة التموينية', key: 'ration_card_url' }
                            ].map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                                        <span className={`text-xs ${employee[doc.key] ? 'text-green-500' : 'text-slate-400'}`}>
                                            {employee[doc.key] ? 'متوفر' : 'غير متوفر'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {employee[doc.key] ? (
                                            <>
                                                <a
                                                    href={employee[doc.key]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-primary hover:underline hover:bg-sky-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    فتح
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.key, doc.name)}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer text-xs font-bold text-white bg-primary hover:bg-sky-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                <Upload size={14} />
                                                رفع
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => handleOfficialDocUpload(e, doc.key)}
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Appreciation Letters */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 ring-2 ring-slate-50">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="text-slate-500" size={20} />
                            الكتب الرسمية (شكر / عقوبات)
                        </h3>
                        <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar mb-6 p-1">
                            {letters.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                                    لا توجد كتب مسجلة
                                </div>
                            ) : (
                                letters.map(doc => {
                                    const isSanction = doc.bonus_months < 0
                                    return (
                                        <div key={doc.id} className={`flex items-start justify-between p-4 rounded-xl border transition-all hover:shadow-md ${isSanction ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                            <div className="flex gap-4">
                                                <div className={`p-3 rounded-lg ${isSanction ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {isSanction ? <AlertTriangle size={24} /> : <Star size={24} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isSanction ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                                                            {isSanction ? 'عقوبة إدارية' : 'كتاب شكر'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{formatDate(doc.created_at)}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 leading-tight mb-1">{doc.title}</span>
                                                    <span className={`text-xs font-bold ${isSanction ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {isSanction ? `تأخير ترفيع / خصم قدم (${Math.abs(doc.bonus_months)} شهر)` : `قدم ممتاز (${doc.bonus_months} شهر)`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="عرض الملف"
                                                >
                                                    <Eye size={18} />
                                                </a>
                                                <button
                                                    onClick={() => handleEditLetterTitle(doc.id)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-sky-50 rounded-lg transition-colors"
                                                    title="تعديل العنوان"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLetter(doc.id, doc.bonus_months)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="flex gap-2 mb-3 bg-slate-50 p-1 rounded-lg">
                            <button
                                onClick={() => {
                                    setLetterType('thanks')
                                    setBonusMonths(1)
                                }}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${letterType === 'thanks' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                            >
                                شكر وتقدير
                            </button>
                            <button
                                onClick={() => {
                                    setLetterType('sanction')
                                    setBonusMonths(-1)
                                }}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${letterType === 'sanction' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                            >
                                عقوبة / خصم
                            </button>
                        </div>

                        {letterType === 'thanks' ? (
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setBonusMonths(1)}
                                    className={`flex-1 py-1 px-2 text-[10px] border rounded transition-colors ${bonusMonths === 1 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    +1 شهر قدم
                                </button>
                                <button
                                    onClick={() => setBonusMonths(6)}
                                    className={`flex-1 py-1 px-2 text-[10px] border rounded transition-colors ${bonusMonths === 6 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    +6 أشهر قدم
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-red-500">مدة الخصم (أشهر):</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={Math.abs(bonusMonths)}
                                    onChange={(e) => setBonusMonths(-Math.abs(e.target.value))}
                                    className="w-16 p-1 text-sm border border-red-200 rounded text-center text-red-600 font-bold focus:outline-none focus:border-red-500"
                                />
                            </div>
                        )}

                        <label className={`block w-full text-center border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors ${letterType === 'thanks' ? 'border-amber-200 hover:bg-amber-50' : 'border-red-200 hover:bg-red-50'}`}>
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e.target.files[0], 'letter')} />
                            {letterType === 'thanks' ? (
                                <>
                                    <Upload className="mx-auto text-amber-400 mb-1" size={18} />
                                    <span className="text-xs text-amber-600 font-bold">{uploadingLetter ? 'جاري الرفع...' : 'رفع كتاب شكر'}</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="mx-auto text-red-400 mb-1" size={18} />
                                    <span className="text-xs text-red-600 font-bold">{uploadingLetter ? 'جاري الرفع...' : 'رفع كتاب عقوبة'}</span>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Admin Orders */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="text-indigo-500" size={20} />
                            الأوامر الإدارية
                        </h3>
                        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                            {orders.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد كتب</p>}
                            {orders.map(doc => (
                                <div key={doc.id} className="group/item flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 hover:border-indigo-200 shadow-sm transition-all">
                                    <div className="flex flex-col overflow-hidden flex-1">
                                        <span className="text-sm font-bold text-slate-700 truncate" title={doc.title}>{doc.title}</span>
                                        <span className="text-[10px] text-slate-400">{formatDate(doc.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditOrderTitle(doc.id)}
                                                className="p-1 text-slate-400 hover:text-primary hover:bg-sky-50 rounded transition-colors"
                                                title="تعديل العنوان"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(doc.id)}
                                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <a href={doc.file_url} target="_blank" className="text-xs font-bold text-primary px-2 py-1 bg-slate-50 rounded hover:bg-indigo-500 hover:text-white transition-all shadow-sm">عرض</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <label className="block w-full text-center border-2 border-dashed border-indigo-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-50 transition-colors">
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e.target.files[0], 'order')} />
                            <Upload className="mx-auto text-indigo-400 mb-2" size={20} />
                            <span className="text-sm text-indigo-600">{uploadingOrder ? 'جاري الرفع...' : 'رفع كتاب جديد'}</span>
                        </label>
                    </div>

                    {/* Salary Slips */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="text-green-500" size={20} />
                            أشرطة الراتب
                        </h3>
                        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                            {slips.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد ملفات</p>}
                            {slips.map(doc => (
                                <div key={doc.id} className="group/item flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 hover:border-green-200 shadow-sm transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">راتب شهر</span>
                                        <span className="text-[10px] text-slate-400">{formatDate(doc.month_year)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditSlipDate(doc.id)}
                                                className="p-1 text-slate-400 hover:text-primary hover:bg-sky-50 rounded transition-colors"
                                                title="تعديل التاريخ"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSlip(doc.id)}
                                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <a href={doc.file_url} target="_blank" className="text-xs font-bold text-primary px-2 py-1 bg-slate-50 rounded hover:bg-green-500 hover:text-white transition-all shadow-sm">عرض</a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mb-4">
                            <label className="block text-[10px] text-slate-400 mb-1">شهر الراتب:</label>
                            <input
                                type="month"
                                value={slipDate}
                                onChange={(e) => setSlipDate(e.target.value)}
                                className="w-full text-sm p-2 rounded border border-green-200 focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <label className="block w-full text-center border-2 border-dashed border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-50 transition-colors">
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e.target.files[0], 'slip')} />
                            <Upload className="mx-auto text-green-400 mb-2" size={20} />
                            <span className="text-sm text-green-600 font-bold">{uploadingSlip ? 'جاري الرفع...' : 'رفع شريط راتب'}</span>
                        </label>
                    </div>

                    {/* Training Courses */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <GraduationCap className="text-purple-500" size={20} />
                            الدورات التدريبية
                        </h3>

                        {/* Course Requirements Status */}
                        <div className={`mb-4 p-3 rounded-lg border ${courseStatus.deficit > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm text-slate-700">تحليل الموقف التدريبي</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${courseStatus.deficit > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {courseStatus.deficit > 0 ? `نقص ${courseStatus.deficit}` : 'مستوفي'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                الدرجة الوظيفية: {courseStatus.grade} | المطلوب: {courseStatus.required} | المنجز: {courseStatus.current}
                            </p>
                        </div>

                        {/* Add Course Form */}
                        <form onSubmit={handleAddCourse} className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <input
                                required
                                placeholder="اسم الدورة"
                                value={newCourse.course_name}
                                onChange={e => setNewCourse({ ...newCourse, course_name: e.target.value })}
                                className="w-full text-sm p-2 rounded mb-2 border border-purple-200"
                            />
                            <div className="flex gap-2">
                                <input
                                    required
                                    type="date"
                                    value={newCourse.course_date}
                                    onChange={e => setNewCourse({ ...newCourse, course_date: e.target.value })}
                                    className="text-sm p-2 rounded border border-purple-200 flex-1"
                                />
                                <button type="submit" disabled={addingCourse} className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 transition-colors">
                                    {addingCourse ? '...' : <Plus size={16} />}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {courses.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد دورات</p>}
                            {courses.map(course => (
                                <div key={course.id} className="group/item flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 hover:border-purple-200 shadow-sm transition-all">
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-bold text-slate-700 truncate">{course.course_name}</p>
                                        <p className="text-[10px] text-slate-400">{formatDate(course.course_date)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditCourse(course)}
                                            className="p-1 text-slate-400 hover:text-primary hover:bg-sky-50 rounded transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(course.id)}
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {messageOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <FileText size={20} />
                                إرسال رسالة للموظف
                            </h3>
                            <button onClick={() => setMessageOpen(false)} className="hover:bg-white/20 p-1 rounded">
                                <Trash size={20} className="rotate-45" /> {/* Close Icon */}
                            </button>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">عنوان الرسالة</label>
                                <input
                                    required
                                    value={messageData.title}
                                    onChange={e => setMessageData({ ...messageData, title: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="مثال: تبليغ إداري"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">نص الرسالة</label>
                                <textarea
                                    required
                                    value={messageData.body}
                                    onChange={e => setMessageData({ ...messageData, body: e.target.value })}
                                    className="w-full p-2 border rounded h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="اكتب التبليغ أو الرسالة هنا..."
                                ></textarea>
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setMessageOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">إلغاء</button>
                                <button type="submit" disabled={sendingMessage} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">
                                    {sendingMessage ? 'جاري الإرسال...' : 'إرسال'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
