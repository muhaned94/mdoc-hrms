import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Upload, CheckCircle, FileText, XCircle, Loader2 } from 'lucide-react'

const DOCUMENT_TYPES = [
  { id: 'national_id', name: 'البطاقة الوطنية', key: 'national_id_url' },
  { id: 'residency_card', name: 'بطاقة السكن', key: 'residency_card_url' },
  { id: 'marriage_contract', name: 'عقد الزواج', key: 'marriage_contract_url' },
  { id: 'ration_card', name: 'البطاقة التموينية', key: 'ration_card_url' }
]

export default function Documents() {
  const { session, loading: authLoading } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})

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
      alert('تم رفع المستمسك بنجاح')
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('حدث خطأ أثناء الرفع: ' + error.message)
    } finally {
      setUploading(prev => ({ ...prev, [docType.id]: false }))
    }
  }

  if (loading || authLoading) {
    return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
  }

  if (!employee) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
        عذراً، لم يتم العثور على بيانات الموظف.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">المستمسكات الرسمية</h2>
        <p className="text-slate-500 text-sm mb-6">يرجى رفع نسخ واضحة من المستمسكات التالية بصيغة (JPG, PNG, PDF)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOCUMENT_TYPES.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{doc.name}</h3>
                    <p className="text-xs text-slate-400">
                      {employee[doc.key] ? 'تم الرفع' : 'بانتظار الرفع'}
                    </p>
                  </div>
                </div>
                {employee[doc.key] && (
                  <CheckCircle size={20} className="text-green-500" />
                )}
              </div>

              {employee[doc.key] ? (
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={employee[doc.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    عرض المستمسك
                  </a>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, doc)}
                      disabled={uploading[doc.id]}
                    />
                    <div className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                      {uploading[doc.id] ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    </div>
                  </label>
                </div>
              ) : (
                <label className="w-full">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, doc)}
                    disabled={uploading[doc.id]}
                  />
                  <div className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                    {uploading[doc.id] ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Upload size={18} />
                        <span className="text-sm font-medium">اختر ملف للرفع</span>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
