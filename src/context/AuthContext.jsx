import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for Supabase Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } else {
        // Fallback to LocalStorage (Custom Auth)
        const local = localStorage.getItem('mdoc_session')
        if (local) {
            const parsed = JSON.parse(local)
            setSession(parsed)
            setUser(parsed.user)
        }
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for custom login events
    const handleStorageChange = () => {
        const local = localStorage.getItem('mdoc_session')
        if (local) {
            const parsed = JSON.parse(local)
            setSession(parsed)
            setUser(parsed.user)
        } else {
             // If removed
             setSession(null)
             setUser(null)
        }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
        subscription.unsubscribe()
        window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const signOut = async () => {
      await supabase.auth.signOut()
      localStorage.removeItem('mdoc_session')
      setSession(null)
      setUser(null)
      window.dispatchEvent(new Event('storage'))
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
