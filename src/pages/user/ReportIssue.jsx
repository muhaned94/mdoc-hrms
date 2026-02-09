import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { MessageSquareWarning, Send, AlertCircle, Clock, CheckCircle, XCircle, LifeBuoy, Settings } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function ReportIssue() {
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
    }, [session.user?.id])

    const fetchEmployeeAndReports = async () => {
        try {
            setLoading(true)
            // In Custom Auth, session.user.id IS the employee ID.
            const empId = session?.user?.id
            if (!empId) throw new Error('يرجى تسجيل الدخول أولاً')

            setEmployeeId(empId)

            // 2. Fetch Reports for this Employee
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('*')
                .eq('user_id', empId)
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
            case 'resolved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> تم الحل</span>
            case 'dismissed': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> مغلق</span>
            default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> قيد المراجعة</span>
        }
    }

    return (
        <div className="pb-20 space-y-8">
            {/* Unified Gradient Header */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-right">
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
                            <LifeBuoy className="fill-current/20" size={32} />
                            الدعم والشكاوي
                        </h1>
                        <p className="text-sky-100 font-medium opacity-90">يمكنك الإبلاغ عن مشكلة فنية أو تقديم شكوى للإدارة</p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center min-w-[140px]">
                        <span className="text-xs font-bold block mb-1 opacity-80 uppercase tracking-wider">الحالة المتاحة</span>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-lg font-black italic">نظام الدعم نشط</span>
                        </div>
                    </div>
                </div>

                {/* Decorations */}
                <MessageSquareWarning className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
                <Settings className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
                    <h3 className="font-bold text-lg mb-6 text-slate-700 dark:text-white border-b dark:border-slate-700 pb-2">تقديم بلاغ جديد</h3>

                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4 flex items-center gap-2 border border-red-100 dark:border-red-900/30"><AlertCircle size={16} />{error}</div>}
                    {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm mb-4 flex items-center gap-2 border border-green-100 dark:border-green-900/30"><CheckCircle size={16} />{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">نوع البلاغ</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-2 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="complaint">شكوى إدارية</option>
                                <option value="bug_report">مشكلة فنية / خطأ في النظام</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">الأهمية</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full p-2 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="normal">عادية</option>
                                <option value="high">هام</option>
                                <option value="critical">طاريء</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">العنوان / الموضوع</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="اختصر المشكلة في كلمات..."
                                className="w-full p-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">التفاصيل</label>
                            <textarea
                                rows={5}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="اشرح المشكلة بالتفصيل..."
                                className="w-full p-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
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
                    <h3 className="font-bold text-lg text-slate-700 dark:text-white mb-4 px-2">سجل البلاغات السابق</h3>

                    {loading ? (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500">جاري التحميل...</div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-400 dark:text-slate-500 text-sm">لا توجد بلاغات سابقة</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map(report => (
                                <div key={report.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${report.type === 'bug_report' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{report.title}</h4>
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(report.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 bg-slate-50 dark:bg-slate-900 p-2 rounded border dark:border-slate-700">{report.description}</p>

                                    <div className="flex items-center justify-between border-t dark:border-slate-700 pt-2 mt-2">
                                        {getStatusBadge(report.status)}
                                        {report.admin_response && (
                                            <span className="text-xs text-primary dark:text-sky-400 font-bold">تم الرد من الإدارة</span>
                                        )}
                                    </div>

                                    {report.admin_response && (
                                        <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-xs border border-indigo-100 dark:border-indigo-900/30">
                                            <span className="block font-bold text-indigo-700 dark:text-indigo-400 mb-1">رد الإدارة:</span>
                                            <p className="text-indigo-900 dark:text-indigo-200">{report.admin_response}</p>
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
