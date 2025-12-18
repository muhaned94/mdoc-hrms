import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Save, Upload, FileText, ArrowRight, UserCog, Shield, Trash, GraduationCap, Plus, Star } from 'lucide-react'
import { calculateServiceDuration } from '../../utils/dateUtils'
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
    const { data } = await supabase.from('appreciation_letters').select('*').eq('employee_id', id).order('created_at', { ascending: false })
    setLetters(data || [])
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
            await supabase.from('admin_orders').insert({
                employee_id: id,
                title: file.name,
                file_url: publicUrl
            })
        } else if (type === 'letter') {
            await supabase.from('appreciation_letters').insert({
                employee_id: id,
                title: file.name,
                file_url: publicUrl,
                bonus_months: bonusMonths
            })
            // Update employee total bonus months
            const { data: emp } = await supabase.from('employees').select('bonus_service_months').eq('id', id).single()
            await supabase.from('employees').update({ 
                bonus_service_months: (emp.bonus_service_months || 0) + bonusMonths 
            }).eq('id', id)
            
            fetchLetters()
            fetchEmployee() // Refresh for service calc
        } else {
             await supabase.from('salary_slips').insert({
                employee_id: id,
                month_year: new Date(), // Logic needed
                file_url: publicUrl
            })
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
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {letters.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد كتب شكر</p>}
                    {letters.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 truncate w-32">{doc.title}</span>
                                <span className="text-[10px] text-amber-600">زيادة خدمة: {doc.bonus_months} شهر</span>
                            </div>
                            <a href={doc.file_url} target="_blank" className="text-xs text-primary underline">عرض</a>
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
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'letter')} />
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
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {orders.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد كتب</p>}
                    {orders.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-sm truncate w-32" title={doc.title}>{doc.title}</span>
                            <a href={doc.file_url} target="_blank" className="text-xs text-primary underline">عرض</a>
                        </div>
                    ))}
                </div>
                <label className="block w-full text-center border-2 border-dashed border-indigo-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-50 transition-colors">
                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e.target.files[0], 'order')} />
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
                 <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {slips.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد ملفات</p>}
                    {slips.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-sm text-slate-600">راتب شهر</span>
                            <a href={doc.file_url} target="_blank" className="text-xs text-primary underline">عرض</a>
                        </div>
                    ))}
                </div>
                <label className="block w-full text-center border-2 border-dashed border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-50 transition-colors">
                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e.target.files[0], 'slip')} />
                    <Upload className="mx-auto text-green-400 mb-2" size={20} />
                    <span className="text-sm text-green-600">{uploadingSlip ? 'جاري الرفع...' : 'رفع شريط راتب'}</span>
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

                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {courses.length === 0 && <p className="text-sm text-slate-400 text-center">لا توجد دورات</p>}
                    {courses.map(course => (
                        <div key={course.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 group">
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-slate-700 truncate">{course.course_name}</p>
                                <p className="text-xs text-slate-400">{new Date(course.course_date).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <button onClick={() => handleDeleteCourse(course.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
