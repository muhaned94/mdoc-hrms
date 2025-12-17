import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Calendar, Clock, CheckCircle } from 'lucide-react'

export default function Courses() {
  const { session } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) fetchCourses()
  }, [session])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('employee_id', session.user.id)
        .order('course_date', { ascending: false })
      
      if (error) throw error
      setCourses(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800">سجل الدورات التدريبية</h1>
      
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
                                    <span>التاريخ: {new Date(course.course_date).toLocaleDateString('ar-EG')}</span>
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
