
import React, { useRef } from "react";
import QRCode from "react-qr-code";
import { Printer, Download } from "lucide-react";

export default function UserQRCode({ employee }) {
    const qrRef = useRef();

    // Create the payload for the QR code
    // We include company_id and password (if available via visible_password)
    // note: visible_password is the field where we store the raw password for reference (in this simple auth model)
    const qrData = JSON.stringify({
        companyId: employee.company_id,
        password: employee.visible_password || employee.password // Fallback if visible_password not set
    });

    const handlePrint = () => {
        const printContent = document.getElementById("printable-qr-card");
        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (!printWindow) {
            alert("Please allow popups to print");
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>بطاقة موظف - ${employee.full_name}</title>
          <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                background: #f0f0f0; 
            }
            .card {
                width: 350px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
                margin-bottom: 20px;
            }
            .logo {
                width: 60px;
                height: 60px;
                background: #0ea5e9;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 10px;
                font-size: 24px;
                font-weight: bold;
            }
            .name {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin: 0;
            }
            .role {
                color: #666;
                font-size: 14px;
                margin-top: 4px;
            }
            .qr-container {
                margin: 20px 0;
                display: flex;
                justify-content: center;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #888;
                border-top: 1px solid #eee;
                padding-top: 10px;
            }
            @media print {
                body { background: white; height: auto; }
                .card { box-shadow: none; border: 1px solid #000; }
                .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
                <div class="logo">M</div>
                <h2 class="name">${employee.full_name}</h2>
                <div class="role">${employee.job_title || 'موظف'}</div>
            </div>
            
            <div class="qr-container">
               ${document.getElementById('qr-svg-container').innerHTML}
            </div>

            <div>
                <p style="margin: 5px 0; font-weight: bold;">${employee.company_id}</p>
            </div>

            <div class="footer">
                مسح هذا الرمز لتسجيل الدخول السريع
                <br>
                MDOC HRMS
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" /></svg>
                بطاقة الدخول الذكية (QR)
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
                <div id="qr-svg-container" className="bg-white p-2 border rounded-lg">
                    <QRCode
                        size={150}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={qrData}
                        viewBox={`0 0 256 256`}
                    />
                </div>

                <div className="flex-1 space-y-4 text-center md:text-right">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">تعليمات:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            يمكن للموظف استخدام هذا الرمز لتسجيل الدخول السريع عبر الكاميرا دون الحاجة لكتابة كلمة المرور.
                            يرجى طباعة البطاقة وتسليمها للموظف.
                        </p>
                    </div>

                    <div className="flex gap-2 justify-center md:justify-start">
                        <button
                            onClick={handlePrint}
                            type="button"
                            className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
                        >
                            <Printer size={18} />
                            طباعة البطاقة
                        </button>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs p-3 rounded border border-amber-100 dark:border-amber-900/30 mt-2">
                        <span className="font-bold">تنبيه أمني:</span> يحتوي هذا الرمز على كلمة المرور. يرجى الحفاظ عليه في مكان آمن.
                    </div>
                </div>
            </div>

            {/* Hidden container for print clone if needed, though we engage directly with string injection above */}
            <div id="printable-qr-card" className="hidden">
                {/* Helper for extraction if needed */}
            </div>
        </div>
    );
}
