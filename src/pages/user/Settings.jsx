import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Camera, Lock, Save, Loader, Settings as SettingsIcon, ShieldCheck, Moon, Sun } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { APP_VERSION } from '../../config'

export default function Settings() {
  const { session, signOut, loading: authLoading } = useAuth()
  const { settings, effectiveTheme, setUserTheme } = useSettings()
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
      const fileName = `${targetId}/${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      const { error: updateError } = await supabase.rpc('update_employee_settings', {
          p_employee_id: targetId,
          p_avatar_url: publicUrl
        })

      if (updateError) throw updateError
      setEmployee(prev => ({ ...prev, avatar_url: publicUrl }))
      alert('تم تحديث الصورة بنجاح')
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
      const { error } = await supabase.rpc('update_employee_settings', {
          p_employee_id: employee?.id || userId,
          p_visible_password: newPassword
        })
      if (error) throw error
      alert('تم تغيير كلمة المرور بنجاح.')
      await signOut()
      navigate('/login')
    } catch (err) {
      alert('فشل التغيير: ' + err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleThemeToggle = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light'
    setUserTheme(newTheme, userId)
  }

  if (loading || authLoading) return <div className="p-10 text-center">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <SettingsIcon size={32} /> إعدادات الحساب
        </h1>
        <p className="opacity-90">إدارة الصورة الشخصية وكلمة المرور والمظهر</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          {effectiveTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />} المظهر
        </h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <h4 className="font-medium">الوضع الليلي</h4>
          <button onClick={handleThemeToggle} className={`relative w-16 h-8 rounded-full transition-all ${effectiveTheme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-all ${effectiveTheme === 'dark' ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {settings.allow_profile_picture_change && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-6">تغيير الصورة الشخصية</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden">
              {employee?.avatar_url ? <img src={employee.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-200">{employee?.full_name?.charAt(0)}</div>}
            </div>
            <label className="bg-primary text-white p-2 rounded-full cursor-pointer"><Camera size={20} /><input type="file" className="hidden" onChange={handleAvatarUpload} /></label>
          </div>
        </div>
      )}

      {settings.allow_password_change && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-6">تغيير كلمة المرور</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="أدخل كلمة المرور الجديدة" />
            <button type="submit" disabled={changingPassword} className="w-full bg-slate-800 text-white py-3 rounded-lg flex items-center justify-center gap-2">
              {changingPassword ? <Loader className="animate-spin" /> : <Save />} حفظ التغييرات
            </button>
          </form>
        </div>
      )}

      <div className="pt-8 pb-4 text-center">
        <p className="text-[10px] text-slate-300">MDOC HRMS • الإصدار {APP_VERSION}</p>
      </div>
    </div>
  )
}
