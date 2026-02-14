import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SettingsContext = createContext()

// Helper: get user-specific localStorage key
const getUserThemeKey = (userId) => userId ? `mdoc_user_theme_${userId}` : null

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        theme: 'light',
        allow_password_change: true,
        allow_profile_picture_change: true,
        allow_backup_download: false,
        login_method: 'both',
        course_settings: {
            grade_1: 2,
            grade_2: 2,
            grade_3: 2,
            grade_4: 2,
            grade_5: 2,
            grade_6: 2,
            grade_7: 2,
            grade_8: 1,
            two_week_weight: 2
        }
    })
    const [loading, setLoading] = useState(true)

    // Per-user theme (null = use system default)
    const [userTheme, setUserThemeState] = useState(null)
    const [currentUserId, setCurrentUserId] = useState(null)

    // Effective theme: user preference > system default
    const effectiveTheme = userTheme || settings.theme

    useEffect(() => {
        fetchSettings()
    }, [])

    // Apply effective theme to DOM
    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(effectiveTheme)
    }, [effectiveTheme])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    console.warn('Settings not found, using defaults')
                } else {
                    console.error('Error fetching settings:', error)
                }
                return
            }

            if (data) {
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    course_settings: {
                        ...prev.course_settings,
                        ...(data.course_settings || {})
                    }
                }))
            }
        } catch (error) {
            console.error('Error in fetchSettings:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)

        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    ...newSettings,
                    id: settings.id || 1,
                    updated_at: new Date()
                })
                .select()

            if (error) throw error
        } catch (error) {
            console.error('Error updating setting:', error)
            alert(`فشل حفظ الإعدادات: ${error.message || 'حدث خطأ غير معروف'}`)
            fetchSettings()
        }
    }

    const toggleTheme = () => {
        const newTheme = settings.theme === 'light' ? 'dark' : 'light'
        updateSetting('theme', newTheme)
    }

    // Set per-user theme (saves to user-specific localStorage + DB)
    const setUserTheme = async (theme, userId) => {
        const uid = userId || currentUserId
        const key = getUserThemeKey(uid)
        if (key) {
            localStorage.setItem(key, theme)
        }
        setUserThemeState(theme)

        // Persist to DB
        if (uid) {
            try {
                const { error } = await supabase
                    .from('employees')
                    .update({ theme_preference: theme })
                    .eq('id', uid)
                if (error) throw error
            } catch (err) {
                console.error('Failed to save theme preference:', err)
            }
        }
    }

    // Load theme preference for a specific user
    const loadUserTheme = async (userId) => {
        setCurrentUserId(userId)

        // Check user-specific localStorage first (instant)
        const key = getUserThemeKey(userId)
        if (key) {
            const cached = localStorage.getItem(key)
            if (cached) {
                setUserThemeState(cached)
            }
        }

        // Then sync from DB
        if (userId) {
            try {
                const { data, error } = await supabase
                    .from('employees')
                    .select('theme_preference')
                    .eq('id', userId)
                    .single()

                if (!error && data?.theme_preference) {
                    if (key) localStorage.setItem(key, data.theme_preference)
                    setUserThemeState(data.theme_preference)
                }
            } catch (err) {
                console.error('Failed to load theme preference:', err)
            }
        }
    }

    // Clear user theme on logout (fall back to system default)
    const clearUserTheme = () => {
        setUserThemeState(null)
        setCurrentUserId(null)
    }

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            toggleTheme,
            loading,
            effectiveTheme,
            setUserTheme,
            loadUserTheme,
            clearUserTheme
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
