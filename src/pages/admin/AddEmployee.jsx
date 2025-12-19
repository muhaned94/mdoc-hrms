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
    nominal_salary: 0,
    total_salary: 0,
    incentive: 0,
    visible_password: '123456', 
    role: 'user',
  /* Update formData state definition */
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
    // Detailed Address
    governorate: '',
    city: '',
    mahalla: '',
    zgaq: '',
    dar: ''
  })
/* ... rest of the code ... */

        {/* Section: Contact & Personal */}
           <div className="md:col-span-2 bg-slate-50 p-3 rounded mt-4 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">معلومات الاتصال والحالة الاجتماعية</span>
           </div>

           <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-700 block mb-1">عنوان السكن</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <input name="governorate" value={formData.governorate} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="المحافظة" />
                <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="المدينة/القضاء" />
                <input name="mahalla" value={formData.mahalla} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="محلة" />
                <input name="zgaq" value={formData.zgaq} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="زقاق" />
                <input name="dar" value={formData.dar} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="دار" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">رقم الهاتف</label>
            <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-2 border rounded-lg text-left" placeholder="07xxxxxxxxx" />
          </div>
           <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-lg text-left" placeholder="example@domain.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الحالة الاجتماعية</label>
             <select name="marital_status" value={formData.marital_status} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
              <option value="single">أعزب/باكر</option>
              <option value="married">متزوج</option>
              <option value="divorced">مطلق</option>
              <option value="widowed">أرمل</option>
            </select>
          </div>
          
          {formData.marital_status === 'married' && (
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">اسم الزوج/الزوجة</label>
                <input name="spouse_name" value={formData.spouse_name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          )}


           {/* Section: Education */}
           <div className="md:col-span-2 bg-slate-50 p-3 rounded mt-4 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">التحصيل الدراسي والشهادة</span>
           </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الشهادة</label>
            <input name="certificate" value={formData.certificate} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="دكتوراه/ماجستير/بكالوريوس..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الاختصاص</label>
            <input name="specialization" value={formData.specialization} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">اسم الجامعة</label>
            <input name="university_name" value={formData.university_name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">اسم الكلية</label>
            <input name="college_name" value={formData.college_name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">سنة التخرج</label>
            <input type="number" name="graduation_year" value={formData.graduation_year} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="YYYY" />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">نسخة ضوئية من الشهادة</label>
             <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-full">
                    {uploadingCert ? <span className="text-xs">جاري الرفع...</span> : <Upload size={18} />}
                    <span className="text-sm">{formData.graduation_certificate_url ? 'تم رفع الشهادة' : 'اضغط لرفع الصورة'}</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleCertUpload} />
                </label>
             </div>
             {formData.graduation_certificate_url && (
                 <a href={formData.graduation_certificate_url} target="_blank" className="text-xs text-blue-600 underline block mt-1">عرض الملف المرفوع</a>
             )}
          </div>


        {/* Section: Job Details */}
           <div className="md:col-span-2 bg-slate-50 p-3 rounded mt-4 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">المعلومات الوظيفية</span>
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
