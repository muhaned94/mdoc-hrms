import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area
} from 'recharts'
import { BarChart3, TrendingUp, Users, Wallet, MapPin } from 'lucide-react'

const COLORS = ['#0ea5e9', '#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6']

export default function Reports() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSalary: 0,
    avgSalary: 0,
    maxSalary: 0,
    totalEmployees: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
      
      if (error) throw error
      setData(employees)

      // Calculate Stats
      const totalSal = employees.reduce((sum, e) => sum + (Number(e.total_salary) || 0), 0)
      const avgSal = employees.length > 0 ? totalSal / employees.length : 0
      const maxSal = Math.max(...employees.map(e => Number(e.total_salary) || 0), 0)
      
      setStats({
        totalSalary: totalSal,
        avgSalary: avgSal,
        maxSalary: maxSal,
        totalEmployees: employees.length
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Data for Charts
  const getSalaryByLocation = () => {
    const locations = {}
    data.forEach(e => {
        const loc = e.work_location || 'غير محدد'
        locations[loc] = (locations[loc] || 0) + (Number(e.total_salary) || 0)
    })
    return Object.entries(locations).map(([name, value]) => ({ name, value }))
  }

  const getScheduleDistribution = () => {
    const schedules = {
        'morning': { name: 'صباحي', value: 0 },
        'shift': { name: 'مناوب', value: 0 }
    }
    data.forEach(e => {
        if (schedules[e.work_schedule]) {
            schedules[e.work_schedule].value++
        }
    })
    return Object.values(schedules)
  }

  const getSalaryComparison = () => {
    // Top 8 job titles by average salary
    const titles = {}
    data.forEach(e => {
        if (!titles[e.job_title]) titles[e.job_title] = { sum: 0, count: 0, nominalSum: 0 }
        titles[e.job_title].sum += (Number(e.total_salary) || 0)
        titles[e.job_title].nominalSum += (Number(e.nominal_salary) || 0)
        titles[e.job_title].count++
    })
    
    return Object.entries(titles)
        .map(([name, s]) => ({
            name: name || 'غير مسمى',
            'الكلي': Math.round(s.sum / s.count),
            'الاسمي': Math.round(s.nominalSum / s.count)
        }))
        .sort((a, b) => b['الكلي'] - a['الكلي'])
        .slice(0, 8)
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحليل البيانات...</div>

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <BarChart3 className="text-primary" />
                التقارير والإحصائيات
            </h1>
            <p className="text-slate-500">تحليل بيانات الموظفين والرواتب بصورة تفاعلية</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Wallet size={24} />
                </div>
                <span className="text-slate-500 text-sm font-medium">إجمالي الرواتب</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.totalSalary.toLocaleString()} <span className="text-xs font-normal">د.ع</span></p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <TrendingUp size={24} />
                </div>
                <span className="text-slate-500 text-sm font-medium">متوسط الرواتب</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{Math.round(stats.avgSalary).toLocaleString()} <span className="text-xs font-normal">د.ع</span></p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Users size={24} />
                </div>
                <span className="text-slate-500 text-sm font-medium">عدد الموظفين</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.totalEmployees}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <MapPin size={24} />
                </div>
                <span className="text-slate-500 text-sm font-medium">أعلى راتب</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.maxSalary.toLocaleString()} <span className="text-xs font-normal">د.ع</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Salary by Location */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">توزيع الرواتب حسب الموقع</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSalaryByLocation()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip 
                            formatter={(value) => [`${value.toLocaleString()} د.ع`, 'إجمالي الرواتب']}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Schedule Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">توزيع نظام الدوام</h3>
            <div className="h-[300px] w-full flex items-center flex-col md:flex-row">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={getScheduleDistribution()}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {getScheduleDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
                <div className="md:w-32 space-y-4 text-sm mt-4 md:mt-0">
                    {getScheduleDistribution().map((item, idx) => (
                        <div key={item.name} className="flex flex-col">
                            <span className="text-slate-400 text-xs">{item.name}</span>
                            <span className="font-bold" style={{color: COLORS[idx]}}>
                                {item.value} موظف ({Math.round(item.value / stats.totalEmployees * 100)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Salary Comparison Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-slate-800 mb-6">مقارنة متوسط الرواتب (الاسمي vs الكلي) لأعلى الوظائف</h3>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getSalaryComparison()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip 
                             contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend />
                        <Bar dataKey="الكلي" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="الاسمي" stroke="#f59e0b" strokeWidth={3} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  )
}
