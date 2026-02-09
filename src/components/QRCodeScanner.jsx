
import { useEffect, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, Camera } from 'lucide-react';

export default function QRCodeScanner({ onScan, onClose }) {
    const [error, setError] = useState(null);

    const handleScan = (result) => {
        if (result && result.length > 0) {
            // The scanner can return an array of results, we take the first one
            const rawValue = result[0].rawValue;
            if (onScan) {
                onScan(rawValue);
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
        setError("Failed to access camera. Please ensure permissions are granted.");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Camera size={20} className="text-primary" />
                        Scan Login QR Code
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-4 bg-slate-900 aspect-square relative">
                    {!error ? (
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            components={{
                                tracker: true, // Show the framing box
                                audio: false, // Disable beep sound
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' }
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Overlay Guide */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-8 rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                    </div>
                </div>

                <div className="p-4 text-center text-sm text-slate-500">
                    Point your camera at the employee QR code card to login automatically.
                </div>
            </div>
        </div>
    );
}
