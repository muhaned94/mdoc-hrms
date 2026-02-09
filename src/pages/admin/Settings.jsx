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
    Upload
} from 'lucide-react'
import { useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function Settings() {
    const { settings, updateSetting, loading } = useSettings()
    const fileInputRef = useRef(null)

    const handleBackup = async () => {
        try {
            const timestamp = new Date().toISOString()
            // Fetch ALL Data
            const { data: employees } = await supabase.from('employees').select('*')
            const { data: announcements } = await supabase.from('announcements').select('*')
            const { data: letters } = await supabase.from('appreciation_letters').select('*')
            const { data: orders } = await supabase.from('admin_orders').select('*')
            const { data: slips } = await supabase.from('salary_slips').select('*')
            const { data: courses } = await supabase.from('courses').select('*')
            const { data: messages } = await supabase.from('messages').select('*')
            const { data: views } = await supabase.from('announcement_views').select('*')

            const backupData = {
                version: '1.2',
                timestamp,
                tables: {
                    employees: (employees || []).map(({ governorate, city, mahalla, zgaq, dar, ...rest }) => rest),
                    announcements: announcements || [],
                    appreciation_letters: letters || [],
                    admin_orders: orders || [],
                    salary_slips: slips || [],
                    courses: courses || [],
                    messages: messages || [],
                    announcement_views: views || []
                }
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
            alert('تم تحميل النسخة الاحتياطية للنظام بالكامل (بيانات وملفات) ✅')
        } catch (err) {
            console.error("Backup failed:", err)
            alert('حدث خطأ أثناء النسخ الاحتياطي: ' + err.message)
        }
    }

    const handleRestore = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        if (!window.confirm('⚠️ تحذير: هذه العملية ستقوم باستبدال/تحديث البيانات الحالية بالبيانات الموجودة في ملف النسخة الاحتياطية.\nهل أنت متأكد من المتابعة؟')) {
            return
        }

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target.result)
                if (!backup.tables) throw new Error('ملف غير صالح')

                const restoreTable = async (table, data) => {
                    if (data?.length > 0) {
                        const { error } = await supabase.from(table).upsert(data)
                        if (error) throw error
                    }
                }

                await restoreTable('employees', backup.tables.employees)
                await restoreTable('announcements', backup.tables.announcements)
                await restoreTable('appreciation_letters', backup.tables.appreciation_letters)
                await restoreTable('admin_orders', backup.tables.admin_orders)
                await restoreTable('salary_slips', backup.tables.salary_slips)
                await restoreTable('courses', backup.tables.courses)
                await restoreTable('messages', backup.tables.messages)
                await restoreTable('announcement_views', backup.tables.announcement_views)

                alert('تم استعادة النظام بنجاح! 🎉\nسيتم تحديث الصفحة الآن.')
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
                            onClick={() => updateSetting('theme', settings.theme === 'light' ? 'dark' : 'light')}
                            className={`
                relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out
                ${settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}
              `}
                        >
                            <div
                                className={`
                  absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center
                  ${settings.theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}
                `}
                            >
                                {settings.theme === 'dark' ? <Moon size={12} className="text-blue-600" /> : <Sun size={12} className="text-slate-400" />}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">السماح للموظفين بتغيير كلمات المرور الخاصة بهم</p>
                            </div>
                            <ToggleSwitch
                                value={settings.allow_password_change}
                                onChange={(val) => updateSetting('allow_password_change', val)}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                            <div>
                                <h3 className="font-medium text-slate-800 dark:text-slate-200">تغيير الصورة الشخصية</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">السماح للموظفين بتحديث صورهم الشخصية</p>
                            </div>
                            <ToggleSwitch
                                value={settings.allow_profile_picture_change}
                                onChange={(val) => updateSetting('allow_profile_picture_change', val)}
                            />
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
                            description="الدخول باستخدام رقم الشركة وكلمة المرور التقليدية"
                        />
                        <LoginMethodCard
                            active={settings.login_method === 'qr'}
                            onClick={() => updateSetting('login_method', 'qr')}
                            icon={QrCode}
                            title="QR Code فقط"
                            description="الدخول حصرياً عن طريق مسح البطاقة الوظيفية"
                        />
                        <LoginMethodCard
                            active={settings.login_method === 'both'}
                            onClick={() => updateSetting('login_method', 'both')}
                            icon={Smartphone}
                            title="كلاهما"
                            description="إتاحة الخيارين للموظف عند تسجيل الدخول"
                        />
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

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                        <div>
                            <h3 className="font-medium text-slate-800 dark:text-slate-200">تحميل نسخة احتياطية</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تنزيل نسخة كاملة من قاعدة البيانات</p>
                        </div>

                        {settings.allow_backup_download ? (
                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                                <button
                                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                                    onClick={handleBackup}
                                >
                                    <Download size={16} />
                                    تحميل النسخة
                                </button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleRestore}
                                    accept=".json"
                                    className="hidden"
                                />
                                <button
                                    className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors border border-slate-600"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={16} />
                                    استرجاع
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 dark:text-slate-500">الخاصية معطلة</span>
                                <ToggleSwitch
                                    value={settings.allow_backup_download}
                                    onChange={(val) => updateSetting('allow_backup_download', val)}
                                    offColor="bg-slate-200 dark:bg-slate-600"
                                    onColor="bg-orange-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ToggleSwitch({ value, onChange, onColor = 'bg-blue-500', offColor = 'bg-red-500' }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`
        relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out
        ${value ? onColor : offColor}
      `}
        >
            <div
                className={`
          absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
          ${value ? 'translate-x-7' : 'translate-x-0'}
        `}
            />
        </button>
    )
}

function LoginMethodCard({ active, onClick, icon: Icon, title, description }) {
    return (
        <button
            onClick={onClick}
            className={`
        text-right p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-3
        ${active
                    ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-md shadow-primary/10'
                    : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }
      `}
        >
            <div className={`p-2 rounded-lg w-fit ${active ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                <Icon size={20} />
            </div>
            <div>
                <h3 className={`font-bold ${active ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
            </div>
        </button>
    )
}
