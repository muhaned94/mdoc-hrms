import { Download, AlertCircle, Rocket, ShieldCheck } from 'lucide-react'
import { APP_VERSION } from '../../config'

export default function UpdateModal({ settings }) {
  if (!settings?.min_version || !settings?.download_url) return null

  // Check if current version is lower than minimum version
  // Simple version comparison (e.g. "1.3" < "1.4")
  const isOutdated = parseFloat(APP_VERSION) < parseFloat(settings.min_version)

  if (!isOutdated) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-white/20">
        
        {/* Animated Header */}
        <div className="bg-gradient-to-br from-primary via-sky-600 to-indigo-700 p-10 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Rocket size={40} />
             </div>
             <h2 className="text-2xl font-black mb-1">يتوفر تحديث جديد!</h2>
             <p className="text-sky-100 text-sm font-medium opacity-90">الإصدار {settings.min_version} متوفر الآن</p>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
        </div>

        {/* Content */}
        <div className="p-8">
           <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                 <AlertCircle className="text-amber-500 shrink-0" size={24} />
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">تحديث ضروري</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                       نسختك الحالية ({APP_VERSION}) قديمة جداً. يرجى تحديث التطبيق للاستمرار في استخدامه والحصول على الميزات الجديدة.
                    </p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                 <ShieldCheck className="text-sky-500 shrink-0" size={24} />
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">أمان واستقرار</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                       يحتوي هذا التحديث على إصلاحات أمنية هامة وتحسينات في أداء البصمة وعارض الملفات.
                    </p>
                 </div>
              </div>
           </div>

           <a 
              href={settings.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform active:scale-95 group"
           >
              <Download size={24} className="group-hover:animate-bounce" />
              تحديث الآن
           </a>

           <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-6 tracking-widest uppercase">
              MIDLAND OIL COMPANY • MDOC HRMS
           </p>
        </div>
      </div>
    </div>
  )
}
