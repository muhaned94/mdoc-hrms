import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, UserPlus, Clock, Sun, Moon, DatabaseBackup, Download, FileSpreadsheet, Upload, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import * as XLSX from 'xlsx'

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

  const fileInputRef = useRef(null)

  const handleBackup = async () => {
      try {
          const timestamp = new Date().toISOString()
          
          // Fetch ALL Data
          const { data: employees } = await supabase.from('employees').select('*')
          const { data: announcements } = await supabase.from('announcements').select('*')
          const { data: letters } = await supabase.from('appreciation_letters').select('*')
          const { data: orders } = await supabase.from('admin_orders').select('*')
          const { data: slips } = await supabase.from('salary_slips').select('*')
          const { data: courses } = await supabase.from('courses').select('*')
          const { data: messages } = await supabase.from('messages').select('*')
          const { data: views } = await supabase.from('announcement_views').select('*')

          const backupData = {
              version: '1.2', // Incremented version
              timestamp,
              tables: {
                  // Remove unused detailed address fields from backup
                  employees: (employees || []).map(({ governorate, city, mahalla, zgaq, dar, ...rest }) => rest),
                  announcements: announcements || [],
                  appreciation_letters: letters || [],
                  admin_orders: orders || [],
                  salary_slips: slips || [],
                  courses: courses || [],
                  messages: messages || [],
                  announcement_views: views || []
              }
          }

          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          
          const a = document.createElement('a')
          a.href = url
          a.download = `MDOC_Full_Backup_${timestamp.slice(0,10)}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          alert('تم تحميل النسخة الاحتياطية للنظام بالكامل (بيانات وملفات) ✅\nتشمل: الموظفين، الإعلانات، كتب الشكر، الأوامر، الرواتب، الدورات، الرسائل، ومشاهدات الإعلانات.')

      } catch (err) {
          console.error("Backup failed:", err)
          alert('حدث خطأ أثناء النسخ الاحتياطي: ' + err.message)
      }
  }

  const handleRestore = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      if (!window.confirm('⚠️ تحذير: هذه العملية ستقوم باستبدال/تحديث البيانات الحالية بالبيانات الموجودة في ملف النسخة الاحتياطية.\nهل أنت متأكد من المتابعة؟')) {
          return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
          try {
              const backup = JSON.parse(e.target.result)
              
              if (!backup.tables) throw new Error('ملف غير صالح')

              // Restore Employees
              if (backup.tables.employees?.length > 0) {
                  const { error: empErr } = await supabase.from('employees').upsert(backup.tables.employees)
                  if (empErr) throw empErr
              }

              // Restore Announcements
              if (backup.tables.announcements?.length > 0) {
                   const { error: annErr } = await supabase.from('announcements').upsert(backup.tables.announcements)
                   if (annErr) throw annErr
              }

              // Restore Letters
              if (backup.tables.appreciation_letters?.length > 0) {
                  const { error: letErr } = await supabase.from('appreciation_letters').upsert(backup.tables.appreciation_letters)
                  if (letErr) throw letErr
              }

              // Restore Admin Orders
              if (backup.tables.admin_orders?.length > 0) {
                  const { error: ordErr } = await supabase.from('admin_orders').upsert(backup.tables.admin_orders)
                  if (ordErr) throw ordErr
              }

              // Restore Salary Slips
              if (backup.tables.salary_slips?.length > 0) {
                  const { error: slipErr } = await supabase.from('salary_slips').upsert(backup.tables.salary_slips)
                  if (slipErr) throw slipErr
              }

              // Restore Courses
              if (backup.tables.courses?.length > 0) {
                  const { error: courseErr } = await supabase.from('courses').upsert(backup.tables.courses)
                  if (courseErr) throw courseErr
              }

              // Restore Messages
              if (backup.tables.messages?.length > 0) {
                  const { error: msgErr } = await supabase.from('messages').upsert(backup.tables.messages)
                  if (msgErr) throw msgErr
              }

              // Restore Announcement Views
              if (backup.tables.announcement_views?.length > 0) {
                  const { error: viewErr } = await supabase.from('announcement_views').upsert(backup.tables.announcement_views)
                  if (viewErr) throw viewErr
              }

              alert('تم استعادة النظام بنجاح! 🎉\nسيتم تحديث الصفحة الآن.')
              window.location.reload()

          } catch (err) {
              console.error("Restore failed:", err)
              alert('فشلت عملية الاستعادة: ' + err.message)
          }
      }
      reader.readAsText(file)
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-indigo-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group shadow-lg border border-slate-700 md:col-span-1">
            <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all pointer-events-none">
                <DatabaseBackup size={140} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <DatabaseBackup size={22} className="text-emerald-400" />
                        النسخ الاحتياطي والاستعادة
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                        حفظ جميع بيانات النظام والمستمسكات في ملف آمن، أو استرجاع النظام من نسخة سابقة.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <button 
                        onClick={handleBackup}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors w-full shadow-lg"
                    >
                        <Download size={16} />
                        تنزيل نسخة كاملة
                    </button>
                    
                    <div className="relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleRestore}
                            accept=".json"
                            className="hidden"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors w-full border border-slate-600"
                        >
                            <Upload size={16} />
                            استرجاع بيانات
                        </button>
                    </div>
                </div>
            </div>
         </div>
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
