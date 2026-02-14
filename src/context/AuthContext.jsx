import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Apply cached user theme immediately to prevent flash
  useEffect(() => {
    // Get userId from cached session to find correct theme
    try {
      const local = localStorage.getItem('mdoc_session')
      if (local) {
        const parsed = JSON.parse(local)
        const uid = parsed?.user?.id
        if (uid) {
          const cachedTheme = localStorage.getItem(`mdoc_user_theme_${uid}`)
          if (cachedTheme) {
            const root = window.document.documentElement
            root.classList.remove('light', 'dark')
            root.classList.add(cachedTheme)
          }
        }
      }
    } catch (e) { /* ignore */ }
  }, [])

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(session?.user ?? null)
      } else {
        // Fallback: Check LocalStorage and RESTORE Supabase Session
        const local = localStorage.getItem('mdoc_session')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            if (parsed.access_token && parsed.refresh_token) {
              // CRITICAL FIX: Tell Supabase to use this token!
              const { data, error } = await supabase.auth.setSession({
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token
              })

              if (!error && data.session) {
                setSession(data.session)
                setUser(data.session.user)
              } else {
                throw new Error("Session restoration failed")
              }
            }
          } catch (e) {
            console.error("Auth Restoration Error", e)
            // Clear invalid session
            localStorage.removeItem('mdoc_session')
            setSession(null)
            setUser(null)
          }
        }
      }
      setLoading(false)
    })

    // 2. Listen for Supabase changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
        setUser(session?.user ?? null)
      }
      // If no supabase session, we don't nullify immediately, we let the LocalStorage check (via verify/reload) handle it
      // or we can strictly trust Supabase if they ever migrate. 
      // For now, let's keep it safe:
      if (!session) {
        // Check local again or just leave it? 
        // Most safe is to NOT clear if we rely on local, but usually onAuthStateChange fires on SIGN_OUT
        // If SIGN_OUT event, we should clear.
      }
    })

    // 3. Listen for custom login/logout events (MDOC Custom Auth)
    const handleStorageChange = () => {
      const local = localStorage.getItem('mdoc_session')
      if (local) {
        const parsed = JSON.parse(local)
        setSession(parsed)
        setUser(parsed.user)
      } else {
        // If removed (Logout)
        setSession(null)
        setUser(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    // Custom event dispatch for same-window updates
    window.addEventListener('mdoc-auth-update', handleStorageChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('mdoc-auth-update', handleStorageChange)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('mdoc_session')
    setSession(null)
    setUser(null)
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('mdoc-auth-update'))
  }

  const value = {
    session,
    user,
    isAdmin: user?.user_metadata?.role === 'admin',
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
