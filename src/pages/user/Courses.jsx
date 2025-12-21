import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Calendar, Clock, CheckCircle } from 'lucide-react'
import { formatDate, calculateServiceDuration } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'

export default function Courses() {
  const { session } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) fetchCourses()
  }, [session])

  /* 
    Need to import these at top:
    import { calculateServiceDuration } from '../../utils/dateUtils'
    import { calculateJobGrade } from '../../utils/gradeUtils'
  */
  const [employee, setEmployee] = useState(null)
  
  const fetchCourses = async () => {
    try {
      // Fetch Courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('employee_id', session.user.id)
        .order('course_date', { ascending: false })
      
      if (coursesError) throw coursesError
      setCourses(coursesData)

      // Fetch Employee Details for Grade Calc
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('certificate, hire_date, bonus_service_months')
        .eq('id', session.user.id)
        .single()
      
      if (empError) throw empError
      setEmployee(empData)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getCourseStatus = () => {
    if (!employee) return { deficit: 0 }
    const serviceYears = calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal
    const gradeInfo = calculateJobGrade(employee.certificate, serviceYears)
    const numericGrade = gradeInfo.grade || 10 
    
    const required = numericGrade >= 6 ? 4 : 5
    const current = courses.length
    const deficit = Math.max(required - current, 0)
    
    return { deficit }
  }

  const courseStatus = getCourseStatus()

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">سجل الدورات التدريبية</h1>
        {employee && (
             <div className={`px-3 py-1 rounded-full text-xs font-bold ${courseStatus.deficit > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {courseStatus.deficit > 0 ? `لديك نقص ${courseStatus.deficit} دورات` : 'مستوفي المتطلبات'}
             </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-xl text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <GraduationCap size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">لا توجد دورات مسجلة</h3>
                <p className="text-slate-400">سجل المشاركات في الدورات التدريبية فارغ حالياً.</p>
            </div>
        ) : (
            courses.map(course => (
                <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                    <div className="flex items-start gap-4">
                        <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">{course.course_name}</h3>
                            <div className="space-y-1">
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>التاريخ: {formatDate(course.course_date)}</span>
                                </p>
                                <p className="text-sm text-green-600 flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    <span>مكتملة</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  )
}
