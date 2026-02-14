import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Loader2, FileText, AlertTriangle, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'
import { getSignedUrl, detectFileType } from '../utils/fileUtils'

/**
 * FileViewer - Full-screen modal for viewing images and PDFs inline
 */
export default function FileViewer({ file, onClose }) {
    const [signedUrl, setSignedUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const containerRef = useRef(null)

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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(5, z + 0.25))
            if (e.key === '-') setZoom(z => Math.max(0.1, z - 0.25))
            if (e.key === '0') { setZoom(1); setRotation(0) }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Mouse wheel zoom
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const delta = e.deltaY > 0 ? -0.15 : 0.15
                setZoom(z => Math.max(0.1, Math.min(5, z + delta)))
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [signedUrl])

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleContextMenu = useCallback((e) => {
        e.preventDefault()
        return false
    }, [])

    const resetView = () => {
        setZoom(1)
        setRotation(0)
    }

    if (!file) return null

    const showZoomControls = fileType === 'image' || fileType === 'unknown'

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

            {/* Content Container - 95% of viewport */}
            <div
                className="relative z-10 w-[95vw] h-[95vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between bg-slate-900/98 px-4 sm:px-6 py-3 border-b border-white/10 shrink-0">
                    <h3 className="text-white font-bold text-base sm:text-lg truncate max-w-[40%]" dir="rtl">
                        {file.title || 'عرض الملف'}
                    </h3>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Zoom & Rotate controls */}
                        {showZoomControls && (
                            <>
                                <button
                                    onClick={() => setZoom(z => Math.max(0.1, z - 0.25))}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="تصغير ( - )"
                                >
                                    <ZoomOut size={18} />
                                </button>

                                <button
                                    onClick={resetView}
                                    className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs font-mono min-w-[3.5rem] text-center"
                                    title="إعادة ضبط (0)"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>

                                <button
                                    onClick={() => setZoom(z => Math.min(5, z + 0.25))}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="تكبير ( + )"
                                >
                                    <ZoomIn size={18} />
                                </button>

                                <button
                                    onClick={() => setRotation(r => r + 90)}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="تدوير"
                                >
                                    <RotateCw size={18} />
                                </button>

                                <button
                                    onClick={resetView}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="إعادة ضبط الحجم"
                                >
                                    <Maximize2 size={18} />
                                </button>

                                <div className="w-px h-6 bg-white/15 mx-1" />
                            </>
                        )}

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-2 text-white/60 hover:text-white hover:bg-red-500/30 rounded-lg transition-colors"
                            title="إغلاق (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Viewer Area - takes remaining height */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center"
                    onContextMenu={handleContextMenu}
                >
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
                            className="relative select-none w-full h-full flex items-center justify-center"
                            onDragStart={(e) => e.preventDefault()}
                        >
                            <img
                                src={signedUrl}
                                alt={file.title || 'Image'}
                                className="object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center center',
                                    maxWidth: zoom <= 1 ? '100%' : 'none',
                                    maxHeight: zoom <= 1 ? '100%' : 'none',
                                }}
                                draggable="false"
                                onContextMenu={handleContextMenu}
                                onError={(e) => {
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
                        <div className="w-full h-full overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                                src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                className="w-full h-full border-0"
                                title={file.title || 'PDF Viewer'}
                                onContextMenu={handleContextMenu}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
