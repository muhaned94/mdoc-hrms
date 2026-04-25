import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import {
    Save,
    RefreshCcw,
    Shield,
    Image as ImageIcon,
    Database,
    LogIn,
    Moon,
    Sun,
    Smartphone,
    KeyRound,
    QrCode,
    Download,
    Upload,
    GraduationCap,
    Clock,
    GitGraph,
    ArrowUpCircle,
    Globe
} from 'lucide-react'
import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { APP_VERSION } from '../../config'

export default function Settings() {
    const { settings, updateSetting, loading, effectiveTheme, setUserTheme } = useSettings()
    const fileInputRef = useRef(null)

    const handleBackup = async () => {
        try {
            const timestamp = new Date().toISOString()
            const { data: employees } = await supabase.from('employees').select('*')
            const { data: announcements } = await supabase.from('announcements').select('*')
            const { data: letters } = await supabase.from('appreciation_letters').select('*')
            const { data: orders } = await supabase.from('admin_orders').select('*')
            const { data: slips } = await supabase.from('salary_slips').select('*')
            const { data: courses } = await supabase.from('courses').select('*')
            const { data: messages } = await supabase.from('messages').select('*')
            const { data: views } = await supabase.from('announcement_views').select('*')
            const { data: circulars } = await supabase.from('circulars').select('*')
            const { data: departments } = await supabase.from('departments').select('*')
            const { data: reports } = await supabase.from('reports').select('*')
            const { data: notifications } = await supabase.from('notifications').select('*')
            const { data: activityLogs } = await supabase.from('user_activity_logs').select('*')
            const { data: systemSettings } = await supabase.from('system_settings').select('*')

            const tables = {
                system_settings: systemSettings || [],
                employees: (employees || []).map(({ governorate, city, mahalla, zgaq, dar, ...rest }) => rest),
                departments: departments || [],
                announcements: announcements || [],
                appreciation_letters: letters || [],
                admin_orders: orders || [],
                salary_slips: slips || [],
                courses: courses || [],
                messages: messages || [],
                announcement_views: views || [],
                circulars: circulars || [],
                reports: reports || [],
                notifications: notifications || [],
                user_activity_logs: activityLogs || []
            }

            const stats = {}
            let totalRecords = 0
            for (const [name, data] of Object.entries(tables)) {
                stats[name] = data.length
                totalRecords += data.length
            }

            const backupData = {
                version: '2.0',
                timestamp,
                totalRecords,
                tableCount: Object.keys(tables).length,
                stats,
                tables
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `MDOC_Full_Backup_${timestamp.slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            alert(`تم تحميل النسخة الاحتياطية بنجاح ✅`)
        } catch (err) {
            console.error("Backup failed:", err)
            alert('حدث خطأ أثناء النسخ الاحتياطي: ' + err.message)
        }
    }

    const handleRestore = async (event) => {
        const file = event.target.files[0]
        if (!file) return
        if (!window.confirm('⚠️ تحذير: هذه العملية ستقوم باستبدال البيانات الحالية. هل أنت متأكد؟')) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target.result)
                const restoreTable = async (table, data) => {
                    if (data?.length > 0) {
                        const { error } = await supabase.from(table).upsert(data)
                        if (error) throw new Error(`فشل استعادة جدول ${table}: ${error.message}`)
                    }
                }
                await restoreTable('system_settings', backup.tables.system_settings)
                await restoreTable('employees', backup.tables.employees)
                await restoreTable('departments', backup.tables.departments)
                await restoreTable('announcements', backup.tables.announcements)
                await restoreTable('appreciation_letters', backup.tables.appreciation_letters)
                await restoreTable('admin_orders', backup.tables.admin_orders)
                await restoreTable('salary_slips', backup.tables.salary_slips)
                await restoreTable('courses', backup.tables.courses)
                await restoreTable('messages', backup.tables.messages)
                await restoreTable('announcement_views', backup.tables.announcement_views)
                await restoreTable('circulars', backup.tables.circulars)
                await restoreTable('reports', backup.tables.reports)
                await restoreTable('notifications', backup.tables.notifications)
                await restoreTable('user_activity_logs', backup.tables.user_activity_logs)
                alert(`تم استعادة النظام بنجاح! 🎉`)
                window.location.reload()
            } catch (err) {
                console.error("Restore failed:", err)
                alert('فشلت عملية الاستعادة: ' + err.message)
            }
        }
        reader.readAsText(file)
    }

    if (loading) return <div className="p-8 text-center">جاري تحميل الإعدادات...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">إعدادات النظام</h1>
            </div>

            <div className="grid gap-6">
                {/* Theme Settings */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Sun size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">المظهر العام</h2>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                        <div>
                            <h3 className="font-medium text-slate-800 dark:text-slate-200">الوضع الليلي</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تغيير مظهر التطبيق بين الفاتح والداكن</p>
                        </div>
                        <button
                            onClick={() => {
                                const newTheme = effectiveTheme === 'light' ? 'dark' : 'light'
                                setUserTheme(newTheme, null)
                            }}
                            dir="ltr"
                            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${effectiveTheme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center ${effectiveTheme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
                                {effectiveTheme === 'dark' ? <Moon size={12} className="text-blue-600" /> : <Sun size={12} className="text-slate-400" />}
                            </div>
                        </button>
                    </div>
                </div>

                {/* User Permissions */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Shield size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">صلاحيات الموظفين</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                            <div>
                                <h3 className="font-medium text-slate-800 dark:text-slate-200">تغيير كلمة المرور</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">السماح للموظفين بتغيير كلمات المرور</p>
                            </div>
                            <ToggleSwitch value={settings.allow_password_change} onChange={(val) => updateSetting('allow_password_change', val)} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                            <div>
                                <h3 className="font-medium text-slate-800 dark:text-slate-200">تغيير الصورة الشخصية</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">السماح للموظفين بتحديث صورهم</p>
                            </div>
                            <ToggleSwitch value={settings.allow_profile_picture_change} onChange={(val) => updateSetting('allow_profile_picture_change', val)} />
                        </div>
                    </div>
                </div>

                {/* Course Requirements */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <GraduationCap size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">إعدادات الدورات</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-2 p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl space-y-6">
                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Clock size={16} className="text-amber-500" />
                                احتساب مدة الدورة
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl">
                                    <label className="text-xs font-bold text-slate-500">دورة "الأسبوعين" تعادل</label>
                                    <input
                                        type="number"
                                        className="w-16 p-2 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white text-center"
                                        value={settings.course_settings?.two_week_weight || 2}
                                        onChange={(e) => updateSetting('course_settings', { ...settings.course_settings, two_week_weight: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-3 p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl space-y-4">
                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <GitGraph size={16} className="text-primary" />
                                الدورات المطلوبة للترقية
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[8, 7, 6, 5, 4, 3, 2, 1].map(grade => (
                                    <div key={grade} className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl">
                                        <label className="text-[10px] font-black text-slate-400 text-center">الدرجة {grade}</label>
                                        <input
                                            type="number"
                                            className="w-full p-1 rounded-md bg-slate-50 dark:bg-slate-700 dark:text-white text-center"
                                            value={settings.course_settings?.[`grade_${grade}`] || (grade === 8 ? 1 : 2)}
                                            onChange={(e) => updateSetting('course_settings', { ...settings.course_settings, [`grade_${grade}`]: parseInt(e.target.value) })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Method */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <LogIn size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">طريقة تسجيل الدخول</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <LoginMethodCard
                            active={settings.login_method === 'password'}
                            onClick={() => updateSetting('login_method', 'password')}
                            icon={KeyRound}
                            title="كلمة المرور فقط"
                            description="رقم الشركة وكلمة المرور"
                        />
                        <LoginMethodCard
                            active={settings.login_method === 'qr'}
                            onClick={() => updateSetting('login_method', 'qr')}
                            icon={QrCode}
                            title="QR Code فقط"
                            description="مسح البطاقة الوظيفية"
                        />
                        <LoginMethodCard
                            active={settings.login_method === 'both'}
                            onClick={() => updateSetting('login_method', 'both')}
                            icon={Smartphone}
                            title="كلاهما"
                            description="إتاحة الخيارين"
                        />
                    </div>
                </div>

                {/* App Updates Control */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                            <ArrowUpCircle size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">تحديثات التطبيق</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">أدنى إصدار مطلوب</label>
                            <input
                                type="text"
                                value={settings.min_version || ''}
                                onChange={(e) => updateSetting('min_version', e.target.value)}
                                placeholder="1.4"
                                className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">رابط التحميل</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={settings.download_url || ''}
                                    onChange={(e) => updateSetting('download_url', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-3 pl-10 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                                <Globe className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Backup */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <Database size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">النسخ الاحتياطي</h2>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div>
                            <h3 className="font-medium text-slate-800 dark:text-slate-200">تحميل نسخة احتياطية</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تنزيل نسخة كاملة من قاعدة البيانات</p>
                        </div>
                        {settings.allow_backup_download ? (
                            <div className="flex flex-col gap-2">
                                <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold" onClick={handleBackup}>
                                    <Download size={16} /> تحميل
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                                <button className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold" onClick={() => fileInputRef.current?.click()}>
                                    <Upload size={16} /> استرجاع
                                </button>
                            </div>
                        ) : (
                             <ToggleSwitch value={settings.allow_backup_download} onChange={(val) => updateSetting('allow_backup_download', val)} />
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-10 pb-4 text-center">
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold tracking-widest uppercase">
                    MDOC HRMS Admin Portal • الإصدار {APP_VERSION}
                </p>
            </div>
        </div>
    )
}

function ToggleSwitch({ value, onChange, onColor = 'bg-blue-500', offColor = 'bg-slate-200' }) {
    return (
        <button onClick={() => onChange(!value)} className={`relative w-14 h-7 rounded-full transition-colors ${value ? onColor : offColor}`}>
            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
    )
}

function LoginMethodCard({ active, onClick, icon: Icon, title, description }) {
    return (
        <button
            onClick={onClick}
            className={`text-right p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${active ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
        >
            <div className={`p-2 rounded-lg w-fit ${active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Icon size={20} />
            </div>
            <div>
                <h3 className={`font-bold ${active ? 'text-primary' : 'text-slate-700'}`}>{title}</h3>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>
        </button>
    )
}
