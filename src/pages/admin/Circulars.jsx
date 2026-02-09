import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { FileText, Trash2, Upload, AlertCircle, Calendar, ExternalLink, Loader2 } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

export default function Circulars() {
    const { user } = useAuth()
    const [circulars, setCirculars] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [newCircular, setNewCircular] = useState({ title: '' })
    const [file, setFile] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchCirculars()
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
            setError('فشل تحميل التعاميم')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                alert('حجم الملف كبير جداً. يجب أن يكون أقل من 5 ميجابايت')
                return
            }
            setFile(selectedFile)
        }
    }

    const handleValidUpload = async (e) => {
        e.preventDefault()
        if (!newCircular.title || !file) {
            alert('يرجى إدخال العنوان واختيار ملف')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('circulars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('circulars')
                .getPublicUrl(filePath)

            // 3. Insert record into DB
            const { error: dbError } = await supabase
                .from('circulars')
                .insert([{
                    title: newCircular.title,
                    file_url: publicUrl,
                    file_path: filePath
                }])

            if (dbError) throw dbError

            // Reset form
            setNewCircular({ title: '' })
            setFile(null)
            // Reset file input manually if needed, or rely on state
            document.getElementById('file-upload').value = ''

            fetchCirculars()

        } catch (err) {
            console.error(err)
            setError('فشل رفع التعميم: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id, filePath) => {
        if (!confirm('هل أنت متأكد من حذف هذا التعميم؟')) return

        try {
            // 1. Delete from Storage (if path exists)
            if (filePath) {
                const { error: storageError } = await supabase.storage
                    .from('circulars')
                    .remove([filePath])

                if (storageError) console.error('Error deleting file:', storageError)
            }

            // 2. Delete from DB
            const { error } = await supabase
                .from('circulars')
                .delete()
                .eq('id', id)

            if (error) throw error

            setCirculars(circulars.filter(c => c.id !== id))
        } catch (err) {
            alert('فشل عملية الحذف')
            console.error(err)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="text-primary" />
                    منصة التعاميم والكتب الرسمية
                </h1>
                <p className="text-slate-500 dark:text-slate-400">رفع وإدارة الكتب الرسمية وتعميمها على الموظفين</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Upload Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-white">رفع تعميم جديد</h3>
                <form onSubmit={handleValidUpload} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">عنوان التعميم / الكتاب</label>
                            <input
                                required
                                type="text"
                                placeholder="مثال: أمر إداري بخصوص العطل الرسمية"
                                value={newCircular.title}
                                onChange={e => setNewCircular({ ...newCircular, title: e.target.value })}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ملف التعميم (PDF أو صورة)</label>
                            <div className="relative">
                                <input
                                    required
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500 dark:text-slate-400
                                file:mr-4 file:py-3 file:px-4
                                file:rounded-xl file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary/5 dark:file:bg-primary/20 file:text-primary
                                hover:file:bg-primary/10 dark:hover:file:bg-primary/30
                                cursor-pointer border border-slate-200 dark:border-slate-600 rounded-xl
                                dark:bg-slate-700
                            "
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">الحد الأقصى 5 ميجابايت (PDF, JPG, PNG)</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="bg-primary hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>جاري الرفع...</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    <span>نشر التعميم</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">الأرشيف</h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {circulars.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p>لا توجد تعاميم منشورة حالياً</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-700">
                            {circulars.map(item => (
                                <div key={item.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={item.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
                                            title="مشاهدة"
                                        >
                                            <span className="text-sm font-medium hidden md:block">مشاهدة</span>
                                            <ExternalLink size={20} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(item.id, item.file_path)}
                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
