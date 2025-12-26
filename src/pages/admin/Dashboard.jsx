import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, UserPlus, Clock, Sun, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    morning: 0,
    shift: 0,
    newHires: 0
  })
  const [locationStats, setLocationStats] = useState([])
  const [recentEmployees, setRecentEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
      
      if (error) throw error

      const total = data.length
      const morning = data.filter(e => e.work_schedule === 'morning').length
      const shift = data.filter(e => e.work_schedule === 'shift').length
      // New hires in last year
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const newHires = data.filter(e => new Date(e.hire_date) > oneYearAgo).length

      setStats({ total, morning, shift, newHires })
      
      // Calculate Location Stats
      const locs = {}
      data.forEach(e => {
        const loc = e.work_location || 'غير محدد'
        locs[loc] = (locs[loc] || 0) + 1
      })
      
      const locStats = Object.entries(locs).map(([name, value]) => ({ name, value }))
                         .sort((a, b) => b.value - a.value)
      setLocationStats(locStats)
      
      // Fetch 5 most recent employees
      const { data: recent } = await supabase
        .from('employees')
        .select('*')
        .not('hire_date', 'is', null) // Filter out nulls to ensure we get actual recent hires
        .order('hire_date', { ascending: false })
        .limit(5)
      
      setRecentEmployees(recent || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري تحميل الإحصائيات...</div>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">لوحة التحكم</h2>
        <p className="text-slate-500">نظرة عامة على الموارد البشرية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/employees" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all hover:border-primary/20 group">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1 group-hover:text-primary transition-colors">إجمالي الموظفين</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
        </Link>

        <Link to="/admin/employees" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all hover:border-amber-200 group">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1 group-hover:text-amber-600 transition-colors">الدوام الصباحي</p>
            <p className="text-3xl font-bold text-amber-600">{stats.morning}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sun size={24} />
          </div>
        </Link>

        <Link to="/admin/employees" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all hover:border-indigo-200 group">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1 group-hover:text-indigo-600 transition-colors">المناوبين</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.shift}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Moon size={24} />
          </div>
        </Link>

         <Link to="/admin/employees" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all hover:border-green-200 group">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1 group-hover:text-green-600 transition-colors">تعيينات جديدة</p>
            <p className="text-3xl font-bold text-green-600">{stats.newHires}</p>
            <p className="text-xs text-slate-400">آخر سنة</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus size={24} />
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Link to="/admin/add-employee" className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer block">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all">
                <UserPlus size={120} />
            </div>
            <h3 className="text-2xl font-bold mb-2">إضافة موظف جديد</h3>
            <p className="text-slate-400 mb-6 max-w-xs">تسجيل بيانات موظف جديد أو استيراد البيانات من ملف Excel المتكامل.</p>
            <div className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors inline-block">
                بدء الإضافة
            </div>
         </Link>

         <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-4">توزيع مواقع العمل</h3>
            <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={locationStats}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {locationStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="block text-3xl font-bold text-slate-800">{stats.total}</span>
                        <span className="text-xs text-slate-400">موظف</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {locationStats.slice(0, 6).map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                         <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-slate-600 truncate">{entry.name}</span>
                         </div>
                         <span className="font-bold text-slate-800">{entry.value}</span>
                    </div>
                ))}
            </div>
            {locationStats.length > 6 && (
                <div className="mt-2 text-center text-[10px] text-slate-400">
                    +{locationStats.length - 6} مواقع أخرى
                </div>
            )}
         </div>
      </div>

      {/* Recent Employees Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">أحدث التعيينات</h3>
            <Link to="/admin/employees" className="text-sm text-primary font-bold hover:underline">عرض الكل</Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-sm">
                    <tr>
                        <th className="p-4 font-bold">الموظف</th>
                        <th className="p-4 font-bold">العنوان الوظيفي</th>
                        <th className="p-4 font-bold">تاريخ التعيين</th>
                        <th className="p-4 font-bold">مكان العمل</th>
                        <th className="p-4 font-bold">الإجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {recentEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs">
                                        {emp.full_name[0]}
                                    </div>
                                    <span className="font-medium text-slate-700">{emp.full_name}</span>
                                </div>
                            </td>
                            <td className="p-4 text-slate-600 text-sm">{emp.job_title}</td>
                            <td className="p-4 text-slate-500 text-sm">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ar-EG') : '-'}</td>
                            <td className="p-4 text-slate-500 text-sm">{emp.work_location || '-'}</td>
                            <td className="p-4">
                                <Link to={`/admin/employees/${emp.id}`} className="text-primary hover:underline font-bold text-xs text-left block">
                                    تفاصيل
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {recentEmployees.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-400">لا توجد بيانات متاحة</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}
