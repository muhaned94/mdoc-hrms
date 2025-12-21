import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  MessageSquareWarning, CheckCircle, XCircle, Clock, Search, 
  Filter, AlertCircle, ChevronDown, ChevronUp, Bell, Send
} from 'lucide-react'
import { formatDate, formatDateTime } from '../../utils/dateUtils'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'history'
  const [selectedReport, setSelectedReport] = useState(null)
  const [response, setResponse] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reports')
        .select(`
            *,
            employees:user_id (full_name, avatar_url, job_title)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (status) => {
    if (!selectedReport) return
    setProcessing(true)

    try {
        // 1. Update Report Status
        const { error: updateError } = await supabase
            .from('reports')
            .update({ 
                status: status,
                admin_response: response,
                resolved_at: new Date().toISOString()
            })
            .eq('id', selectedReport.id)
        
        if (updateError) throw updateError

        // 2. Notify User
        const message = status === 'resolved' 
            ? `تم حل مشكلتك: "${selectedReport.title}". رد الإدارة: ${response}`
            : `تم إغلاق بلاغك: "${selectedReport.title}". السبب: ${response}`
        
        const { error: notifyError } = await supabase
            .from('notifications')
            .insert([{
                user_id: selectedReport.user_id,
                title: status === 'resolved' ? 'تم حل المشكلة' : 'تم إغلاق البلاغ',
                message: message,
                is_read: false
            }])

        if (notifyError) console.warn('Notification failed:', notifyError)

        // Refresh & Close
        await fetchReports()
        setSelectedReport(null)
        setResponse('')
    } catch (err) {
        alert('حدث خطأ: ' + err.message)
    } finally {
        setProcessing(false)
    }
  }

  const filteredReports = reports.filter(r => {
    const isHistory = r.status === 'resolved' || r.status === 'dismissed'
    const matchesTab = activeTab === 'active' ? !isHistory : isHistory
    const matchesType = filterType === 'all' || r.type === filterType
    return matchesTab && matchesType
  })

  const pendingCount = reports.filter(r => r.status === 'pending').length

  if (loading) return <div className="p-10 text-center text-slate-500">جاري تحميل البلاغات...</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                <MessageSquareWarning className="text-primary" />
                إدارة البلاغات والشكاوي
            </h1>
            <p className="text-slate-500 text-sm">متابعة ومعالجة المشاكل التقنية والشكاوي الإدارية</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <span>النشطة</span>
                {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
            <button 
                 onClick={() => setActiveTab('history')}
                 className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                الأرشيف / السجل
            </button>
        </div>
      </div>

       {/* Filters */}
       <div className="flex gap-2 mb-4">
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)} 
                className="bg-white border text-sm p-2 rounded-lg text-slate-600 focus:border-primary outline-none"
            >
                <option value="all">كل الأنواع</option>
                <option value="bug_report">مشاكل فنية</option>
                <option value="complaint">شكاوي</option>
                <option value="other">أخرى</option>
            </select>
       </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredReports.length === 0 ? (
            <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <CheckCircle size={32} />
                </div>
                <p className="text-slate-500">لا توجد بلاغات في هذه القائمة</p>
            </div>
        ) : (
            <div className="divide-y divide-slate-100">
                {filteredReports.map(report => (
                    <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    {report.priority === 'critical' ? <AlertCircle className="text-red-500" size={20} /> :
                                     report.priority === 'high' ? <AlertCircle className="text-amber-500" size={20} /> :
                                     <Clock className="text-slate-400" size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800">{report.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${report.type === 'bug_report' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {report.type === 'bug_report' ? 'مشكلة فنية' : 'شكوى'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <img src={report.employees?.avatar_url || `https://ui-avatars.com/api/?name=${report.employees?.full_name}&background=random`} className="w-5 h-5 rounded-full" />
                                        <span>{report.employees?.full_name}</span>
                                        <span>•</span>
                                        <span>{formatDateTime(report.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {activeTab === 'active' && (
                                <button 
                                    onClick={() => setSelectedReport(report)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:border-primary hover:text-primary transition-all opacity-0 group-hover:opacity-100 whitespace-nowrap"
                                >
                                    مراجعة وحل
                                </button>
                            )}
                            {activeTab === 'history' && (
                                <div className="text-right mt-2 w-full border-t pt-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {report.status === 'resolved' ? 'تم الحل' : 'مغلق'}
                                        </span>
                                        {report.resolved_at && (
                                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                                {formatDateTime(report.resolved_at)}
                                            </span>
                                        )}
                                    </div>
                                    {report.admin_response && (
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                                            <span className="font-bold text-slate-700 block mb-1 text-xs">الرد:</span>
                                            {report.admin_response}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">معالجة البلاغ</h3>
                    <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-red-500"><XCircle /></button>
                </div>
                <div className="p-6">
                    <div className="mb-4 bg-slate-50 p-3 rounded-lg border text-sm">
                        <span className="font-bold block mb-1">المشكلة:</span>
                        {selectedReport.description}
                    </div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">رد الإدارة (سيظهر للموظف)</label>
                    <textarea 
                        className="w-full border rounded-xl p-3 h-32 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="اكتب تفاصيل الحل أو سبب الإغلاق..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                    ></textarea>

                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => handleResolve('resolved')}
                            disabled={processing || !response.trim()}
                            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            {processing ? 'جاري الحفظ...' : 'تم الحل وحفظ'}
                        </button>
                         <button 
                            onClick={() => handleResolve('dismissed')}
                            disabled={processing || !response.trim()}
                            className="flex-1 bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <XCircle size={18} />
                            إغلاق (رفض)
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
