import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, Calendar, ExternalLink, Download } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Circulars() {
    const [circulars, setCirculars] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCirculars()
        // Update last check time
        localStorage.setItem('last_circulars_check', new Date().toISOString())
    }, [])

    const fetchCirculars = async () => {
        try {
            const { data, error } = await supabase
                .from('circulars')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setCirculars(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>

    return (
        <div className="space-y-8">
            {/* Unified Gradient Header */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-right">
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
                            <FileText className="fill-current/20" size={32} />
                            التعاميم والكتب الرسمية
                        </h1>
                        <p className="text-sky-100 font-medium opacity-90">الأوامر الإدارية والتعميمات الصادرة من الإدارة</p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center">
                        <span className="text-sm block mb-1">عدد التعاميم</span>
                        <span className="text-4xl font-black">{circulars.length}</span>
                    </div>
                </div>

                {/* Decorations */}
                <FileText className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
                <Calendar className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
            </div>

            <div className="space-y-4">
                {circulars.length === 0 ? (
                    <div className="p-12 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <FileText size={40} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-lg">لا توجد تعاميم</h3>
                        <p className="text-slate-400">لم يتم نشر أي كتب رسمية حتى الآن</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {circulars.map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl h-fit">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={item.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-slate-50 text-slate-600 hover:bg-primary hover:text-white p-2.5 rounded-xl transition-all flex items-center gap-2"
                                        title="تحميل / مشاهدة"
                                    >
                                        <span className="text-xs font-bold hidden sm:block">فتح الملف</span>
                                        <ExternalLink size={18} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
