import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { GraduationCap, Calendar, Clock, CheckCircle, MapPin } from 'lucide-react'
import { formatDate, calculateServiceDuration } from '../../utils/dateUtils'
import { calculateJobGrade } from '../../utils/gradeUtils'
import { countWeightedCourses } from '../../utils/courseUtils'

export default function Courses() {
  const { session } = useAuth()
  const { settings } = useSettings()
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
    if (!employee) return { deficit: 0, required: 0 }
    const serviceYears = calculateServiceDuration(employee.hire_date, employee.bonus_service_months).yearsDecimal
    const gradeInfo = calculateJobGrade(employee.certificate, serviceYears, settings.course_settings)

    // Calculate Grade Start Date
    const gradeStartDate = new Date(employee.hire_date);
    if (gradeInfo.yearsOfServiceUsedForPromotion) {
      gradeStartDate.setFullYear(gradeStartDate.getFullYear() + Math.floor(gradeInfo.yearsOfServiceUsedForPromotion));
      const decimalPart = gradeInfo.yearsOfServiceUsedForPromotion % 1;
      gradeStartDate.setMonth(gradeStartDate.getMonth() + Math.round(decimalPart * 12));
    }

    // Filter courses: Only count courses taken AFTER the grade start date
    const coursesInCurrentGrade = courses.filter(c => {
      if (!c.course_date) return false;
      return new Date(c.course_date) >= gradeStartDate;
    });

    const required = gradeInfo.coursesRequired
    const current = countWeightedCourses(coursesInCurrentGrade, settings.course_settings?.two_week_weight || 2)
    const deficit = Math.max(required - current, 0)

    return { deficit, required, current, grade: gradeInfo.grade, startDate: gradeStartDate }
  }

  const courseStatus = getCourseStatus()

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      {/* Unified Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
              <GraduationCap className="fill-current/20" size={32} />
              سجل الدورات التدريبية
            </h1>
            <p className="text-sky-100 font-medium opacity-90">تتبع مسارك المهني والدورات المنجزة</p>
          </div>

          {employee && (
            <div className={`bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center min-w-[160px]`}>
              <span className="text-xs font-bold block mb-1 opacity-80 uppercase">حالة المتطلبات</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${courseStatus.deficit > 0 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <span className="text-sm font-black italic">
                  {courseStatus.deficit > 0 ? (
                    `نقص ${courseStatus.deficit} من أصل ${courseStatus.required}`
                  ) : (
                    `مستوفي (${courseStatus.required} دورات)`
                  )}
                </span>
                <span className="text-[10px] block mt-1 opacity-70">
                  (محسوب منذ: {courseStatus.startDate?.toLocaleDateString('en-GB')})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Decorations */}
        <GraduationCap className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <CheckCircle className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-slate-800 p-12 rounded-2xl text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-white">لا توجد دورات مسجلة</h3>
            <p className="text-slate-400 dark:text-slate-500">سجل المشاركات في الدورات التدريبية فارغ حالياً.</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <div className="flex items-start gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-3 rounded-lg">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">{course.course_name}</h3>
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Calendar size={14} className="text-sky-500" />
                        <span>التاريخ: {formatDate(course.course_date)}</span>
                      </p>
                      {course.duration && (
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                          <Clock size={14} />
                          <span>المدة: {course.duration}</span>
                        </p>
                      )}
                      {course.location && (
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                          <MapPin size={14} />
                          <span>المكان: {course.location}</span>
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
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
