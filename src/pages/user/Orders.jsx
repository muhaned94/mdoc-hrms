import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { FileText, Calendar, ExternalLink } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Orders() {
  const { session } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) fetchOrders()
  }, [session])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('employee_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800">الأوامر الإدارية</h1>
      <p className="text-slate-500">جميع الكتب الرسمية والشكر والتقدير والنقل الخاصة بك</p>

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <FileText size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">لا توجد كتب إدارية</h3>
                <p className="text-slate-400">لم يتم إضافة أي أمر إداري لملفك بعد.</p>
            </div>
        ) : (
            orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-start justify-between group">
                    <div className="flex gap-4">
                        <div className="bg-amber-50 text-amber-600 p-3 rounded-lg h-fit">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-primary transition-colors">{order.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(order.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <a 
                        href={order.file_url} 
                        target="_blank"
                        className="bg-slate-50 group-hover:bg-primary group-hover:text-white text-slate-600 p-2 rounded-lg transition-colors"
                        title="فتح الملف"
                    >
                        <ExternalLink size={20} />
                    </a>
                </div>
            ))
        )}
      </div>
    </div>
  )
}
