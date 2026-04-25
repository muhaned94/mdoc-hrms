import { Download, Rocket, AlertCircle, X } from 'lucide-react'
import { APP_VERSION, UPDATE_URL } from '../../config'

export default function UpdateDialog({ latestVersion, minVersion, onClose }) {
  const isMandatory = APP_VERSION < minVersion
  const hasUpdate = APP_VERSION < latestVersion

  if (!hasUpdate) return null

  const handleUpdate = () => {
    window.open(UPDATE_URL, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with Animation */}
        <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 text-white text-center relative overflow-hidden">
          <Rocket className="mx-auto mb-4 animate-bounce" size={48} />
          <h2 className="text-2xl font-black mb-1">تحديث جديد متوفر!</h2>
          <p className="text-white/80 text-sm font-medium">إصدار {latestVersion} متاح الآن</p>
          
          {/* Decorative Circles */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="p-8 text-center" dir="rtl">
          <div className="flex items-center justify-center gap-2 text-amber-500 mb-4">
            <AlertCircle size={20} />
            <span className="font-bold text-sm">
              {isMandatory ? 'هذا التحديث إلزامي للاستمرار' : 'نوصي بالتحديث للحصول على أفضل تجربة'}
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            قمنا بإضافة ميزات جديدة وتحسينات أمنية مهمة لضمان استقرار التطبيق وحماية بياناتك.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpdate}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Download size={20} />
              تحديث الآن
            </button>

            {!isMandatory && (
              <button
                onClick={onClose}
                className="w-full py-3 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                تذكيري لاحقاً
              </button>
            )}
          </div>
        </div>

        {/* Mandatory Lock Indicator */}
        {isMandatory && (
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
              تم قفل الإصدار الحالي لدواعي أمنية
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
