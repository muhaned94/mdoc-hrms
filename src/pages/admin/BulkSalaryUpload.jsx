import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Calendar, BarChart3, ChevronDown } from 'lucide-react'

export default function BulkSalaryUpload() {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [processing, setProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [existingSlipsCount, setExistingSlipsCount] = useState(0)
  const [summary, setSummary] = useState({ totalActive: 0, withSlips: 0, missing: [] })
  const [showMissing, setShowMissing] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchExistingSlipsCount()
    fetchSummaryData()
  }, [monthYear])

  const fetchSummaryData = async () => {
    try {
      // 1. Get all employees (removing status filter to ensure compatibility)
      const { data: allEmployees, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, company_id')

      if (empError) throw empError

      // 2. Get employees who already have slips for this month
      const { data: slips, error: slipError } = await supabase
        .from('salary_slips')
        .select('employee_id')
        .eq('month_year', `${monthYear}-01`)

      if (slipError) throw slipError

      const empWithSlipsIds = new Set(slips.map(s => s.employee_id))
      const missing = allEmployees.filter(emp => !empWithSlipsIds.has(emp.id))

      setSummary({
        totalActive: allEmployees.length,
        withSlips: allEmployees.length - missing.length,
        missing: missing
      })
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  const fetchExistingSlipsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('salary_slips')
        .select('*', { count: 'exact', head: true })
        .eq('month_year', `${monthYear}-01`)

      if (error) throw error
      setExistingSlipsCount(count || 0)
    } catch (err) {
      console.error('Error fetching slips count:', err)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${existingSlipsCount} شريط راتب لشهر ${monthYear}؟ لا يمكن التراجع عن هذه العملية.`)) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('salary_slips')
        .delete()
        .eq('month_year', `${monthYear}-01`)

      if (error) throw error

      alert('تم حذف جميع أشرطة الراتب للشهر المختار بنجاح.')
      fetchExistingSlipsCount()
      fetchSummaryData()
    } catch (err) {
      console.error('Error deleting slips:', err)
      alert('فشل حذف أشرطة الراتب: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      careerNumber: file.name.split('.')[0],
      status: 'pending',
      employeeId: null,
      error: null
    }))
    setSelectedFiles(prev => [...prev, ...newFiles])
    e.target.value = null
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const validateFiles = async () => {
    setProcessing(true)
    const careerNumbers = selectedFiles.filter(f => f.status === 'pending').map(f => f.careerNumber)

    if (careerNumbers.length === 0) {
      setProcessing(false)
      return
    }

    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, company_id, full_name')
        .in('company_id', careerNumbers)

      if (error) throw error

      const employeeMap = employees.reduce((acc, emp) => {
        acc[emp.company_id] = emp
        return acc
      }, {})

      setSelectedFiles(prev => prev.map(f => {
        if (f.status !== 'pending') return f
        const emp = employeeMap[f.careerNumber]
        return {
          ...f,
          status: emp ? 'matched' : 'not_found',
          employeeId: emp ? emp.id : null,
          employeeName: emp ? emp.full_name : null
        }
      }))
    } catch (err) {
      console.error(err)
      alert('خطأ أثناء التحقق من الموظفين: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleUpload = async () => {
    const matchedFiles = selectedFiles.filter(f => f.status === 'matched')
    if (matchedFiles.length === 0) {
      alert('لا توجد ملفات مطابقة للرفع')
      return
    }

    setProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const item of matchedFiles) {
      try {
        setSelectedFiles(prev => prev.map(f => f === item ? { ...f, status: 'uploading' } : f))
        const ext = item.file.name.split('.').pop()
        const fileName = `${item.employeeId}/${Date.now()}_${item.careerNumber}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('salary-slips')
          .upload(fileName, item.file)

        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('salary-slips').getPublicUrl(fileName)

        const { error: insError } = await supabase.from('salary_slips').insert({
          employee_id: item.employeeId,
          month_year: `${monthYear}-01`,
          file_url: publicUrl
        })

        if (insError) throw insError
        setSelectedFiles(prev => prev.map(f => f === item ? { ...f, status: 'success' } : f))
        successCount++
      } catch (err) {
        console.error(err)
        setSelectedFiles(prev => prev.map(f => f === item ? { ...f, status: 'error', error: err.message } : f))
        errorCount++
      }
    }

    setUploadStatus({ success: successCount, error: errorCount })
    setProcessing(false)
    fetchExistingSlipsCount()
    fetchSummaryData()
  }

  const clearCompleted = () => {
    setSelectedFiles(prev => prev.filter(f => f.status !== 'success' && f.status !== 'matched' && f.status !== 'uploading' && f.status !== 'error'))
    setUploadStatus(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white pb-2 border-b-2 border-primary">رفع أشرطة الرواتب (Batch)</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:border-l-2 dark:border-slate-700 md:pl-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                اختيار الشهر والسنة
              </label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                اختيار الملفات (PDF / صور)
              </label>
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary dark:hover:border-primary cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-700/30"
              >
                <Upload className="text-slate-400" size={32} />
                <span className="text-sm text-slate-500 dark:text-slate-400">اسحب الملفات هنا أو انقر للاختيار</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-center">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">ملفات مرفوعة سابقاً لهذا الشهر</p>
                <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{existingSlipsCount} شريط</p>
              </div>
              {existingSlipsCount > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={processing}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <X size={18} />
                  مسح الشهر بالكامل
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-4 pt-4 border-t dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white">الملفات المستعدة ({selectedFiles.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={validateFiles}
                  disabled={processing || selectedFiles.every(f => f.status !== 'pending')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin" size={18} /> : 'التحقق'}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={processing || !selectedFiles.some(f => f.status === 'matched')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin" size={18} /> : 'بدء الرفع'}
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  disabled={processing}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  حذف الكل
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border dark:border-slate-700 rounded-xl divide-y dark:divide-slate-700 shadow-inner">
              {selectedFiles.map((item, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px]">{item.name}</p>
                      <p className="text-xs text-slate-500">للموظف: {item.careerNumber}</p>
                      {item.employeeName && <p className="text-xs font-bold text-primary">{item.employeeName}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.status === 'pending' && <span className="text-[10px] text-slate-400">تحقق...</span>}
                    {item.status === 'matched' && <CheckCircle2 className="text-green-500" size={18} />}
                    {item.status === 'not_found' && <AlertCircle className="text-red-500" size={18} />}
                    {item.status === 'uploading' && <Loader2 className="animate-spin text-primary" size={18} />}
                    {item.status === 'success' && <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs font-bold">✓</div>}
                    {item.status === 'error' && <div className="text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs font-bold">!</div>}

                    <button
                      onClick={() => removeFile(index)}
                      disabled={processing}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${uploadStatus.error > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
            <CheckCircle2 size={24} />
            <div className="flex-1">
              <p className="font-bold">اكتملت العملية</p>
              <p className="text-sm">تم رفع {uploadStatus.success} بنجاح، وفشل {uploadStatus.error} ملفات.</p>
            </div>
            <button
              onClick={clearCompleted}
              className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
            >
              مسح المكتمل
            </button>
          </div>
        )}
      </div>

      {/* Summary Table at the BOTTOM */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            ملخص حالة الرواتب لشهر {monthYear}
          </h2>
          <button
            onClick={() => setShowMissing(!showMissing)}
            className="text-sm font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {showMissing ? 'إخفاء التفاصيل' : 'عرض الموظفين المتبقين'}
            <ChevronDown className={`transition-transform duration-300 ${showMissing ? 'rotate-180' : ''}`} size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse dark:divide-slate-700">
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">إجمالي الموظفين</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{summary.totalActive}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">تم رفع أشرطتهم</p>
            <p className="text-3xl font-black text-green-600 dark:text-green-400">{summary.withSlips}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">المتبقي</p>
            <p className="text-3xl font-black text-red-600 dark:text-red-400">{summary.missing.length}</p>
          </div>
        </div>

        {showMissing && summary.missing.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-t dark:border-slate-700 animate-in slide-in-from-top duration-300">
            <div className="max-h-64 overflow-y-auto rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800">
              <table className="w-full text-right">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs text-bold">
                  <tr>
                    <th className="p-3">الاسم الكامل</th>
                    <th className="p-3">الرقم الوظيفي</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {summary.missing.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-3 text-sm text-slate-700 dark:text-slate-300 font-bold">{emp.full_name}</td>
                      <td className="p-3 text-sm text-slate-500 font-mono">{emp.company_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3 text-blue-700 dark:text-blue-400">
        <AlertCircle size={20} className="shrink-0" />
        <div className="text-sm">
          <p className="font-bold mb-1">تذكير:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>يجب مطابقة اسم الملف مع الرقم الوظيفي بدقة.</li>
            <li>تأكد من اختيار الشهر والسنة الصحيحين قبل البدء.</li>
            <li>الجدول أعلاه يعطيك نظرة سريعة عن الموظفين الذين قد سقطوا سهواً.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
