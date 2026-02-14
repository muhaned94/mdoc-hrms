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
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)
    const touchRef = useRef({ lastDist: 0, lastX: 0, lastY: 0, isDragging: false })

    const fileType = file?.type || detectFileType(file?.url)

    // Get signed URL when file changes
    useEffect(() => {
        if (!file?.url) return

        setLoading(true)
        setError(null)
        setZoom(1)
        setRotation(0)
        setPosition({ x: 0, y: 0 })

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
            if (e.key === '0') { setZoom(1); setRotation(0); setPosition({ x: 0, y: 0 }) }
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

    // Touch handlers for mobile
    const handleTouchStart = (e) => {
        if (fileType !== 'image') return

        if (e.touches.length === 2) {
            // Pinch start
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )
            touchRef.current.lastDist = dist
            touchRef.current.isDragging = false
        } else if (e.touches.length === 1) {
            // Drag start
            touchRef.current.lastX = e.touches[0].clientX
            touchRef.current.lastY = e.touches[0].clientY
            touchRef.current.isDragging = zoom > 1
        }
    }

    const handleTouchMove = (e) => {
        if (fileType !== 'image') return

        if (e.touches.length === 2) {
            // Pinch move
            e.preventDefault()
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )
            const delta = (dist - touchRef.current.lastDist) * 0.01
            setZoom(z => Math.max(0.5, Math.min(5, z + delta)))
            touchRef.current.lastDist = dist
        } else if (e.touches.length === 1 && touchRef.current.isDragging) {
            // Drag move
            e.preventDefault()
            const deltaX = e.touches[0].clientX - touchRef.current.lastX
            const deltaY = e.touches[0].clientY - touchRef.current.lastY

            setPosition(pos => ({
                x: pos.x + deltaX,
                y: pos.y + deltaY
            }))

            touchRef.current.lastX = e.touches[0].clientX
            touchRef.current.lastY = e.touches[0].clientY
        }
    }

    const handleTouchEnd = () => {
        touchRef.current.isDragging = false
    }

    // Mouse Dragging (Support for desktop too)
    const [isMouseDown, setIsMouseDown] = useState(false)
    const handleMouseDown = (e) => {
        if (zoom <= 1) return
        setIsMouseDown(true)
        touchRef.current.lastX = e.clientX
        touchRef.current.lastY = e.clientY
    }

    const handleMouseMove = (e) => {
        if (!isMouseDown) return
        const deltaX = e.clientX - touchRef.current.lastX
        const deltaY = e.clientY - touchRef.current.lastY
        setPosition(pos => ({
            x: pos.x + deltaX,
            y: pos.y + deltaY
        }))
        touchRef.current.lastX = e.clientX
        touchRef.current.lastY = e.clientY
    }

    const handleMouseUp = () => setIsMouseDown(false)

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
        setPosition({ x: 0, y: 0 })
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
                    className={`flex-1 bg-slate-950 flex items-center justify-center relative ${fileType === 'pdf' ? 'overflow-auto' : 'overflow-hidden'}`}
                    onContextMenu={handleContextMenu}
                    onTouchStart={fileType === 'image' ? handleTouchStart : undefined}
                    onTouchMove={fileType === 'image' ? handleTouchMove : undefined}
                    onTouchEnd={fileType === 'image' ? handleTouchEnd : undefined}
                    onMouseDown={fileType === 'image' ? handleMouseDown : undefined}
                    onMouseMove={fileType === 'image' ? handleMouseMove : undefined}
                    onMouseUp={fileType === 'image' ? handleMouseUp : undefined}
                    onMouseLeave={fileType === 'image' ? handleMouseUp : undefined}
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
                            className="relative select-none w-full h-full flex items-center justify-center transition-none"
                            onDragStart={(e) => e.preventDefault()}
                        >
                            <img
                                src={signedUrl}
                                alt={file.title || 'Image'}
                                className={`object-contain transition-none ${zoom > 1 ? 'cursor-grabbing' : 'cursor-grab'}`}
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center center',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    touchAction: 'none'
                                }}
                                draggable="false"
                                onContextMenu={handleContextMenu}
                                onError={(e) => {
                                    if (fileType === 'unknown') {
                                        e.target.style.display = 'none'
                                    }
                                }}
                            />
                        </div>
                    )}

                    {!loading && !error && signedUrl && fileType === 'pdf' && (
                        <iframe
                            src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-full h-full border-0"
                            title={file.title || 'PDF Viewer'}
                            onContextMenu={handleContextMenu}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
