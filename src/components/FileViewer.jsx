import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, FileText, AlertTriangle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { getSignedUrl, detectFileType } from '../utils/fileUtils'

/**
 * FileViewer - Modal component for viewing images and PDFs inline
 * 
 * Usage:
 *   <FileViewer
 *     file={{ url: 'https://...', title: 'البطاقة الوطنية' }}
 *     onClose={() => setFile(null)}
 *   />
 * 
 * The `file` prop should be { url, title, type? }
 * If type is not provided, it's auto-detected from the URL.
 */
export default function FileViewer({ file, onClose }) {
    const [signedUrl, setSignedUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)

    const fileType = file?.type || detectFileType(file?.url)

    // Get signed URL when file changes
    useEffect(() => {
        if (!file?.url) return

        setLoading(true)
        setError(null)
        setZoom(1)
        setRotation(0)

        getSignedUrl(file.url)
            .then(url => {
                console.log('[FileViewer] Signed URL:', url, 'Type:', fileType)
                if (url) {
                    setSignedUrl(url)
                } else {
                    setError('تعذر تحميل الملف')
                }
            })
            .catch((err) => {
                console.error('[FileViewer] Error:', err)
                setError('تعذر تحميل الملف')
            })
            .finally(() => setLoading(false))
    }, [file?.url])

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleContextMenu = useCallback((e) => {
        e.preventDefault()
        return false
    }, [])

    if (!file) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Content Container */}
            <div
                className="relative z-10 max-w-[95vw] max-h-[95vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Bar */}
                <div className="w-full flex items-center justify-between bg-black/60 backdrop-blur-md px-6 py-3 rounded-t-2xl border-b border-white/10">
                    <h3 className="text-white font-bold text-lg truncate max-w-[60%]" dir="rtl">
                        {file.title || 'عرض الملف'}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* Zoom & Rotate controls (images only) */}
                        {fileType === 'image' && (
                            <>
                                <button
                                    onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="تصغير"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <span className="text-white/50 text-xs font-mono min-w-[3rem] text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="تكبير"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <button
                                    onClick={() => setRotation(r => r + 90)}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="تدوير"
                                >
                                    <RotateCw size={18} />
                                </button>
                                <div className="w-px h-6 bg-white/20 mx-1" />
                            </>
                        )}

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-2 text-white/70 hover:text-white hover:bg-red-500/30 rounded-lg transition-colors"
                            title="إغلاق"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Viewer Area */}
                <div className="bg-slate-900/95 rounded-b-2xl overflow-auto max-h-[85vh] w-full flex items-center justify-center min-w-[50vw] min-h-[50vh]">
                    {loading && (
                        <div className="flex flex-col items-center gap-4 p-20">
                            <Loader2 className="animate-spin text-white/60" size={48} />
                            <p className="text-white/40 text-sm font-medium">جاري تحميل الملف...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-4 p-20 text-center">
                            <AlertTriangle className="text-amber-400" size={48} />
                            <p className="text-white/60 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {!loading && !error && signedUrl && (fileType === 'image' || fileType === 'unknown') && (
                        <div
                            className="relative select-none p-4"
                            onContextMenu={handleContextMenu}
                            onDragStart={(e) => e.preventDefault()}
                        >
                            <img
                                src={signedUrl}
                                alt={file.title || 'Image'}
                                className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center center'
                                }}
                                draggable="false"
                                onContextMenu={handleContextMenu}
                                onError={(e) => {
                                    // If image fails to load and type was unknown, might be a PDF
                                    if (fileType === 'unknown') {
                                        e.target.style.display = 'none'
                                    }
                                }}
                            />
                            {/* Transparent overlay to prevent easy save */}
                            <div
                                className="absolute inset-0"
                                onContextMenu={handleContextMenu}
                                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                            />
                        </div>
                    )}

                    {!loading && !error && signedUrl && fileType === 'pdf' && (
                        <iframe
                            src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-full min-h-[80vh] border-0"
                            style={{ minWidth: '60vw' }}
                            title={file.title || 'PDF Viewer'}
                            onContextMenu={handleContextMenu}
                        />
                    )}


                </div>
            </div>
        </div>
    )
}
