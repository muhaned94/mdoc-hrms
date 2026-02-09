import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Activity, Users, Clock, Monitor, AlertTriangle, Terminal } from 'lucide-react'
import { formatDateTime } from '../../utils/dateUtils'

export default function SystemAnalytics() {
    const [onlineUsers, setOnlineUsers] = useState([])
    const [activityLogs, setActivityLogs] = useState([])
    const [loadingLogs, setLoadingLogs] = useState(true)
    const [dbError, setDbError] = useState(null)
    const [showSetup, setShowSetup] = useState(false)

    // 1. Subscribe to Real-time Presence
    useEffect(() => {
        const channel = supabase.channel('online-users')

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const users = []
                for (const key in state) {
                    users.push(...state[key])
                }
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
            setLoadingLogs(true)
            // Fetch from the Secure View instead of direct table join
            const { data, error } = await supabase
                .from('analytics_logs_view')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            const formatted = data.map(log => ({
                ...log,
                user_name: log.full_name || 'Unknown User',
                avatar: log.avatar_url
            }))

            setActivityLogs(formatted)
        } catch (err) {
            console.error('Error fetching logs:', err)
            setDbError(err)
            setShowSetup(true)
        } finally {
            setLoadingLogs(false)
        }
    }

    const pageViews = activityLogs.filter(l => l.action_type === 'navigation').length

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-primary" />
                        تحليل النظام
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">مراقبة حية للمستخدمين وسجل النشاطات</p>
                </div>
                <button
                    onClick={() => setShowSetup(!showSetup)}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                >
                    <Terminal size={16} />
                    {showSetup ? 'إخفاء كود التثبيت' : 'صيانة / إعداد قاعدة البيانات'}
                </button>
            </div>

            {/* Database Error/Setup Banner */}
            {(dbError || showSetup) && (
                <div className={`border rounded-xl p-4 flex flex-col gap-3 ${dbError ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30'}`}>
                    <div className={`flex items-center gap-2 font-bold ${dbError ? 'text-amber-800 dark:text-amber-400' : 'text-blue-800 dark:text-blue-400'}`}>
                        {dbError ? <AlertTriangle size={20} /> : <Terminal size={20} />}
                        <span>{dbError ? 'تنبيه: مطلوب إجراء صيانة' : 'إعداد جدول السجلات (SQL Setup)'}</span>
                    </div>
                    <p className={`text-sm ${dbError ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                        {dbError
                            ? `حدث خطأ (${dbError.code || 'Unknown'}). الجدول غير موجود أو الصلاحيات مفقودة.`
                            : 'لتفعيل سجل النشاطات، يرجى تشغيل الكود التالي في Supabase SQL Editor:'}
                    </p>
                    <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto direction-ltr text-left relative group">
                        <pre>
                            {`-- Run this in Supabase SQL Editor (Fixes Custom Auth Issues)
-- 1. Reset
drop view if exists public.analytics_logs_view;
drop table if exists public.user_activity_logs;

-- 2. Create Table
create table public.user_activity_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.employees(id) on delete cascade not null,
    action_type text not null,
    path text,
    details jsonb, 
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Security (Enable Anon Access for Custom Login)
alter table public.user_activity_logs enable row level security;
grant all on public.user_activity_logs to anon, authenticated, service_role;

create policy "Allow Public Insert" on public.user_activity_logs for insert with check (true);
create policy "Allow Public Select" on public.user_activity_logs for select using (true);

-- 4. Create View
create or replace view public.analytics_logs_view as
select l.id, l.user_id, l.action_type, l.path, l.created_at, e.full_name, e.avatar_url
from public.user_activity_logs l
left join public.employees e on l.user_id = e.id;

grant select on public.analytics_logs_view to anon, authenticated, service_role;`}
                        </pre>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => { setDbError(null); fetchLogs(); }}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
                        >
                            تم تشغيل الكود - أعد المحاولة
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{onlineUsers.length}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">مستخدم متصل الآن</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                        <Monitor size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{pageViews}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">تصفح صفحة (آخر 50 سجل)</p>
                    </div>
                </div>
            </div>

            {/* Online Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 font-bold text-slate-700 dark:text-white flex justify-between items-center">
                    <span>المستخدمين المتصلين حالياً (Real-time)</span>
                    <span className="text-green-500 animate-pulse text-xs flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        مباشر
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="p-3">المستخدم</th>
                                <th className="p-3">الصفحة الحالية</th>
                                <th className="p-3">وقت الدخول</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {onlineUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-slate-400">لا يوجد مستخدمين متصلين حالياً</td>
                                </tr>
                            ) : (
                                onlineUsers.map((u, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-3 font-bold text-slate-700 dark:text-white">
                                            {u.full_name}
                                        </td>
                                        <td className="p-3 text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 font-bold text-slate-700 dark:text-white">
                    سجل النشاطات الأخير
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="p-3">المستخدم</th>
                                <th className="p-3">النشاط</th>
                                <th className="p-3">التفاصيل</th>
                                <th className="p-3">الوقت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loadingLogs ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">جاري تحميل السجلات...</td>
                                </tr>
                            ) : activityLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-3 font-medium text-slate-700 dark:text-white">
                                        {log.user_name}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${log.action_type === 'login' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                log.action_type === 'logout' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                            }`}>
                                            {log.action_type === 'login' ? 'تسجيل دخول' :
                                                log.action_type === 'logout' ? 'تسجيل خروج' :
                                                    'تصفح'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-xs" dir="ltr">
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
