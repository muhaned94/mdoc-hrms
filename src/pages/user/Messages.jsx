import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Mail, CheckCircle, Clock, Bell } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Messages() {
  const { session } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchMessages()
      // Mark as read when opening the page? 
      // Maybe better to mark as read when clicking a specific message or "Mark all as read"
      // For simple MVP: Auto mark as read or just list them. 
      // Let's list them first.
    }
  }, [session])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, is_read: true } : msg))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      {/* Unified Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
              <Mail className="fill-current/20" size={32} />
              الرسائل والتبليغات
            </h1>
            <p className="text-sky-100 font-medium opacity-90">مركز التنبيهات والرسائل الإدارية</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center min-w-[140px]">
            <span className="text-xs font-bold block mb-1 opacity-80 uppercase tracking-wider">غير مقروءة</span>
            <span className="text-2xl font-black">{messages.filter(m => !m.is_read).length}</span>
          </div>
        </div>

        {/* Decorations */}
        <Mail className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <Bell className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
              <Mail size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-white">لا توجد رسائل</h3>
            <p className="text-slate-400 dark:text-slate-500">صندوق الوارد فارغ حالياً.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => !msg.is_read && handleMarkAsRead(msg.id)}
              className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border transition-all duration-200 cursor-pointer ${msg.is_read ? 'border-slate-100 dark:border-slate-700 opacity-75 dark:opacity-60 hover:opacity-100 dark:hover:opacity-100' : 'border-primary/30 dark:border-primary/50 ring-1 ring-primary/10 dark:ring-primary/20 shadow-md'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${msg.is_read ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-400'}`}>
                  {msg.is_read ? <CheckCircle size={24} /> : <Mail size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-lg ${msg.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{msg.title}</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                      <Clock size={12} />
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{msg.body}</p>

                  {!msg.is_read && (
                    <div className="mt-4 flex justify-end">
                      <span className="text-xs font-bold text-primary dark:text-sky-400 bg-primary/5 dark:bg-primary/10 px-3 py-1 rounded-full border border-primary/10 dark:border-primary/20">رسالة جديدة</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
