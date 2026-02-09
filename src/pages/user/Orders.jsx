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

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      {/* Unified Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
              <FileText className="fill-current/20" size={32} />
              الأوامر الإدارية
            </h1>
            <p className="text-sky-100 font-medium opacity-90">جميع الكتب الرسمية والشكر والتقدير والنقل الخاصة بك</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center">
            <span className="text-sm block mb-1">إجمالي الكتب</span>
            <span className="text-4xl font-black">{orders.length}</span>
          </div>
        </div>

        {/* Decorations */}
        <FileText className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <Calendar className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-white">لا توجد كتب إدارية</h3>
            <p className="text-slate-400 dark:text-slate-500">لم يتم إضافة أي أمر إداري لملفك بعد.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow flex items-start justify-between group">
              <div className="flex gap-4">
                <div className="bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 p-3 rounded-lg h-fit">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1 group-hover:text-primary transition-colors">{order.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
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
                className="bg-slate-50 dark:bg-slate-900 group-hover:bg-primary group-hover:text-white dark:group-hover:bg-primary text-slate-600 dark:text-slate-400 p-2 rounded-lg transition-colors"
                title="فتح الملف"
              >
                <ExternalLink size={20} />
              </a>
            </div>
          ))
        )}
      </div>
    </div >
  )
}
