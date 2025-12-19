import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { MessageSquareWarning, Send, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function ReportIssue() {
  const { session } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { session } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [employeeId, setEmployeeId] = useState(null)
  
  const [formData, setFormData] = useState({
    type: 'complaint',
    title: '',
    description: '',
    priority: 'normal'
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (session?.user?.email) {
        fetchEmployeeAndReports()
    }
  }, [session])

  const fetchEmployeeAndReports = async () => {
    try {
        setLoading(true)
        // 1. Get Employee ID from Email
        const { data: emp, error: empError } = await supabase
            .from('employees')
            .select('id')
            .eq('email', session.user.email)
            .single()
        
        if (empError) throw empError
        if (!emp) throw new Error('Employee record not found')

        setEmployeeId(emp.id)

        // 2. Fetch Reports for this Employee
        const { data: reportsData, error: reportsError } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', emp.id)
            .order('created_at', { ascending: false })
        
        if (reportsError) throw reportsError
        setReports(reportsData || [])

    } catch (err) {
        console.error('Error fetching data:', err)
        setError('تعذر تحميل البيانات. يرجى التأكد من أن حسابك مرتبط بسجل موظف.')
    } finally {
        setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!formData.title.trim() || !formData.description.trim()) {
        setError('يرجى ملء جميع الحقول المطلوبة')
        setSubmitting(false)
        return
    }

    try {
        if (!employeeId) throw new Error('لم يتم العثور على سجل الموظف الخاص بك')

        const { error: submitError } = await supabase
            .from('reports')
            .insert([{
                user_id: employeeId,
                type: formData.type,
                title: formData.title,
                description: formData.description,
                priority: formData.priority
            }])
        
        if (submitError) throw submitError

        setSuccess('تم إرسال بلاغك بنجاح، سيتم مراجعته من قبل الإدارة.')
        setFormData({ type: 'complaint', title: '', description: '', priority: 'normal' })
        fetchEmployeeAndReports() // Refresh list
    } catch (err) {
        setError(err.message)
    } finally {
        setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
        case 'resolved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> تم الحل</span>
        case 'dismissed': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12}/> مغلق</span>
        default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> قيد المراجعة</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <MessageSquareWarning className="text-amber-500" />
                الدعم والشكاوي
            </h1>
            <p className="text-slate-500">يمكنك الإبلاغ عن مشكلة فنية أو تقديم شكوى للإدارة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                <h3 className="font-bold text-lg mb-6 text-slate-700 border-b pb-2">تقديم بلاغ جديد</h3>
                
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
                {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm mb-4 flex items-center gap-2"><CheckCircle size={16}/>{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">نوع البلاغ</label>
                        <select 
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="complaint">شكوى إدارية</option>
                            <option value="bug_report">مشكلة فنية / خطأ في النظام</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">الأهمية</label>
                        <select 
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="normal">عادية</option>
                            <option value="high">هام</option>
                            <option value="critical">طاريء</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">العنوان / الموضوع</label>
                        <input 
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="اختصر المشكلة في كلمات..."
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">التفاصيل</label>
                        <textarea 
                            rows={5}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="اشرح المشكلة بالتفصيل..."
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {submitting ? 'جاري الإرسال...' : <><Send size={18} /> إرسال البلاغ</>}
                    </button>
                </form>
            </div>

            {/* History Section */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-700 mb-4 px-2">سجل البلاغات السابق</h3>
                
                {loading ? (
                    <div className="text-center py-10 text-slate-400">جاري التحميل...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400 text-sm">لا توجد بلاغات سابقة</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map(report => (
                            <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${report.type === 'bug_report' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                        <h4 className="font-bold text-slate-800 text-sm">{report.title}</h4>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{formatDate(report.created_at)}</span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded">{report.description}</p>
                                
                                <div className="flex items-center justify-between border-t pt-2 mt-2">
                                    {getStatusBadge(report.status)}
                                    {report.admin_response && (
                                        <span className="text-xs text-primary font-bold">تم الرد من الإدارة</span>
                                    )}
                                </div>
                                
                                {report.admin_response && (
                                     <div className="mt-3 bg-indigo-50 p-3 rounded-lg text-xs border border-indigo-100">
                                        <span className="block font-bold text-indigo-700 mb-1">رد الإدارة:</span>
                                        <p className="text-indigo-900">{report.admin_response}</p>
                                     </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
