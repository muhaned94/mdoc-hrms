import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Users, MapPin, UserCheck, Clock, BarChart3 } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function Reports() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
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

            setStats({
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
            if (!locations[loc]) {
                locations[loc] = {
                    name: loc,
                    employeesCount: 0,
                    engineersCount: 0,
                    adminsCount: 0,
                    morningCount: 0,
                    shiftCount: 0
                }
            }
            locations[loc].employeesCount++

            const title = e.job_title || ''
            if (title.includes('مهندس')) {
                locations[loc].engineersCount++
            } else {
                locations[loc].adminsCount++
            }

            if (e.work_schedule === 'shift') {
                locations[loc].shiftCount++
            } else {
                locations[loc].morningCount++
            }
        })
        return Object.values(locations)
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

    if (loading) return <div className="p-8 text-center text-slate-500">جاري تحليل البيانات...</div>

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                        <BarChart3 className="text-primary" />
                        التقارير والإحصائيات
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">تحليل بيانات الموظفين بصورة تفاعلية</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Users size={24} />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">عدد الموظفين</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalEmployees}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                            <MapPin size={24} />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">عدد المواقع</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{getSalaryByLocation().length}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">المناوبون</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                        {getScheduleDistribution().find(s => s.name === 'مناوب')?.value || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Location Table */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">تحليل المواقع (الموظفين، الاختصاصات، الدوام)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="p-4 rounded-tr-lg">الموقع</th>
                                    <th className="p-4">عدد الموظفين</th>
                                    <th className="p-4">هندسي</th>
                                    <th className="p-4">إداري/فني</th>
                                    <th className="p-4">صباحي</th>
                                    <th className="p-4 rounded-tl-lg">مناوب</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {getSalaryByLocation().map((loc) => (
                                    <tr key={loc.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{loc.name}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded text-xs">{loc.employeesCount}</span>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{loc.engineersCount}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{loc.adminsCount}</td>
                                        <td className="p-4 text-green-600 dark:text-green-400">{loc.morningCount}</td>
                                        <td className="p-4 text-amber-600 dark:text-amber-400">{loc.shiftCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Location Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">توزيع الموظفين حسب الموقع</h3>
                    <div className="h-[400px] w-full flex items-center flex-col lg:flex-row gap-8">
                        <div className="w-full h-full flex-1 min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getSalaryByLocation().map(l => ({ name: l.name, value: l.employeesCount }))}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {getSalaryByLocation().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="lg:w-48 space-y-3 text-sm overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {getSalaryByLocation().map((item, idx) => (
                                <div key={item.name} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">{item.name}</span>
                                    <span className="font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs" style={{ color: COLORS[idx % COLORS.length] }}>
                                        {item.employeesCount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">توزيع نظام الدوام</h3>
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
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="md:w-32 space-y-4 text-sm mt-4 md:mt-0">
                            {getScheduleDistribution().map((item, idx) => (
                                <div key={item.name} className="flex flex-col">
                                    <span className="text-slate-400 text-xs">{item.name}</span>
                                    <span className="font-bold" style={{ color: COLORS[idx] }}>
                                        {item.value} موظف ({stats.totalEmployees > 0 ? Math.round(item.value / stats.totalEmployees * 100) : 0}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
