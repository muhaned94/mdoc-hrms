import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Filter, Database, Briefcase, MapPin, Calendar, DollarSign, FileText } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function EmployeeGrid() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter Logic
  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
        (emp.full_name && emp.full_name.toLowerCase().includes(term)) ||
        (emp.company_id && String(emp.company_id).includes(term))
    
    const matchesJob = jobFilter ? emp.job_title === jobFilter : true
    const matchesLocation = locationFilter ? emp.work_location === locationFilter : true

    return matchesSearch && matchesJob && matchesLocation
  })

  // Unique values for dropdowns
  const uniqueJobs = [...new Set(employees.map(e => e.job_title).filter(Boolean))]
  const uniqueLocations = [...new Set(employees.map(e => e.work_location).filter(Boolean))]

  const calculateYearsOfService = (hireDate) => {
    if (!hireDate) return 0
    const start = new Date(hireDate)
    const now = new Date()
    let years = now.getFullYear() - start.getFullYear()
    const m = now.getMonth() - start.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
        years--
    }
    return Math.max(0, years)
  }

  if (loading) return <div className="p-10 text-center text-slate-500">جاري تحميل البيانات...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
// ... (rest of the file remains same until the table row)
// Wait, I can't replace the huge block. I'll make two edits. 
// Edit 1: Insert the function.
// Edit 2: Update the usage.

            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-primary" />
                سجل الموظفين الشامل
            </h1>
            <p className="text-slate-500 text-sm">عرض تفصيلي لجميع بيانات الموظفين</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="بحث بالأسم أو رقم الشركة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
                />
                <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="relative min-w-[150px]">
                    <select
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                        className="w-full appearance-none pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">كل العناوين الوظيفية</option>
                        {uniqueJobs.map(job => (
                            <option key={job} value={job}>{job}</option>
                        ))}
                    </select>
                    <Briefcase className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>

                <div className="relative min-w-[150px]">
                    <select
                         value={locationFilter}
                         onChange={(e) => setLocationFilter(e.target.value)}
                         className="w-full appearance-none pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">كل المواقع</option>
                        {uniqueLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    <MapPin className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>
      </div>

      {/* Large Grid Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-right whitespace-nowrap">
                 <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                     <tr>
                         <th className="p-4 border-l border-slate-100">م</th>
                         <th className="p-4 border-l border-slate-100">الأسم الكامل</th>
                         <th className="p-4 border-l border-slate-100">رقم الشركة</th>
                         <th className="p-4 border-l border-slate-100">العنوان الوظيفي</th>
                         <th className="p-4 border-l border-slate-100">موقع العمل</th>
                         <th className="p-4 border-l border-slate-100">نظام العمل</th>
                         <th className="p-4 border-l border-slate-100">الراتب الاسمي</th>
                         <th className="p-4 border-l border-slate-100">الراتب الكلي</th>
                         <th className="p-4 border-l border-slate-100">سنوات الخدمة</th>
                         <th className="p-4 border-l border-slate-100">تاريخ التعيين</th>
                         <th className="p-4 border-l border-slate-100">التحصيل الدراسي</th>
                         <th className="p-4 border-l border-slate-100">التخصص</th>
                         <th className="p-4">تاريخ الميلاد</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredEmployees.map((emp, index) => (
                         <tr key={emp.id} className="hover:bg-blue-50/50 transition-colors">
                             <td className="p-4 text-center text-slate-400 border-l border-slate-100">{index + 1}</td>
                             <td className="p-4 font-bold text-slate-800 border-l border-slate-100 flex items-center gap-2">
                                 <img src={emp.avatar_url || `https://ui-avatars.com/api/?name=${emp.full_name}&background=random`} className="w-6 h-6 rounded-full" />
                                 {emp.full_name}
                             </td>
                             <td className="p-4 text-slate-600 font-mono border-l border-slate-100">{emp.company_id}</td>
                             <td className="p-4 text-blue-600 font-medium border-l border-slate-100">{emp.job_title}</td>
                             <td className="p-4 text-slate-600 border-l border-slate-100">{emp.work_location}</td>
                             <td className="p-4 border-l border-slate-100">
                                 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${emp.work_schedule === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                     {emp.work_schedule === 'morning' ? 'صباحي' : 'مناوبات'}
                                 </span>
                             </td>
                             <td className="p-4 text-emerald-600 font-mono border-l border-slate-100">{Number(emp.nominal_salary).toLocaleString()} IQD</td>
                             <td className="p-4 text-green-700 font-bold font-mono border-l border-slate-100">{Number(emp.total_salary).toLocaleString()} IQD</td>
                             <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-700">{calculateYearsOfService(emp.hire_date)} سنة</td>
                             <td className="p-4 border-l border-slate-100">{formatDate(emp.hire_date)}</td>
                             <td className="p-4 border-l border-slate-100">{emp.certificate}</td>
                             <td className="p-4 border-l border-slate-100">{emp.specialization}</td>
                             <td className="p-4 text-slate-500">{formatDate(emp.birth_date)}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
         <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between">
             <span>العدد الكلي: {filteredEmployees.length} موظف</span>
             <span>قم بالتمرير أفقيًا لعرض المزيد من البيانات &larr;</span>
         </div>
      </div>
    </div>
  )
}
