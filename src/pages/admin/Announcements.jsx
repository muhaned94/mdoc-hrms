import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Megaphone, Trash2, Plus, Clock, Send, AlertCircle, Eye } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [locations, setLocations] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    expiration_date: '',
    target_location: 'all'
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnnouncements()
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('work_location')

      // Extract unique locations and filter out nulls
      const uniqueLocs = [...new Set(data.map(item => item.work_location).filter(Boolean))]
      setLocations(uniqueLocs)
    } catch (e) {
      console.error('Error fetching locations', e)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (err) {
      console.error(err)
      setError('فشل تحميل الإعلانات. تأكد من تحديث قاعدة البيانات.')
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newAnnouncement.title || !newAnnouncement.content) return

    setPosting(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          expiration_date: newAnnouncement.expiration_date || null,
          target_location: newAnnouncement.target_location,
          view_count: 0
        }])

      if (error) throw error

      setNewAnnouncement({ title: '', content: '', expiration_date: '', target_location: 'all' })
      fetchAnnouncements()
    } catch (err) {
      alert('فشل نشر الإعلان: ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAnnouncements()
    } catch (err) {
      alert('فشل الحذف')
    }
  }

  const isExpired = (date) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <Megaphone className="text-primary" />
          مركز الإعلانات والتعميمات
        </h1>
        <p className="text-slate-500 dark:text-slate-400">نشر أخبار تظهر لجميع الموظفين أو لمواقع محددة</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* New Announcement Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4 dark:text-white">نشر إعلان جديد</h3>
        <form onSubmit={handlePost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              placeholder="عنوان الإعلان"
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:focus:ring-primary/40"
            />
            <select
              value={newAnnouncement.target_location}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_location: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary text-sm dark:text-white"
            >
              <option value="all">كل المواقع (عام)</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                value={newAnnouncement.expiration_date}
                onChange={e => setNewAnnouncement({ ...newAnnouncement, expiration_date: e.target.value })}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:focus:ring-primary/40"
              />
            </div>
          </div>

          <textarea
            required
            placeholder="محتوى الإعلان..."
            rows="4"
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:focus:ring-primary/40"
          ></textarea>

          <button
            type="submit"
            disabled={posting}
            className="bg-primary hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {posting ? 'جاري النشر...' : (
              <>
                <Send size={18} />
                <span>نشر الإعلان</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">الإعلانات المنشورة</h3>
        {announcements.length === 0 ? (
          <div className="p-12 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-center text-slate-400 dark:text-slate-500">
            لا توجد إعلانات منشورة حالياً
          </div>
        ) : (
          announcements.map(item => {
            const expired = isExpired(item.expiration_date)
            return (
              <div key={item.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border transition-all group ${expired ? 'border-red-100 dark:border-red-900/30 opacity-70 bg-red-50/10 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-700 hover:border-primary/20'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${expired ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {item.title}
                        {item.target_location !== 'all' && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            {item.target_location}
                          </span>
                        )}
                        {expired && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">منتهي</span>}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(item.created_at)}</span>
                        {item.expiration_date && (
                          <span className={`flex items-center gap-1 ${expired ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>
                            • ينتهي: {formatDate(item.expiration_date)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          <Eye size={10} /> {item.view_count || 0} مشاهدة
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{item.content}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
