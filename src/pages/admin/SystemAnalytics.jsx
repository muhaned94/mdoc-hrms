import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Activity, Users, Clock, Monitor } from 'lucide-react'
import { formatDateTime } from '../../utils/dateUtils' // Ensure this exists

export default function SystemAnalytics() {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // 1. Subscribe to Real-time Presence
  useEffect(() => {
    const channel = supabase.channel('online-users')
    
    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            // State is an object where keys are presence_ref_ids, values are arrays of presence objects
            // flatten it
            const users = []
            for (const key in state) {
                users.push(...state[key])
            }
            // Filter duplicates if any (though usually presence tracks separate tabs as separate presences)
            setOnlineUsers(users)
        })
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, [])

  // 2. Fetch Historical Logs
  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
      try {
          const { data, error } = await supabase
            .from('user_activity_logs')
            .select(`
                id,
                action_type,
                path,
                created_at,
                employees ( full_name, avatar_url )
            `)
            .order('created_at', { ascending: false })
            .limit(50) // Last 50 actions

          if (error) throw error
          
          // Map employees data
          const formatted = data.map(log => ({
              ...log,
              user_name: log.employees?.full_name || 'Unknown User',
              avatar: log.employees?.avatar_url
          }))
          
          setActivityLogs(formatted)
      } catch (err) {
          console.error('Error fetching logs:', err)
      } finally {
          setLoadingLogs(false)
      }
  }

  // Calculate stats
  const pageViews = activityLogs.filter(l => l.action_type === 'navigation').length
  
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-primary" />
                تحليل النظام
            </h1>
            <p className="text-slate-500 text-sm">مراقبة حية للمستخدمين وسجل النشاطات</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">{onlineUsers.length}</h3>
                    <p className="text-sm text-slate-500">مستخدم متصل الآن</p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Monitor size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">{pageViews}</h3>
                    <p className="text-sm text-slate-500">تصفح صفحة (آخر 50 سجل)</p>
                </div>
            </div>
        </div>

        {/* Online Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex justify-between items-center">
                <span>المستخدمين المتصلين حالياً (Real-time)</span>
                <span className="text-green-500 animate-pulse text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    مباشر
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-3">المستخدم</th>
                            <th className="p-3">الصفحة الحالية</th>
                            <th className="p-3">وقت الدخول</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {onlineUsers.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-slate-400">لا يوجد مستخدمين متصلين حالياً</td>
                            </tr>
                        ) : (
                            onlineUsers.map((u, i) => (
                                <tr key={i}>
                                    <td className="p-3 font-bold text-slate-700">
                                        {u.full_name}
                                    </td>
                                    <td className="p-3 text-blue-600 font-mono" dir="ltr">
                                        {u.current_path}
                                    </td>
                                    <td className="p-3 text-slate-500">
                                        {formatDateTime(u.online_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">
                سجل النشاطات الأخير
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                     <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-3">المستخدم</th>
                            <th className="p-3">النشاط</th>
                            <th className="p-3">التفاصيل</th>
                            <th className="p-3">الوقت</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loadingLogs ? (
                             <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-400">جاري تحميل السجلات...</td>
                            </tr>
                        ) : activityLogs.map(log => (
                            <tr key={log.id}>
                                <td className="p-3 font-medium text-slate-700">
                                    {log.user_name}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                        log.action_type === 'login' ? 'bg-green-100 text-green-700' :
                                        log.action_type === 'logout' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {log.action_type === 'login' ? 'تسجيل دخول' :
                                         log.action_type === 'logout' ? 'تسجيل خروج' :
                                         'تصفح'}
                                    </span>
                                </td>
                                <td className="p-3 text-slate-600 font-mono text-xs" dir="ltr">
                                    {log.path || '-'}
                                </td>
                                <td className="p-3 text-slate-500 text-xs">
                                    {formatDateTime(log.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  )
}
