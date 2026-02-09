import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Camera, Lock, Save, User, Loader, Settings as SettingsIcon, ShieldCheck } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'

export default function Settings() {
  const { session, signOut, loading: authLoading } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Password State
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const userId = session?.user?.id

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      setLoading(false)
      return
    }
    fetchProfile()
  }, [userId, authLoading])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setEmployee(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const targetId = employee?.id || userId
      if (!targetId) throw new Error('User ID is missing')

      const fileName = `${targetId}/${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to Storage (Buckets must be public or allowed for anon)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // 2. Update DB via RPC (Bypasses RLS)
      const { error: updateError } = await supabase
        .rpc('update_employee_settings', {
          p_employee_id: targetId,
          p_avatar_url: publicUrl
        })

      if (updateError) throw updateError

      setEmployee(prev => ({ ...prev, avatar_url: publicUrl }))
      alert('تم تحديث الصورة الشخصية بنجاح')
    } catch (error) {
      alert('فشل تحديث الصورة: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setChangingPassword(true)
    try {
      const targetId = employee?.id || userId
      if (!targetId) throw new Error('User ID missing')

      // Update via RPC
      const { error } = await supabase
        .rpc('update_employee_settings', {
          p_employee_id: targetId,
          p_visible_password: newPassword
        })

      if (error) throw error

      alert('تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.')
      await signOut() // Force logout
      navigate('/login')
      setNewPassword('')
    } catch (err) {
      alert('فشل تغيير كلمة المرور: ' + err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading || authLoading) return <div className="p-10 text-center text-slate-500">جاري التحميل...</div>

  if (!employee) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
        عذراً، لم يتم العثور على بيانات الموظف. يرجى تسجيل الدخول مجدداً.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Unified Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
              <SettingsIcon className="fill-current/20" size={32} />
              إعدادات الحساب
            </h1>
            <p className="text-sky-100 font-medium opacity-90">إدارة الصورة الشخصية وكلمة المرور</p>
          </div>
        </div>

        {/* Decorations */}
        <SettingsIcon className="absolute -bottom-6 -left-6 text-white/10 w-48 h-48 rotate-12" />
        <ShieldCheck className="absolute -top-6 -right-6 text-white/10 w-32 h-32 -rotate-12" />
      </div>

      {/* Avatar Section */}
      {settings.allow_profile_picture_change && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">
            <Camera className="text-primary" size={20} />
            تغيير الصورة الشخصية
          </h3>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
                {employee?.avatar_url ? (
                  <img src={employee.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-4xl">
                    {employee?.full_name?.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary hover:bg-sky-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">اضغط على الكاميرا لتغيير الصورة</p>
          </div>
        </div>
      )}

      {/* Password Section */}
      {settings.allow_password_change && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">
            <Lock className="text-amber-500" size={20} />
            تغيير كلمة المرور
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block font-medium">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="أدخل كلمة المرور الجديدة"
                />
                <Lock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {changingPassword ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
              <span>حفظ كلمة المرور الجديدة</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
