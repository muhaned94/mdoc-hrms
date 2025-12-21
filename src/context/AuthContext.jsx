import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(session?.user ?? null)
      } else {
        // Fallback: Check LocalStorage for custom auth
        const local = localStorage.getItem('mdoc_session')
        if (local) {
            try {
                const parsed = JSON.parse(local)
                setSession(parsed)
                setUser(parsed.user)
            } catch (e) {
                console.error("Auth Parse Error", e)
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
