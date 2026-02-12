import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Filter, GraduationCap, CheckCircle2, UserPlus, Users, X, Info, Calendar, Clock, MapPin, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BulkCourseAssign() {
    const navigate = useNavigate()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLocation, setFilterLocation] = useState('all')
    const [selectedIds, setSelectedIds] = useState([])

    // Course Metadata
    const [courseData, setCourseData] = useState({
        course_name: '',
        course_date: new Date().toISOString().slice(0, 10),
        duration: 'أسبوع',
        location: ''
    })
    const [assigning, setAssigning] = useState(false)

    useEffect(() => {
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('employees')
                .select('id, full_name, company_id, work_location, job_title')
                .order('full_name', { ascending: true })

            if (error) throw error
            setEmployees(data)
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }

    const locations = [...new Set(employees.map(emp => emp.work_location).filter(Boolean))].sort()

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.company_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.job_title?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLocation = filterLocation === 'all' || emp.work_location === filterLocation

        return matchesSearch && matchesLocation
    })

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

    const handleBatchAssign = async (e) => {
        e.preventDefault()
        if (selectedIds.length === 0) return alert('يرجى اختيار موظف واحد على الأقل')
        if (!courseData.course_name || !courseData.course_date) return alert('يرجى ملء بيانات الدورة')

        if (!confirm(`هل أنت متأكد من إضافة هذه الدورة لـ ${selectedIds.length} موظف؟`)) return

        setAssigning(true)
        try {
            const inserts = selectedIds.map(empId => ({
                employee_id: empId,
                course_name: courseData.course_name,
                course_date: courseData.course_date,
                duration: courseData.duration,
                location: courseData.location
            }))

            const { error } = await supabase
                .from('courses')
                .insert(inserts)

            if (error) throw error

            alert('تمت إضافة الدورة للموظفين بنجاح')
            navigate('/admin/employees')
        } catch (err) {
            alert('فشل الإضافة: ' + err.message)
        } finally {
            setAssigning(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <GraduationCap className="text-primary" size={28} />
                        رفع الدورات الجماعي
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">تخصيص دورة تدريبية لمجموعة من الموظفين في آن واحد</p>
                </div>
            </div>

            <form onSubmit={handleBatchAssign} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Right: Course Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 sticky top-6">
                        <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white flex items-center gap-2">
                            <Info size={20} className="text-primary" />
                            بيانات الدورة
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">اسم الدورة</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    placeholder="مثلاً: دورة السلامة المهنية"
                                    value={courseData.course_name}
                                    onChange={e => setCourseData({ ...courseData, course_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">التاريخ</label>
                                    <div className="relative">
                                        <Calendar className="absolute right-3 top-3 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-white text-sm"
                                            value={courseData.course_date}
                                            onChange={e => setCourseData({ ...courseData, course_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">المدة</label>
                                    <div className="relative">
                                        <Clock className="absolute right-3 top-3 text-slate-400" size={18} />
                                        <select
                                            className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-white text-sm"
                                            value={courseData.duration}
                                            onChange={e => setCourseData({ ...courseData, duration: e.target.value })}
                                        >
                                            <option value="أسبوع">أسبوع</option>
                                            <option value="أسبوعين">أسبوعين</option>
                                            <option value="3 أيام">3 أيام</option>
                                            <option value="شهر">شهر</option>
                                            <option value="أخرى">أخرى</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">مكان الانعقاد</label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                        placeholder="مثلاً: بغداد، واسط، أونلاين..."
                                        value={courseData.location}
                                        onChange={e => setCourseData({ ...courseData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={assigning || selectedIds.length === 0}
                                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {assigning ? 'جاري المعالجة...' : (
                                        <>
                                            <Send size={20} />
                                            تخصيص لـ {selectedIds.length} موظف
                                        </>
                                    )}
                                </button>
                                {selectedIds.length === 0 && (
                                    <p className="text-center text-xs text-red-500 mt-2 font-bold">يرجى اختيار الموظفين من القائمة</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left: Employee Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم أو الرقم الوظيفي..."
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-700/50 dark:text-white"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <select
                                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-700/50 dark:text-white text-sm"
                                    value={filterLocation}
                                    onChange={e => setFilterLocation(e.target.value)}
                                >
                                    <option value="all">كل مواقع العمل</option>
                                    {locations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-xl">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-bold">
                                    <tr>
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 transform scale-125 accent-primary"
                                                checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="px-4 py-3">الموظف</th>
                                        <th className="px-4 py-3 font-mono">ID</th>
                                        <th className="px-4 py-3">الموقع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loading ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">جاري التحميل...</td></tr>
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">لا يوجد نتائج</td></tr>
                                    ) : (
                                        filteredEmployees.map(emp => (
                                            <tr
                                                key={emp.id}
                                                className={`hover:bg-primary/5 transition-colors cursor-pointer ${selectedIds.includes(emp.id) ? 'bg-primary/10' : ''}`}
                                                onClick={() => handleSelectOne(emp.id)}
                                            >
                                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 transform scale-125 accent-primary"
                                                        checked={selectedIds.includes(emp.id)}
                                                        onChange={() => handleSelectOne(emp.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                                                    <div className="flex flex-col">
                                                        <span>{emp.full_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-normal">{emp.job_title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 text-xs">{emp.company_id}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                                                        {emp.work_location}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <Users size={14} />
                                <span>إجمالي المعروض: {filteredEmployees.length}</span>
                            </div>
                            <div className="font-bold text-primary">
                                المحدد حالياً: {selectedIds.length}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
