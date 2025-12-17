import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Camera, Lock, Save, User, Loader } from 'lucide-react'

export default function Settings() {
  const { session } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Password State
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const userId = session?.user?.id

  useEffect(() => {
    if (userId) fetchProfile()
  }, [userId])

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('employees')
        .update({ avatar_url: publicUrl })
        .eq('id', targetId)

      if (updateError) {
        throw updateError
      }

      setEmployee(prev => ({ ...prev, avatar_url: publicUrl }))
      alert('تم تحديث الصورة الشخصية بنجاح')
      window.location.reload() // Reload to update other components if needed
    } catch (error) {
      alert(error.message)
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

        const { error } = await supabase
            .from('employees')
            .update({ visible_password: newPassword })
            .eq('id', targetId)

        if (error) throw error
        
        alert('تم تغيير كلمة المرور بنجاح')
        setNewPassword('')
    } catch (err) {
        alert('فشل تغيير كلمة المرور: ' + err.message)
    } finally {
        setChangingPassword(false)
    }
  }

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">الإعدادات</h1>

      {/* Avatar Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800 border-b pb-2">
            <Camera className="text-primary" size={20} />
            تغيير الصورة الشخصية
        </h3>
        
        <div className="flex flex-col items-center gap-4">
             <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 bg-slate-200 overflow-hidden shadow-inner">
                    {employee?.avatar_url ? (
                        <img src={employee.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-4xl">
                            {employee?.full_name?.charAt(0)}
                        </div>
                    )}
                </div>
                 <label className="absolute bottom-0 right-0 bg-primary hover:bg-sky-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
            </div>
            <p className="text-sm text-slate-500">اضغط على الكاميرا لتغيير الصورة</p>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800 border-b pb-2">
            <Lock className="text-amber-500" size={20} />
            تغيير كلمة المرور
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
                <label className="text-sm text-slate-600 mb-1 block font-medium">كلمة المرور الجديدة</label>
                <div className="relative">
                    <input 
                        type="text" 
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border rounded-lg bg-slate-50 font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="أدخل كلمة المرور الجديدة"
                    />
                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                </div>
                <p className="text-xs text-slate-400 mt-1">يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
            </div>
            
            <button 
                type="submit" 
                disabled={changingPassword}
                className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 font-medium"
            >
                {changingPassword ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                <span>حفظ كلمة المرور الجديدة</span>
            </button>
        </form>
      </div>
    </div>
  )
}
