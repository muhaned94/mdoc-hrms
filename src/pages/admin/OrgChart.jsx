import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { GitGraph, Users, MapPin, ChevronDown, ChevronRight, User } from 'lucide-react'

export default function OrgChart() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupedData, setGroupedData] = useState({})
  const [expandedNodes, setExpandedNodes] = useState({})

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('work_location', { ascending: true })

      if (error) throw error
      
      // Group by Work Location
      const groups = data.reduce((acc, emp) => {
        const loc = emp.work_location || 'غير محدد'
        if (!acc[loc]) acc[loc] = []
        acc[loc].push(emp)
        return acc
      }, {})

      setEmployees(data)
      setGroupedData(groups)
      
      // Expand all by default
      const initialExpanded = Object.keys(groups).reduce((acc, key) => ({...acc, [key]: true}), {})
      setExpandedNodes(initialExpanded)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (key) => {
    setExpandedNodes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <GitGraph size={28} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-800">الهيكل التنظيمي</h1>
            <p className="text-slate-500">عرض شجري للموظفين موزع حسب مواقع العمل</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px] overflow-auto relative">
        {/* Root Node */}
        <div className="flex flex-col items-center">
            
            <div className="border-2 border-indigo-600 bg-indigo-50 px-6 py-4 rounded-xl shadow-sm z-10 text-center mb-8 relative">
                <div className="font-bold text-indigo-900 text-lg">المدير العام / الشركة العامة</div>
                <div className="text-indigo-600 text-sm mt-1">{employees.length} موظف</div>
                
                {/* Vertical Line from Root */}
                <div className="absolute top-full left-1/2 w-0.5 h-8 bg-slate-300 -translate-x-1/2"></div>
            </div>

            {/* Level 2: Locations (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full relative">
                {/* Horizontal Connector Line (Visual Hack for simplistic tree) */}
                <div className="absolute top-[-2rem] left-10 right-10 h-0.5 bg-slate-300 hidden md:block"></div>

                {Object.entries(groupedData).map(([location, staff]) => (
                    <div key={location} className="relative flex flex-col items-center">
                         {/* Vertical Line to Node */}
                         <div className="md:absolute md:-top-8 md:bg-slate-300 md:w-0.5 md:h-8"></div>

                         <div className="w-full">
                            <div 
                                onClick={() => toggleNode(location)}
                                className="cursor-pointer bg-white border border-slate-200 hover:border-indigo-300 transition-colors rounded-lg p-3 shadow-sm flex items-center justify-between z-10 relative"
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-slate-400" />
                                    <div>
                                        <div className="font-bold text-slate-700">{location}</div>
                                        <div className="text-xs text-slate-400">{staff.length} موظف</div>
                                    </div>
                                </div>
                                {expandedNodes[location] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>

                            {/* Children (Employees) */}
                            {expandedNodes[location] && (
                                <div className="mt-2 mr-6 border-r-2 border-slate-100 pr-4 space-y-2">
                                    {staff.map(emp => (
                                        <div key={emp.id} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded text-sm group">
                                            <div className="mt-0.5 text-slate-300 group-hover:text-indigo-400">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-700">{emp.full_name}</div>
                                                <div className="text-xs text-slate-500">{emp.job_title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
