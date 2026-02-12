import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, FileSpreadsheet, Save, X, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { calculateJobGrade } from '../../utils/gradeUtils'
import { calculateServiceDuration } from '../../utils/dateUtils'

export default function AddEmployee() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [uploadingCert, setUploadingCert] = useState(false)

  const [formData, setFormData] = useState({
    company_id: '',
    full_name: '',
    birth_date: '',
    hire_date: '',
    leave_balance: 0,
    job_title: '',
    certificate: '',
    specialization: '',
    position: '',
    work_schedule: 'morning',
    work_location: '',
    visible_password: '123456',
    role: 'user',
    // New Fields
    email: '',
    phone_number: '',
    marital_status: 'single',
    spouse_name: '',
    gender: 'male',
    university_name: '',
    college_name: '',
    graduation_year: '',
    graduation_certificate_url: '',
    // Detailed Address (Combined)
    address: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCertUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingCert(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `certificates/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documents') // Using reliable 'documents' bucket
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('documents').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, graduation_certificate_url: data.publicUrl }))
    } catch (err) {
      alert('فشل رفع الملف: ' + err.message)
    } finally {
      setUploadingCert(false)
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!user) {
      setError('يجب تسجيل الدخول كمسؤول للقيام بهذه العملية')
      return
    }

    try {
      // 2. Insert using Secure RPC
      const { data, error } = await supabase
        .rpc('create_employee', {
          p_admin_id: user?.id,
          p_employee_data: {
            ...formData,
            id: crypto.randomUUID()
          }
        })

      if (error) throw error

      setSuccess('تم إضافة الموظف بنجاح')
      setTimeout(() => navigate('/admin/employees'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = [
      {
        'رقم الشركة': '1001',
        'الاسم الرباعي': 'مثال: أحمد محمد علي',
        'تاريخ الميلاد': '1990-01-01',
        'تاريخ التعيين': '2020-01-01',
        'الجنس': 'ذكر',
        'العنوان الوظيفي': 'مهندس',
        'التحصيل الدراسي': 'بكالوريوس',
        'الاختصاص': 'هندسة نفط',
        'المنصب': 'مسؤول شعبة',
        'نظام الدوام': 'morning',
        'مكان العمل': 'المقر العام',
        'رصيد الإجازات': 30,
        'رقم الهاتف': '07xxxxxxxxx',
        'البريد الإلكتروني': 'user@example.com',
        'الحالة الاجتماعية': 'أعزب/باكر',
        'اسم الزوج/الزوجة': '',
        'الجامعة': 'جامعة بغداد',
        'الكلية': 'كلية الهندسة',
        'سنة التخرج': '2012',
        'العنوان': 'بغداد - الكرادة',
        'كلمة المرور': '123456',
        'الدورات': 'دورة سلامة:2023-01-01'
      }
    ]
    const ws = XLSX.utils.json_to_sheet(headers)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'mdoc_employee_template.xlsx')
  }

  const excelDateToJSDate = (serial) => {
    if (!serial) return null
    if (typeof serial === 'string' && serial.includes('-')) return serial
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400 * 1000;
    const date_info = new Date(utc_value);
    return date_info.toISOString().split('T')[0]
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        if (data.length === 0) throw new Error('الملف فارغ')

        const employees = []
        const courses = []

        data.forEach(row => {
          const empId = crypto.randomUUID()
          const rawPassword = row['كلمة المرور'] || '123456'

          // Map Marital Status
          let maritalStatus = 'single'
          const msRaw = row['الحالة الاجتماعية'] || ''
          if (msRaw.includes('متزوج')) maritalStatus = 'married'
          else if (msRaw.includes('مطلق')) maritalStatus = 'divorced'
          else if (msRaw.includes('أرمل')) maritalStatus = 'widowed'

          // Map Gender
          let gender = 'male'
          if ((row['الجنس'] || '').includes('أنثى')) gender = 'female'

          employees.push({
            id: empId,
            company_id: row['رقم الشركة'] || row['Company ID'] || '',
            full_name: row['الاسم الرباعي'] || row['Full Name'] || '',
            birth_date: excelDateToJSDate(row['تاريخ الميلاد']) || null,
            hire_date: excelDateToJSDate(row['تاريخ التعيين']) || null,
            gender: gender,
            job_title: row['العنوان الوظيفي'] || '',
            certificate: row['التحصيل الدراسي'] || '',
            specialization: row['الاختصاص'] || '',
            position: row['المنصب'] || '',
            work_schedule: (row['نظام الدوام'] === 'shift' || row['نظام الدوام'] === 'مناوب') ? 'shift' : 'morning',
            work_location: row['مكان العمل'] || '',
            years_of_service: 0,
            leave_balance: row['رصيد الإجازات'] || 0,

            // New Fields
            phone_number: row['رقم الهاتف'] || '',
            email: row['البريد الإلكتروني'] || '',
            marital_status: maritalStatus,
            spouse_name: row['اسم الزوج/الزوجة'] || '',
            university_name: row['الجامعة'] || '',
            college_name: row['الكلية'] || '',
            graduation_year: row['سنة التخرج'] || '',

            // Address

            address: row['العنوان'] || row['Address'] || '',

            visible_password: String(rawPassword),
            role: 'user'
          })

          const coursesRaw = row['الدورات'] || ''
          if (coursesRaw) {
            const list = coursesRaw.split(/,|،/)
            list.forEach(item => {
              const [name, date] = item.split(':')
              if (name && name.trim()) {
                courses.push({
                  employee_id: empId,
                  course_name: name.trim(),
                  course_date: date ? date.trim() : new Date().toISOString().split('T')[0]
                })
              }
            })
          }
        })

        const { error: insertError } = await supabase
          .from('employees')
          .insert(employees)

        if (insertError) throw insertError

        if (courses.length > 0) {
          const { error: coursesError } = await supabase
            .from('courses')
            .insert(courses)
          if (coursesError) console.warn('Courses upload warning:', coursesError)
        }

        setSuccess(`تم استيراد ${employees.length} موظف و ${courses.length} دورة تدريبية بنجاح`)
        setTimeout(() => navigate('/admin/employees'), 2000)

      } catch (err) {
        setError('فشل استيراد الملف: ' + err.message)
      } finally {
        setLoading(false)
        e.target.value = null // Reset input
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">إضافة موظف جديد</h1>
        <button
          onClick={() => navigate('/admin/employees')}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <X size={24} />
        </button>
      </div>

      {/* Excel Import */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200">استيراد من Excel</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">قم برفع ملف يحتوي على بيانات الموظفين دفعة واحدة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            تحميل النموذج
          </button>
          <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <Upload size={18} />
            <span>رفع ملف</span>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>

      {/* Manual Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-6 pb-2 border-b dark:border-slate-700 text-slate-800 dark:text-white">البيانات الشخصية والوظيفية</h3>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Section: Basic Info */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded mb-2 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">المعلومات الأساسية</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">رقم الشركة</label>
            <input required name="company_id" value={formData.company_id} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الاسم الرباعي</label>
            <input required name="full_name" value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ الميلاد</label>
            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الجنس</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          {/* Section: Contact & Personal */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded mt-4 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">معلومات الاتصال والحالة الاجتماعية</span>
          </div>



          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">العنوان الكامل (نصي)</label>
            <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="مثال: بغداد - الكرادة - قرب..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">رقم الهاتف</label>
            <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-2 border rounded-lg text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="07xxxxxxxxx" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-lg text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="example@domain.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الحالة الاجتماعية</label>
            <select name="marital_status" value={formData.marital_status} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="single">أعزب/باكر</option>
              <option value="married">متزوج</option>
              <option value="divorced">مطلق</option>
              <option value="widowed">أرمل</option>
            </select>
          </div>

          {formData.marital_status === 'married' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اسم الزوج/الزوجة</label>
              <input name="spouse_name" value={formData.spouse_name} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
          )}

          {/* Section: Education */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded mt-4 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">التحصيل الدراسي والشهادة</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الشهادة / التحصيل</label>
            <input name="certificate" value={formData.certificate} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="مثال: بكالوريوس" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الاختصاص</label>
            <input name="specialization" value={formData.specialization} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="مثال: هندسة حاسبات" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الجامعة</label>
            <input name="university_name" value={formData.university_name} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الكلية</label>
            <input name="college_name" value={formData.college_name} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">سنة التخرج</label>
            <input type="number" name="graduation_year" value={formData.graduation_year} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="YYYY" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">صورة وثيقة التخرج / الأمر الجامعي</label>
            <div className="relative border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-700">
              <input type="file" onChange={handleCertUpload} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-500/20 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/30" accept="image/*,.pdf" disabled={uploadingCert} />
              {uploadingCert && <span className="absolute right-2 top-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold">جاري الرفع...</span>}
              {formData.graduation_certificate_url && <span className="absolute left-2 top-3 text-xs text-green-600 dark:text-green-400 font-bold">تم الرفع ✓</span>}
            </div>
          </div>

          {/* Section: Job Info */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded mt-4 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">المعلومات الوظيفية</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ التعيين</label>
            <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">العنوان الوظيفي</label>
            <input name="job_title" value={formData.job_title} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">المنصب</label>
            <input name="position" value={formData.position} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">مكان العمل</label>
            <input name="work_location" value={formData.work_location} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">نظام الدوام</label>
            <select name="work_schedule" value={formData.work_schedule} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="morning">صباحي</option>
              <option value="shift">مناوب</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">رصيد الإجازات</label>
            <input type="number" name="leave_balance" value={formData.leave_balance} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">صلاحية الحساب</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="user">مستخدم عادي</option>
              <option value="admin">مسؤول نظام</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">كلمة المرور</label>
            <input name="visible_password" value={formData.visible_password} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">كلمة مرور افتراضية، يمكن للموظف تغييرها لاحقاً</p>
          </div>

          <div className="md:col-span-2 pt-6 border-t dark:border-slate-700 mt-4 flex gap-3">
            <button type="button" onClick={() => navigate('/admin/employees')} className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">
              إلغاء
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 font-bold flex items-center justify-center gap-2">
              {loading ? 'جاري الحفظ...' :
                <>
                  <Save size={20} />
                  <span>حفظ الموظف</span>
                </>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
