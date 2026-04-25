import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function OfflineModal() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-25"></div>
          <div className="relative w-full h-full bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner border-4 border-white">
            <WifiOff size={44} />
          </div>
        </div>
        
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">لا يوجد اتصال!</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            يبدو أنك فقدت الاتصال بالشبكة. يرجى التأكد من تفعيل الواي فاي أو بيانات الهاتف للمتابعة.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-slate-50 rounded-2xl text-slate-500 text-sm font-semibold border border-slate-100">
            <div className="w-5 h-5 border-3 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <span>جاري مراقبة الشبكة...</span>
          </div>

          <button
            onClick={handleRetry}
            className="w-full bg-primary hover:bg-sky-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-sky-500/30 active:scale-95"
          >
            <RefreshCw size={20} className="animate-spin-slow" />
            تحديث الصفحة
          </button>
        </div>
        
        <p className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-1">
          <AlertCircle size={12} />
          MDOC HRMS Security System
        </p>
      </div>
    </div>
  );
}
