import { supabase } from '../lib/supabase'

/**
 * Storage buckets used in the app
 */
const BUCKETS = {
    documents: 'documents',
    avatars: 'avatars',
    salarySlips: 'salary-slips',
    circulars: 'circulars',
    adminOrders: 'admin_orders'
}

/**
 * Extract the storage path from a Supabase public URL
 * Handles both full URLs and plain paths
 * 
 * @param {string} urlOrPath - Full public URL or just the path
 * @param {string} bucket - The bucket name to extract from
 * @returns {string|null} The storage path, or null if not extractable
 */
export function extractStoragePath(urlOrPath, bucket) {
    if (!urlOrPath) return null

    // If it's already just a path (no http), return as-is
    if (!urlOrPath.startsWith('http')) return urlOrPath

    try {
        const url = new URL(urlOrPath)
        // Handle Supabase Storage URL pattern: /storage/v1/object/public/bucket/path...
        const pathParts = url.pathname.split(`/`)

        // Find the bucket in the path
        // We look for the bucket name provided, OR we try to guess it if detection failed previously?
        // Actually, let's just look for the bucket param.
        const bucketIndex = pathParts.findIndex(p => p === bucket)

        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            return pathParts.slice(bucketIndex + 1).join('/')
        }

        // Fallback: If bucket param didn't match (maybe detectBucket failed), try to find ANY known bucket
        const knownBuckets = Object.values(BUCKETS)
        for (const known of knownBuckets) {
            const idx = pathParts.indexOf(known)
            if (idx !== -1 && idx < pathParts.length - 1) {
                return pathParts.slice(idx + 1).join('/')
            }
        }

    } catch (e) {
        // Not a valid URL, treat as path?
        return null
    }

    return null
}

/**
 * Detect the bucket from a public URL
 */
export function detectBucket(url) {
    if (!url) return BUCKETS.documents

    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('/avatars/')) return BUCKETS.avatars
    if (lowerUrl.includes('/salary-slips/')) return BUCKETS.salarySlips
    if (lowerUrl.includes('/circulars/')) return BUCKETS.circulars
    if (lowerUrl.includes('/admin_orders/')) return BUCKETS.adminOrders
    if (lowerUrl.includes('/documents/')) return BUCKETS.documents

    return BUCKETS.documents
}

/**
 * Detect file type from URL or path
 * @returns {'image'|'pdf'|'unknown'}
 */
export function detectFileType(urlOrPath) {
    if (!urlOrPath) return 'unknown'

    const lower = urlOrPath.toLowerCase().split('?')[0] // Remove query params
    if (lower.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/)) return 'image'
    if (lower.match(/\.(pdf)$/)) return 'pdf'

    return 'unknown'
}

/**
 * Get a signed (temporary) URL for a file
 * 
 * @param {string} urlOrPath - Full public URL or storage path
 * @param {string} bucket - Bucket name (auto-detected if null)
 * @param {number} expiresIn - Seconds until link expires (default: 5 minutes)
 * @returns {Promise<string|null>} Signed URL or null on error
 */
export async function getSignedUrl(urlOrPath, bucket = null, expiresIn = 300) {
    if (!urlOrPath) return null

    const detectedBucket = bucket || detectBucket(urlOrPath)
    const path = extractStoragePath(urlOrPath, detectedBucket)

    if (!path) {
        // Fallback: if we can't extract path, return original URL
        // This handles edge cases like external URLs
        console.log('[FileUtils] Could not extract path from:', urlOrPath)
        return urlOrPath
    }

    // Decode the path in case it's URL-encoded
    const decodedPath = decodeURIComponent(path)

    try {
        // Use createSignedUrl with download: false to prevent download headers
        const { data, error } = await supabase.storage
            .from(detectedBucket)
            .createSignedUrl(decodedPath, expiresIn, { download: false })

        if (error) {
            console.warn('[FileUtils] Signed URL failed:', error.message)
            // Fallback: try getPublicUrl for public buckets
            const { data: publicData } = supabase.storage
                .from(detectedBucket)
                .getPublicUrl(decodedPath)
            return publicData?.publicUrl || urlOrPath
        }

        return data.signedUrl
    } catch (err) {
        console.error('[FileUtils] getSignedUrl error:', err)
        return urlOrPath // Fallback
    }
}

/**
 * Open a file in the FileViewer
 * Returns the data object needed by the FileViewer component
 */
export function prepareFileView(urlOrPath, title = 'عرض الملف') {
    return {
        url: urlOrPath,
        type: detectFileType(urlOrPath),
        title
    }
}

export { BUCKETS }
