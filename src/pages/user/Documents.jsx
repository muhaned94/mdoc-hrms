import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Upload, CheckCircle, FileText, XCircle, Loader2, Trash2, Eye, Info } from 'lucide-react'

const DOCUMENT_TYPES = [
  { id: 'national_id', name: 'البطاقة الوطنية', key: 'national_id_url', description: 'وجه وظهر البطاقة الموحدة' },
  { id: 'residency_card', name: 'بطاقة السكن', key: 'residency_card_url', description: 'تأكد من وضوح العنوان ورقم البطاقة' },
  { id: 'marriage_contract', name: 'عقد الزواج', key: 'marriage_contract_url', description: 'الصفحة الأولى ومعلومات الزوجين' },
  { id: 'ration_card', name: 'البطاقة التموينية', key: 'ration_card_url', description: 'تأكد من وضوح أسماء أفراد العائلة' },
  { id: 'graduation_certificate', name: 'وثيقة التخرج / الأمر الجامعي', key: 'graduation_certificate_url', description: 'نسخة واضحة من الشهادة أو وثيقة التخرج' }
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export default function Documents() {
  const { session, loading: authLoading } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})
  const [deleting, setDeleting] = useState({})

  const userId = session?.user?.id

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      setLoading(false)
      return
    }
    fetchEmployeeData()
  }, [userId, authLoading])

  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setEmployee(data)
    } catch (error) {
      console.error('Error fetching employee data:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleFileUpload = async (event, docType) => {
    const file = event.target.files[0]
    if (!file) return

    // Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('عذراً، يسمح فقط برفع ملفات الصور (JPG, PNG) أو ملفات PDF.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.')
      return
    }

    setUploading(prev => ({ ...prev, [docType.id]: true }))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${docType.id}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // 3. Update Database
      const { error: updateError } = await supabase
        .from('employees')
        .update({ [docType.key]: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      // 4. Update local state
      setEmployee(prev => ({ ...prev, [docType.key]: publicUrl }))
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('حدث خطأ أثناء الرفع: ' + error.message)
    } finally {
      setUploading(prev => ({ ...prev, [docType.id]: false }))
    }
  }

  const handleDeleteFile = async (docType) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستمسك؟')) return

    setDeleting(prev => ({ ...prev, [docType.id]: true }))

    try {
      // 1. Update Database to null
      const { error: updateError } = await supabase
        .from('employees')
        .update({ [docType.key]: null })
        .eq('id', userId)

      if (updateError) throw updateError

      // Note: We are not deleting from storage here for safety (soft delete in DB)
      // but in a production app you might want to cleanup storage as well.
      
      setEmployee(prev => ({ ...prev, [docType.key]: null }))
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('حدث خطأ أثناء الحذف')
    } finally {
      setDeleting(prev => ({ ...prev, [docType.id]: false }))
    }
  }

  if (loading || authLoading) {
    return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
  }

  if (!employee) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg max-w-2xl mx-auto mt-10">
        عذراً، لم يتم العثور على بيانات الموظف المرتبطة بهذا الحساب.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20" dir="rtl">
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">المستمسكات الرسمية</h1>
            <p className="text-slate-500 max-w-md">يرجى رفع النسخ الأصلية والواضحة لضمان سرعة إنجاز المعاملات الإدارية.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm">
            <Info size={18} />
            <span>الحد الأقصى لكل ملف: 5MB</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCUMENT_TYPES.map((doc) => {
          const isUploaded = !!employee[doc.key]
          const isImage = employee[doc.key]?.match(/\.(jpg|jpeg|png|webp)$/i)
          
          return (
            <div key={doc.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isUploaded ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary'}`}>
                    <FileText size={24} />
                  </div>
                  {isUploaded && (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                       <CheckCircle size={14} />
                       تم الرفع
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">{doc.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{doc.description}</p>

                {isUploaded ? (
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video mb-4 flex items-center justify-center group/docs">
                    {isImage ? (
                      <img src={employee[doc.key]} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FileText size={40} />
                        <span className="text-xs font-medium">ملف PDF</span>
                      </div>
                    )}
                     <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/docs:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <a href={employee[doc.key]} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-slate-700 hover:bg-slate-50 transition-colors shadow-lg" title="عرض">
                           <Eye size={18} />
                        </a>
                     </div>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, doc)}
                      disabled={uploading[doc.id]}
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                    <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group/upload">
                        {uploading[doc.id] ? (
                            <Loader2 className="animate-spin text-primary" size={32} />
                        ) : (
                            <>
                                <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover/upload:bg-white group-hover/upload:text-primary transition-colors">
                                    <Upload size={24} />
                                </div>
                                <span className="text-sm font-bold text-slate-500 group-hover/upload:text-primary transition-colors">اضغط للرفع</span>
                            </>
                        )}
                    </div>
                  </label>
                )}
              </div>
              
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                 <span>الحالة: {isUploaded ? 'مكتمل' : 'مطلوب'}</span>
                 {!isUploaded && <span className="text-amber-500 animate-pulse">بانتظار الإجراء</span>}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
