import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        theme: 'light',
        allow_password_change: true,
        allow_profile_picture_change: true,
        allow_backup_download: false,
        login_method: 'both' // 'password', 'qr', 'both'
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSettings()

        // Application-wide theme application
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(settings.theme)
    }, [settings.theme])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // Table might be empty or missing, use defaults or try to insert?
                    console.warn('Settings not found, using defaults')
                } else {
                    console.error('Error fetching settings:', error)
                }
                return
            }

            if (data) {
                setSettings(data)
            }
        } catch (error) {
            console.error('Error in fetchSettings:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateSetting = async (key, value) => {
        // Optimistic update
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)

        try {
            // Use upsert to handle both update and insert (if missing)
            // ensuring we don't lose other fields by spreading existing settings
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
            // Revert on error
            fetchSettings()
        }
    }

    const toggleTheme = () => {
        const newTheme = settings.theme === 'light' ? 'dark' : 'light'
        updateSetting('theme', newTheme)
    }

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, toggleTheme, loading }}>
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
