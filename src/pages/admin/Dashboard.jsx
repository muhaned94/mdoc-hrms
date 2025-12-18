import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, UserPlus, Clock, Sun, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    morning: 0,
    shift: 0,
    newHires: 0
  })
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">إجمالي الموظفين</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">الدوام الصباحي</p>
            <p className="text-3xl font-bold text-amber-600">{stats.morning}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Sun size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">المناوبين</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.shift}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
            <Moon size={24} />
          </div>
        </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">تعيينات جديدة</p>
            <p className="text-3xl font-bold text-green-600">{stats.newHires}</p>
            <p className="text-xs text-slate-400">آخر سنة</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
            <UserPlus size={24} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <UserPlus size={120} />
            </div>
            <h3 className="text-2xl font-bold mb-2">إضافة موظف جديد</h3>
            <p className="text-slate-400 mb-6">تسجيل بيانات موظف جديد أو استيراد من Excel</p>
            <Link to="/admin/add-employee" className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors inline-block">
                بدء الإضافة
            </Link>
         </div>

         <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-4">روابط سريعة</h3>
            <div className="space-y-3">
                <Link to="/admin/employees" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors">
                    <span className="flex items-center gap-2">
                        <Users size={18} className="text-slate-400" />
                        <span className="text-slate-700">دليل الموظفين</span>
                    </span>
                    <span className="text-xs text-primary font-bold">عرض</span>
                </Link>
                {/* Add more quick links like 'Generate Report' later */}
            </div>
         </div>
      </div>
    </div>
  )
}
