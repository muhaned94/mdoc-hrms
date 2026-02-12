
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
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div id="qr-svg-container" className="bg-white p-2 border rounded-xl shadow-sm">
                <QRCode
                    size={140}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={qrData}
                    viewBox={`0 0 256 256`}
                />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-right">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">تعليمات الدخول الذكي</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        استخدم الرمز لتسجيل الدخول السريع عبر الكاميرا دون كلمة مرور.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <button
                        onClick={handlePrint}
                        type="button"
                        className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-all text-xs font-bold"
                    >
                        <Printer size={16} />
                        طباعة البطاقة
                    </button>
                    {/* Hidden container for print clone */}
                    <div id="printable-qr-card" className="hidden"></div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 text-[10px] p-2 rounded-lg border border-amber-100/50 dark:border-amber-900/20">
                    <span className="font-bold">تنبيه:</span> يحمل الرمز كلمة المرور الخاصة بك.
                </div>
            </div>
        </div>
    );
}
