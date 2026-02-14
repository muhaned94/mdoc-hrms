import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Loader2, FileText, AlertTriangle, ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getSignedUrl, detectFileType } from '../utils/fileUtils'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

/**
 * FileViewer - Full-screen modal for viewing images and PDFs inline
 */
export default function FileViewer({ file, onClose }) {
    const [signedUrl, setSignedUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [numPages, setNumPages] = useState(null)
    const containerRef = useRef(null)

    const fileType = file?.type || detectFileType(file?.url)

    // Get signed URL and fetch file data when file changes
    useEffect(() => {
        if (!file?.url) return

        let active = true
        let objectUrl = null

        setLoading(true)
        setError(null)
        setZoom(1)
        setRotation(0)
        setNumPages(null)

        const loadFile = async () => {
            try {
                // 1. Get Signed URL
                const url = await getSignedUrl(file.url)
                if (!url) throw new Error('تعذر إنشاء رابط للملف')

                console.log('[FileViewer] Signed URL:', url)

                // 2. If it's an image, just set the URL and we're done (rendering <img src> is usually fine)
                if (fileType === 'image' || fileType === 'unknown') {
                    if (active) {
                        setSignedUrl(url)
                        setLoading(false)
                    }
                    return
                }

                // 3. For PDFs, fetch as Blob to bypass IDM/AdBlockers
                // using XHR instead of fetch, as IDM extensions often strictly intercept fetch()
                const xhr = new XMLHttpRequest()
                xhr.open('GET', url, true)
                xhr.responseType = 'blob'

                xhr.onload = function () {
                    if (this.status === 200) {
                        const blob = this.response
                        objectUrl = URL.createObjectURL(blob)
                        if (active) {
                            setSignedUrl(objectUrl)
                            // Loading/Error handling is done by the Document component now
                        }
                    } else {
                        console.error('[FileViewer] XHR Failed:', this.status)
                        if (active) {
                            setError('تعذر تحميل الملف (XHR)')
                            setLoading(false)
                        }
                    }
                }

                xhr.onerror = function () {
                    console.error('[FileViewer] XHR Network Error')
                    if (active) {
                        // If XHR also fails (blocked), we have one last resort:
                        // Try passing the URL directly to react-pdf, specifically asking it to NOT use streams if possible
                        // But for now, let's report the error.
                        setError('تم حظر تحميل الملف من قبل متصفحك (قد يكون بسبب IDM أو مانع إعلانات). يرجى تعطيل الإضافة لهذا الموقع.')
                        setLoading(false)
                    }
                }

                xhr.send()
            } catch (err) {
                console.error('[FileViewer] Load Error:', err)
                if (active) {
                    setError('تعذر تحميل الملف: ' + (err.message || 'خطأ غير معروف'))
                    setLoading(false)
                }
            }
        }

        loadFile()

        return () => {
            active = false
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [file?.url, fileType])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(3, z + 0.25))
            if (e.key === '-') setZoom(z => Math.max(0.5, z - 0.25))
            if (e.key === '0') { setZoom(1); setRotation(0) }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages)
        setLoading(false)
    }

    const onDocumentLoadError = (err) => {
        console.error('PDF Load Error:', err)
        setError('حدث خطأ أثناء تحميل ملف PDF')
        setLoading(false)
    }

    const handleContextMenu = useCallback((e) => {
        e.preventDefault()
        return false
    }, [])

    const resetView = () => {
        setZoom(1)
        setRotation(0)
    }

    if (!file) return null

    // Determine controls based on file type
    // react-pdf handles zoom via scale prop, but we can also use CSS transform for container
    // Using scale prop on Page is better for quality

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Content Container */}
            <div
                className="relative z-10 w-full h-full sm:w-[95vw] sm:h-[95vh] flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl bg-slate-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-white/10 shrink-0 z-20 shadow-md">
                    <h3 className="text-white font-bold text-sm sm:text-lg truncate max-w-[40%]" dir="rtl">
                        {file.title || 'عرض الملف'}
                    </h3>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex bg-white/10 rounded-lg p-1">
                            <button
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <span className="px-2 py-1.5 text-white/50 text-xs font-mono min-w-[3rem] text-center flex items-center justify-center border-l border-r border-white/10 mx-1">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <ZoomIn size={18} />
                            </button>
                        </div>

                        {(fileType === 'image' || fileType === 'unknown') && (
                            <button
                                onClick={() => setRotation(r => r + 90)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="تدوير"
                            >
                                <RotateCw size={18} />
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white rounded-lg transition-colors ml-2"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Viewer Area */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto flex justify-center bg-slate-950 relative custom-scrollbar"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    onContextMenu={handleContextMenu}
                >
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="text-white/40 text-sm font-medium mt-4">جاري تحميل الملف...</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                            <AlertTriangle className="text-amber-500 mb-4" size={48} />
                            <p className="text-white/80 text-lg font-bold mb-2">عذراً</p>
                            <p className="text-white/50 text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && signedUrl && (fileType === 'image' || fileType === 'unknown') && (
                        <div className="flex items-center justify-center min-h-full min-w-full p-4">
                            <img
                                src={signedUrl}
                                alt={file.title || 'Image'}
                                className="object-contain transition-transform duration-200 max-w-full"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                }}
                                draggable="false"
                            />
                        </div>
                    )}

                    {!error && signedUrl && fileType === 'pdf' && (
                        <div className="py-8 px-4 flex flex-col gap-4">
                            <Document
                                file={signedUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={null}
                                className="flex flex-col gap-4 items-center"
                            >
                                {numPages && Array.from(new Array(numPages), (_, index) => (
                                    <div key={`page_${index + 1}`} className="shadow-2xl">
                                        <Page
                                            pageNumber={index + 1}
                                            scale={zoom}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="bg-white"
                                            loading={
                                                <div className="w-[595px] h-[842px] bg-white/5 animate-pulse flex items-center justify-center text-white/20">
                                                    تحميل الصفحة {index + 1}...
                                                </div>
                                            }
                                        />
                                    </div>
                                ))}
                            </Document>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
