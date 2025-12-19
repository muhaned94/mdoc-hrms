import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Save, Upload, FileText, ArrowRight, UserCog, Shield, Trash, Trash2, GraduationCap, Plus, Star, Edit3 } from 'lucide-react'
import { calculateServiceDuration, formatDate } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'

export default function EmployeeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
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
          bonus_service_months: Math.max(0, (emp.bonus_service_months || 0) - bonusValue) 
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
      if(!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return
      try {
          const { error } = await supabase.from('courses').delete().eq('id', courseId)
          if(error) throw error
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setEmployee(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
      
      if (error) throw error
      alert('تم تحديث البيانات بنجاح')
    } catch (error) {
      alert('حدث خطأ أثناء التحديث')
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

  if (loading) return <div className="text-center p-10">جاري التحميل...</div>
  if (!employee) return <div className="text-center p-10">الموظف غير موجود</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/employees')} className="p-2 hover:bg-slate-200 rounded-full">
            <ArrowRight size={24} />
        </button>
        <h1 className="text-2xl font-bold">{employee.full_name}</h1>
        <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-500">{employee.company_id}</span>
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
               <div className="space-y-1">
                    <label className="text-sm text-slate-500">الاختصاص</label>
                    <input name="specialization" value={employee.specialization || ''} onChange={handleChange} className="w-full p-2 border rounded" />
               </div>

                <div className="space-y-1">
                     <label className="text-sm text-slate-500">مدة الخدمة (محسوبة مع كتب الشكر)</label>
                     <div className="w-full p-2 border rounded bg-slate-50 text-slate-700">
                         {calculateServiceDuration(employee.hire_date, employee.bonus_service_months).display}
                     </div>
                </div>
                <div className="space-y-1">
                     <label className="text-sm text-slate-500">الدرجة الوظيفية (محسوبة)</label>
                     <div className="w-full p-2 border rounded bg-sky-50 text-sky-700 font-bold">
                         {calculateJobGrade(employee.certificate, calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal).display}
                     </div>
                </div>
               <div className="space-y-1">
                    <label className="text-sm text-slate-500">رصيد الإجازات</label>
                    <input type="number" name="leave_balance" value={employee.leave_balance || 0} onChange={handleChange} className="w-full p-2 border rounded" />
               </div>

               <div className="space-y-1">
                    <label className="text-sm text-slate-500">نظام الدوام</label>
                     <select name="work_schedule" value={employee.work_schedule || 'morning'} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="morning">صباحي</option>
                        <option value="shift">مناوب</option>
                    </select>
               </div>
               <div className="space-y-1">
                    <label className="text-sm text-slate-500">مكان العمل / القسم</label>
                    <input name="work_location" value={employee.work_location || ''} onChange={handleChange} className="w-full p-2 border rounded" />
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

               {/* New Sections: Contact & Personal */}
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
                         <div className="space-y-1 md:col-span-2">
                            <label className="text-sm text-slate-500">العنوان</label>
                            <div className="w-full p-2 border rounded bg-slate-50 text-slate-700">
                                {employee.governorate ? 
                                    `${employee.governorate} / ${employee.city} / محلة ${employee.mahalla} / زقاق ${employee.zgaq} / دار ${employee.dar}` 
                                    : employee.address || 'غير محدد'}
                            </div>
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
                        <div className="space-y-1 flex items-end">
                            {employee.graduation_certificate_url ? (
                                <a href={employee.graduation_certificate_url} target="_blank" className="text-primary hover:underline font-bold text-sm">
                                    <FileText className="inline-block mr-1" size={16}/> عرض شهادة التخرج
                                </a>
                            ) : (
                                <span className="text-xs text-slate-400">لا توجد نسخة ضوئية مرفوعة</span>
                            )}
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
                            {employee[doc.key] && (
                                <a 
                                    href={employee[doc.key]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-primary hover:underline hover:bg-sky-50 px-2 py-1 rounded transition-colors"
                                >
                                    فتح
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Appreciation Letters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 ring-2 ring-amber-50">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Star className="text-amber-500" size={20} />
                    كتب الشكر والتقدير
                </h3>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                    {letters.length === 0 && (
                        <div className="py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                            <p className="text-xs text-slate-400">لا توجد كتب شكر مسجلة</p>
                        </div>
                    )}
                    {letters.map(doc => (
                        <div key={doc.id} className="group/item flex flex-col bg-white p-3 rounded-lg border border-slate-100 hover:border-amber-200 shadow-sm transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 leading-tight mb-1">{doc.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">+{doc.bonus_months} شهر</span>
                                        <span className="text-[10px] text-slate-400">{formatDate(doc.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditLetterTitle(doc.id)}
                                        className="p-1 text-slate-400 hover:text-primary hover:bg-sky-50 rounded transition-colors"
                                        title="تعديل العنوان"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteLetter(doc.id, doc.bonus_months)}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <a 
                                href={doc.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-2 text-center py-1.5 bg-slate-50 text-xs font-bold text-primary rounded-md group-hover/item:bg-amber-500 group-hover/item:text-white transition-all shadow-sm"
                            >
                                عرض الكتاب
                            </a>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-2 mb-3">
                    <button 
                        onClick={() => setBonusMonths(1)}
                        className={`flex-1 py-1 px-2 text-[10px] border rounded transition-colors ${bonusMonths === 1 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                        +1 شهر
                    </button>
                    <button 
                        onClick={() => setBonusMonths(6)}
                        className={`flex-1 py-1 px-2 text-[10px] border rounded transition-colors ${bonusMonths === 6 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                        +6 أشهر
                    </button>
                </div>

                <label className="block w-full text-center border-2 border-dashed border-amber-200 rounded-lg p-3 cursor-pointer hover:bg-amber-50 transition-colors">
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e.target.files[0], 'letter')} />
                    <Upload className="mx-auto text-amber-400 mb-1" size={18} />
                    <span className="text-xs text-amber-600 font-bold">{uploadingLetter ? 'جاري الرفع...' : 'رفع كتاب شكر'}</span>
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
                
                {/* Add Course Form */}
                <form onSubmit={handleAddCourse} className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <input 
                        required 
                        placeholder="اسم الدورة" 
                        value={newCourse.course_name}
                        onChange={e => setNewCourse({...newCourse, course_name: e.target.value})}
                        className="w-full text-sm p-2 rounded mb-2 border border-purple-200"
                    />
                    <div className="flex gap-2">
                        <input 
                            required 
                            type="date" 
                            value={newCourse.course_date}
                            onChange={e => setNewCourse({...newCourse, course_date: e.target.value})}
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
    </div>
  )
}
