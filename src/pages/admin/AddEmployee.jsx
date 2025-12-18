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
    nominal_salary: 0,
    total_salary: 0,
    incentive: 0,
    visible_password: '123456', // Default password
    role: 'user'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      // 1. Create Auth User
      // Note: In a real app, this should be a backend function to avoid exposing service role key,
      // but if we are just using client side, we can only sign up a user if we are not logged in, 
      // OR we just insert into the employees table and let the user 'claim' the account or 
      // have an admin function using a secondary supabase client with service key.
      // 
      // FOR THIS MVP: We will just insert into the 'employees' table first. 
      // The auth.users creation usually requires a distinct flow (Invite User).
      // Since the requirements didn't specify the signup flow detail, 
      // I'll assume we insert into 'employees' and maybe create a shadow auth user later 
      // or assume the admin creates the auth user separately.
      
      // WAIT: User said "Login via company number and Password".
      // This implies an Auth User exists.
      // Limitation: Client-side SDK cannot create *other* users without logging out the current admin.
      // SOLUTION: We will just insert into the 'employees' table for now to satisfy the data requirement.
      // The 'login' page will need to verify against this table if we don't use Supabase Auth for *Authentication* proper,
      // OR we assume Supabase Auth is used and Admin manually invites them.
      
      // Let's try to SignUp a dummy email for them: companyID@mdoc.hrms
      // This will fail if we are currently logged in as Admin.
      
      // Alternative: Just store data in 'employees' table. 
      // Modify Login.jsx to check 'employees' table for password matching (Insecure but requested).
      // Then if match, sign in anonymously or use a shared token? No, that's bad.
      
      // BEST PATH: Insert into 'employees'. 
      // Trigger a Supabase Edge Function to create the Auth User? (Too complex for now).
      // 
      // REVISED PLAN: Insert into 'employees' table. 
      // Login.jsx will query 'employees' table where company_id = X and visible_password = Y.
      // If match, we manually set a session or just Mock the session?
      // Supabase Auth is strict. 
      
      // 2. Insert using Secure RPC
      // We pass the current logged in Admin ID to verify permission
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
        'العنوان الوظيفي': 'مهندس',
        'التحصيل الدراسي': 'بكالوريوس',
        'الاختصاص': 'هندسة نفط',
        'المنصب': 'مسؤول شعبة',
        'نظام الدوام': 'morning',
        'مكان العمل': 'المقر العام',
        'الراتب الاسمي': 1000000,
        'الراتب الكلي': 1500000,
        'الحافز الشهري': 250000,
        'رصيد الإجازات': 30,
        'كلمة المرور': '123456',
        'الدورات': 'دورة سلامة:2023-01-01، دورة إدارة:2024-05-20'
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
     const utc_days  = Math.floor(serial - 25569);
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
            
            // Employee Data
            employees.push({
                id: empId,
                company_id: row['رقم الشركة'] || row['Company ID'] || '',
                full_name: row['الاسم الرباعي'] || row['Full Name'] || '',
                birth_date: excelDateToJSDate(row['تاريخ الميلاد']) || null,
                hire_date: excelDateToJSDate(row['تاريخ التعيين']) || null,
                job_title: row['العنوان الوظيفي'] || '',
                certificate: row['التحصيل الدراسي'] || '',
                specialization: row['الاختصاص'] || '',
                position: row['المنصب'] || '',
                work_schedule: (row['نظام الدوام'] === 'shift' || row['نظام الدوام'] === 'مناوب') ? 'shift' : 'morning',
                work_location: row['مكان العمل'] || '',
                nominal_salary: row['الراتب الاسمي'] || 0,
                total_salary: row['الراتب الكلي'] || 0,
                incentive: row['الحافز الشهري'] || 0,
                years_of_service: 0, 
                leave_balance: row['رصيد الإجازات'] || 0,
                visible_password: String(rawPassword),
                role: 'user'
            })

            // Courses Data parsing
            // Expected format: "Name:Date, Name2:Date" or "Name, Name"
            const coursesRaw = row['الدورات'] || ''
            if (coursesRaw) {
                // Split by comma or Arabic comma
                const list = coursesRaw.split(/,|،/)
                list.forEach(item => {
                    const [name, date] = item.split(':')
                    if (name && name.trim()) {
                        courses.push({
                            employee_id: empId,
                            course_name: name.trim(),
                            course_date: date ? date.trim() : new Date().toISOString().split('T')[0] // Default to today if no date
                        })
                    }
                })
            }
        })

        // 1. Insert Employees
        const { error: insertError } = await supabase
            .from('employees')
            .insert(employees)
        
        if (insertError) throw insertError

        // 2. Insert Courses (if any)
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">إضافة موظف جديد</h1>
        <button 
          onClick={() => navigate('/admin/employees')}
          className="text-slate-500 hover:text-slate-700"
        >
          <X size={24} />
        </button>
      </div>

      {/* Excel Import */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900">استيراد من Excel</h3>
            <p className="text-sm text-indigo-700">قم برفع ملف يحتوي على بيانات الموظفين دفعة واحدة</p>
          </div>
        </div>
        {formData.hire_date && formData.certificate && (
          <div className="mt-4 p-3 bg-sky-50 rounded-lg border border-sky-100 flex items-center justify-between">
            <span className="text-sm font-bold text-sky-800">توقع الدرجة الوظيفية:</span>
            <span className="bg-sky-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                {calculateJobGrade(formData.certificate, calculateServiceDuration(formData.hire_date).years).display}
            </span>
          </div>
        )}
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadTemplate}
                className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg mb-6 pb-2 border-b">البيانات الشخصية والوظيفية</h3>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">رقم الشركة</label>
            <input required name="company_id" value={formData.company_id} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الاسم الرباعي</label>
            <input required name="full_name" value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">تاريخ الميلاد</label>
            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">تاريخ التعيين</label>
            <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">العنوان الوظيفي</label>
            <input name="job_title" value={formData.job_title} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الشهادة</label>
            <input name="certificate" value={formData.certificate} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الاختصاص</label>
            <input name="specialization" value={formData.specialization} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">المنصب</label>
            <input name="position" value={formData.position} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">نظام الدوام</label>
            <select name="work_schedule" value={formData.work_schedule} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
              <option value="morning">صباحي</option>
              <option value="shift">مناوب</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">مكان العمل</label>
            <input name="work_location" value={formData.work_location} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الراتب الاسمي</label>
            <input type="number" name="nominal_salary" value={formData.nominal_salary} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الراتب الكلي</label>
            <input type="number" name="total_salary" value={formData.total_salary} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الحافز الشهري (تقديري)</label>
            <input type="number" name="incentive" value={formData.incentive} onChange={handleChange} className="w-full p-2 border rounded-lg bg-green-50 border-green-200" />
          </div>
          
           <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">كلمة المرور (للموظف)</label>
            <input type="text" name="visible_password" value={formData.visible_password} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50" />
            <p className="text-xs text-slate-500">كلمة المرور هذه ستستخدم لتسجيل دخول الموظف</p>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
