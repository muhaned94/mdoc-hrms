import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Mail, CheckCircle, Clock } from 'lucide-react'
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

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="text-primary" />
            الرسائل والتبليغات
        </h1>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Mail size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">لا توجد رسائل</h3>
                <p className="text-slate-400">صندوق الوارد فارغ حالياً.</p>
            </div>
        ) : (
            messages.map(msg => (
                <div 
                    key={msg.id} 
                    onClick={() => !msg.is_read && handleMarkAsRead(msg.id)}
                    className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 cursor-pointer ${
                        msg.is_read ? 'border-slate-100 opacity-75 hover:opacity-100' : 'border-primary/30 ring-1 ring-primary/10 shadow-md'
                    }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                            {msg.is_read ? <CheckCircle size={24} /> : <Mail size={24} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className={`font-bold text-lg ${msg.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{msg.title}</h3>
                                <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                    <Clock size={12} />
                                    {formatDate(msg.created_at)}
                                </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                            
                            {!msg.is_read && (
                                <div className="mt-4 flex justify-end">
                                    <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full">رسالة جديدة</span>
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
