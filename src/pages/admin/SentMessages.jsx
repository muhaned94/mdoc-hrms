import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Send, Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function SentMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSentMessages()
    }
  }, [user])

  const fetchSentMessages = async () => {
    try {
      // 1. Fetch messages sent by current user
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 2. Fetch Receiver Names manually to avoid FK issues if they are broken
      if (msgs && msgs.length > 0) {
        const receiverIds = [...new Set(msgs.map(m => m.receiver_id))]
        const { data: users, error: userError } = await supabase
            .from('employees')
            .select('id, full_name')
            .in('id', receiverIds)
        
        if (!userError && users) {
             const userMap = {}
             users.forEach(u => userMap[u.id] = u.full_name)
             
             // Merge
             const merged = msgs.map(m => ({
                 ...m,
                 receiver_name: userMap[m.receiver_id] || 'مستخدم غير معروف'
             }))
             setMessages(merged)
             return
        }
      }

      setMessages(msgs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل البريد المرسل...</div>

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Send className="text-primary transform -scale-x-100" /> {/* Flip icon for RTL */}
                الرسائل المرسلة
            </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {messages.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Send size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">لا توجد رسائل مرسلة</h3>
                    <p className="text-slate-400">لم تقم بإرسال أي رسائل بعد.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-slate-500 text-sm font-bold">المستلم</th>
                                <th className="p-4 text-slate-500 text-sm font-bold">العنوان</th>
                                <th className="p-4 text-slate-500 text-sm font-bold">نص الرسالة</th>
                                <th className="p-4 text-slate-500 text-sm font-bold">الحالة</th>
                                <th className="p-4 text-slate-500 text-sm font-bold">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {messages.map((msg) => (
                                <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                            <User size={16} className="text-slate-400" />
                                            {msg.receiver_name}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">{msg.title}</td>
                                    <td className="p-4 text-slate-600 max-w-xs truncate" title={msg.body}>
                                        {msg.body}
                                    </td>
                                    <td className="p-4">
                                        {msg.is_read ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                <CheckCircle size={12} />
                                                مقرؤة
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                <Clock size={12} />
                                                لم تقرأ
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {formatDate(msg.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  )
}
