import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Filter, Plus, FileSpreadsheet, Eye, Edit, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all') // 'all', 'morning', 'shift'
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState([])
  const [deleting, setDeleting] = useState(false)
  
  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          setSelectedIds(filteredEmployees.map(emp => emp.id))
      } else {
          setSelectedIds([])
      }
  }

  const handleSelectOne = (id) => {
      setSelectedIds(prev => {
          if (prev.includes(id)) return prev.filter(x => x !== id)
          return [...prev, id]
      })
  }

  const handleBulkDelete = async () => {
      if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} موظف؟ لا يمكن التراجع عن هذا الإجراء.`)) return

      setDeleting(true)
      try {
          const { error } = await supabase
              .from('employees')
              .delete()
              .in('id', selectedIds)
          
          if (error) throw error
          
          setEmployees(prev => prev.filter(emp => !selectedIds.includes(emp.id)))
          setSelectedIds([])
          alert('تم الحذف بنجاح')
      } catch (err) {
          alert('فشل الحذف: ' + err.message)
      } finally {
          setDeleting(false)
      }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.company_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.job_title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterRole === 'all' || emp.work_schedule === filterRole

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">إدارة الموظفين</h1>
        <div className="flex gap-2">
            {selectedIds.length > 0 && (
                <button 
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                >
                    <Trash2 size={20} />
                    <span>حذف المحدد ({selectedIds.length})</span>
                </button>
            )}
            <Link 
            to="/admin/add-employee"
            className="flex items-center gap-2 bg-primary hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
            <Plus size={20} />
            <span>إضافة موظف</span>
            </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="absolute right-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الرقم الوظيفي..." 
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 md:col-span-1">
          <Filter className="text-slate-400" size={18} />
          <select 
            className="w-full py-2.5 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary bg-white"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">جميع أنظمة الدوام</option>
            <option value="morning">صباحي</option>
            <option value="shift">مناوب</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4 w-4">
                    <input 
                        type="checkbox" 
                        className="rounded border-slate-300 transform scale-125 cursor-pointer accent-primary"
                        checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                        onChange={handleSelectAll}
                    />
                </th>
                <th className="px-6 py-4">رقم الشركة</th>
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4">العنوان الوظيفي</th>
                <th className="px-6 py-4">نظام الدوام</th>
                <th className="px-6 py-4">مكان العمل</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">لا يوجد موظفين مطابقين</td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(emp.id) ? 'bg-sky-50' : ''}`}>
                    <td className="px-6 py-4">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 transform scale-125 cursor-pointer accent-primary"
                            checked={selectedIds.includes(emp.id)}
                            onChange={() => handleSelectOne(emp.id)}
                        />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{emp.company_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {emp.full_name?.charAt(0)}
                        </div>
                        <span>{emp.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{emp.job_title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.work_schedule === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {emp.work_schedule === 'morning' ? 'صباحي' : 'مناوب'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{emp.work_location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/employees/${emp.id}`} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-lg" title="عرض التفاصيل">
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
