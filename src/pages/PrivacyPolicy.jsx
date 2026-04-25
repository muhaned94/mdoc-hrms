import { Shield, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border p-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors"
        >
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Shield className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">سياسة الخصوصية</h1>
        </div>

        <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. مقدمة</h2>
            <p>
              نحن في شركة نفط الوسط (Midland Oil Company) نلتزم بحماية خصوصية بيانات موظفينا. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية المعلومات في تطبيق MDOC HRMS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. البيانات التي نجمعها</h2>
            <p>يقوم التطبيق بمعالجة البيانات التالية لغرض إدارة الموارد البشرية فقط:</p>
            <ul className="list-disc list-inside mt-2 mr-4 space-y-2">
              <li>المعلومات الشخصية (الاسم، رقم الموظف).</li>
              <li>بيانات الرواتب والمخصصات.</li>
              <li>الأوامر الإدارية والمستندات الرسمية.</li>
              <li>بيانات تسجيل الدخول (رقم الشركة وكلمة المرور).</li>
              <li>الوصول إلى الكاميرا (لمسح رموز QR الخاصة بالموظفين فقط).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. استخدام البيانات</h2>
            <p>يتم استخدام البيانات حصراً للأغراض التالية:</p>
            <ul className="list-disc list-inside mt-2 mr-4 space-y-2">
              <li>تمكين الموظف من عرض كشوفات الراتب والوثائق الخاصة به.</li>
              <li>تسهيل التواصل بين الإدارة والموظفين.</li>
              <li>إدارة الدورات التدريبية والترقيات.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. حماية البيانات</h2>
            <p>
              نحن نطبق إجراءات أمنية تقنية وتنظيمية لحماية بياناتكم من الوصول غير المصرح به. جميع البيانات تُخزن في خوادم مؤمنة (Supabase) ويتم الوصول إليها عبر قنوات مشفرة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. حقوق المستخدم</h2>
            <p>
              يحق للموظف الوصول إلى بياناته وتصحيحها عبر مراجعة قسم الموارد البشرية في الشركة. لا يتم مشاركة أي بيانات مع أطراف ثالثة خارج المؤسسة.
            </p>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-slate-400">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
