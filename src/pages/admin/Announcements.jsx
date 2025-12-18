import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Megaphone, Trash2, Plus, Clock, Send, AlertCircle } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

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
      setError('فشل تحميل الإعلانات. تأكد من وجود جدول announcements في قاعدة البيانات.')
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
        .insert([newAnnouncement])
      
      if (error) throw error
      
      setNewAnnouncement({ title: '', content: '' })
      fetchAnnouncements()
    } catch (err) {
      alert('فشل نشر الإعلان')
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

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Megaphone className="text-primary" />
            مركز الإعلانات والتعميمات
        </h1>
        <p className="text-slate-500">نشر أخبار تظهر لجميع الموظفين في صفحاتهم الشخصية</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
        </div>
      )}

      {/* New Announcement Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg mb-4">نشر إعلان جديد</h3>
        <form onSubmit={handlePost} className="space-y-4">
          <input 
            required
            placeholder="عنوان الإعلان"
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <textarea 
            required
            placeholder="محتوى الإعلان..."
            rows="4"
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
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
        <h3 className="font-bold text-lg text-slate-700">الإعلانات المنشورة</h3>
        {announcements.length === 0 ? (
            <div className="p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400">
                لا توجد إعلانات منشورة حالياً
            </div>
        ) : (
            announcements.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <Megaphone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{item.title}</h4>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                    <Clock size={10} />
                                    <span>{formatDate(item.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{item.content}</p>
                </div>
            ))
        )}
      </div>
    </div>
  )
}
