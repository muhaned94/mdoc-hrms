import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Filter, Database, Briefcase, MapPin, Calendar, DollarSign, FileText, ArrowUpDown, Clock, Printer, Download } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'

export default function EmployeeGrid() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [workSysFilter, setWorkSysFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

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

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

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

  const handleExport = () => {
      const dataToExport = filteredEmployees.map(emp => ({
          'الاسم الكامل': emp.full_name,
          'رقم الشركة': emp.company_id,
          'المنصب': emp.position,
          'العنوان الوظيفي': emp.job_title,
          'موقع العمل': emp.work_location,
          'نظام الدوام': emp.work_schedule === 'morning' ? 'صباحي' : 'مناوب',
          'عنوان السكن': emp.address,
          'رقم الهاتف': emp.phone_number,
          'البريد الإلكتروني': emp.email,
          'الراتب الكلي': emp.total_salary,
          'تاريخ التعيين': formatDate(emp.hire_date),
          'سنوات الخدمة': calculateYearsOfService(emp.hire_date),
          'التحصيل الدراسي': emp.certificate,
          'التخصص': emp.specialization,
          'تاريخ الميلاد': formatDate(emp.birth_date),
          'تاريخ الإضافة': formatDate(emp.created_at)
      }))

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Employees")
      XLSX.writeFile(wb, `employees_grid_export_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const handlePrint = () => {
      window.print()
  }

  // Filter & Sort Logic
  const getProcessedEmployees = () => {
      let filtered = employees.filter(emp => {
        const term = searchTerm.toLowerCase()
        const matchesSearch = 
            (emp.full_name && emp.full_name.toLowerCase().includes(term)) ||
            (emp.company_id && String(emp.company_id).includes(term))
        
        const matchesJob = jobFilter ? emp.job_title === jobFilter : true
        const matchesLocation = locationFilter ? emp.work_location === locationFilter : true
        const matchesWorkSys = workSysFilter ? emp.work_schedule === workSysFilter : true
        return matchesSearch && matchesJob && matchesLocation && matchesWorkSys
      })

      if (sortConfig.key) {
          filtered.sort((a, b) => {
              let aValue, bValue
              
              switch(sortConfig.key) {
                  case 'company_id':
                        // Try native number sort if possible, else string
                      const aNum = parseInt(a.company_id)
                      const bNum = parseInt(b.company_id)
                      if (!isNaN(aNum) && !isNaN(bNum)) {
                          aValue = aNum
                          bValue = bNum
                      } else {
                          aValue = a.company_id || ''
                          bValue = b.company_id || ''
                      }
                      break
                  case 'full_name':
                      aValue = a.full_name || ''
                      bValue = b.full_name || ''
                      break
                  case 'position':
                      aValue = a.position || ''
                      bValue = b.position || ''
                      break
                   case 'address':
                      aValue = a.address || ''
                      bValue = b.address || ''
                      break
                  case 'job_title':
                      aValue = a.job_title || ''
                      bValue = b.job_title || ''
                      break
                  case 'work_location':
                      aValue = a.work_location || ''
                      bValue = b.work_location || ''
                      break
                  case 'work_schedule':
                      aValue = a.work_schedule || ''
                      bValue = b.work_schedule || ''
                      break
                  case 'total_salary':
                      aValue = a.total_salary || 0
                      bValue = b.total_salary || 0
                      break
                  case 'hire_date':
                      aValue = new Date(a.hire_date || 0).getTime()
                      bValue = new Date(b.hire_date || 0).getTime()
                      break
                   case 'years_of_service':
                      aValue = calculateYearsOfService(a.hire_date)
                      bValue = calculateYearsOfService(b.hire_date)
                      break
                  case 'certificate':
                      aValue = a.certificate || ''
                      bValue = b.certificate || ''
                      break
                  case 'specialization':
                      aValue = a.specialization || ''
                      bValue = b.specialization || ''
                      break
                  case 'birth_date':
                      aValue = new Date(a.birth_date || 0).getTime()
                      bValue = new Date(b.birth_date || 0).getTime()
                      break
                  default:
                      return 0
              }

              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
              return 0
          })
      }
      return filtered
  }

  const filteredEmployees = getProcessedEmployees()

  // Unique values for dropdowns
  const uniqueJobs = [...new Set(employees.map(e => e.job_title).filter(Boolean))]
  const uniqueLocations = [...new Set(employees.map(e => e.work_location).filter(Boolean))]

  const SortIcon = ({ column }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-slate-300 opacity-50" />
      return <ArrowUpDown size={14} className={`text-primary ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
  }

  const HeaderCell = ({ label, column, disableSort = false }) => (
      <th 
        className={`p-4 border-l border-slate-100 ${disableSort ? '' : 'cursor-pointer hover:bg-slate-100 transition-colors select-none group'}`}
        onClick={() => !disableSort && handleSort(column)}
      >
          <div className="flex items-center justify-between gap-2">
              <span>{label}</span>
              {!disableSort && <SortIcon column={column} />}
          </div>
      </th>
  )

  if (loading) return <div className="p-10 text-center text-slate-500">جاري تحميل البيانات...</div>

  return (
    <div className="space-y-6 print:p-0 print:space-y-0">
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-fit-table { width: 100% !important; font-size: 9px !important; }
            .print-fit-table th, .print-fit-table td { padding: 4px !important; white-space: normal !important; }
            .print-hidden { display: none !important; }
            /* Hide scrollbars and allow table to expand */
            .overflow-x-auto { overflow: visible !important; }
          }
        `}
      </style>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-primary" />
                سجل الموظفين الشامل
            </h1>
            <p className="text-slate-500 text-sm">عرض تفصيلي لجميع بيانات الموظفين - يمكنك الضغط على عناوين الجدول للترتيب</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
            >
                <Printer size={20} />
                <span className="hidden sm:inline">طباعة</span>
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-white border border-slate-200 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors"
            >
                <Download size={20} />
                <span className="hidden sm:inline">تصدير Excel</span>
            </button>
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
                        className="w-full appearance-none pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
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
                        value={workSysFilter}
                        onChange={(e) => setWorkSysFilter(e.target.value)}
                        className="w-full appearance-none pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">كل أنظمة العمل</option>
                        <option value="morning">صباحي</option>
                        <option value="shift">مناوبات</option>
                    </select>
                    <Clock className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>

                <div className="relative min-w-[150px]">
                    <select
                         value={locationFilter}
                         onChange={(e) => setLocationFilter(e.target.value)}
                         className="w-full appearance-none pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
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
             <table className="w-full text-sm text-right whitespace-nowrap print-fit-table">
                 <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                     <tr>
                         <th className="p-4 border-l border-slate-100">م</th>
                         <HeaderCell label="رقم الشركة" column="company_id" />
                         <HeaderCell label="الأسم الكامل" column="full_name" />
                         <HeaderCell label="المنصب" column="position" />
                         <HeaderCell label="العنوان الوظيفي" column="job_title" />
                         <HeaderCell label="موقع العمل" column="work_location" />
                         <HeaderCell label="عنوان السكن" column="address" />
                         <HeaderCell label="رقم الهاتف" column="phone_number" disableSort={true} />
                         <HeaderCell label="البريد الإلكتروني" column="email" disableSort={true} />
                         <HeaderCell label="نظام العمل" column="work_schedule" />
                         <HeaderCell label="الراتب الكلي" column="total_salary" />
                         <HeaderCell label="سنوات الخدمة" column="years_of_service" />
                         <HeaderCell label="تاريخ التعيين" column="hire_date" />
                         <HeaderCell label="التحصيل الدراسي" column="certificate" />
                         <HeaderCell label="التخصص" column="specialization" />
                         <HeaderCell label="تاريخ الميلاد" column="birth_date" />
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredEmployees.map((emp, index) => (
                         <tr key={emp.id} className="hover:bg-blue-50/50 transition-colors">
                             <td className="p-4 text-center text-slate-400 border-l border-slate-100">{index + 1}</td>
                             <td className="p-4 text-slate-600 font-mono border-l border-slate-100 font-bold">{emp.company_id}</td>
                             <td className="p-4 font-bold text-slate-800 border-l border-slate-100 flex items-center gap-2">
                                 <img src={emp.avatar_url || `https://ui-avatars.com/api/?name=${emp.full_name}&background=random`} className="w-6 h-6 rounded-full" />
                                 {emp.full_name}
                             </td>
                             <td className="p-4 text-slate-700 border-l border-slate-100">{emp.position || '-'}</td>
                             <td className="p-4 text-blue-600 font-medium border-l border-slate-100">{emp.job_title}</td>
                             <td className="p-4 text-slate-600 border-l border-slate-100">{emp.work_location}</td>
                             <td className="p-4 text-slate-600 border-l border-slate-100">{emp.address || '-'}</td>
                             <td className="p-4 text-slate-600 font-mono border-l border-slate-100 direction-ltr">{emp.phone_number || '-'}</td>
                             <td className="p-4 text-slate-600 font-mono border-l border-slate-100">{emp.email || '-'}</td>
                             <td className="p-4 border-l border-slate-100">
                                 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${emp.work_schedule === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                     {emp.work_schedule === 'morning' ? 'صباحي' : 'مناوبات'}
                                 </span>
                             </td>
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
         <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between print:hidden">
             <span>العدد الكلي: {filteredEmployees.length} موظف</span>
             <span>قم بالتمرير أفقيًا لعرض المزيد من البيانات &larr;</span>
         </div>
      </div>
    </div>
  )
}
