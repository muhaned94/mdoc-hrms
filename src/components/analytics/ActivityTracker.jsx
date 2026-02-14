import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext' // Adjust path 
import { supabase } from '../../lib/supabase' // Adjust path

export default function ActivityTracker() {
    const { user, profile } = useAuth() // Assuming profile has full_name
    const location = useLocation()
    const channelRef = useRef(null)

    // 1. Real-time Presence (Who is online and where)
    useEffect(() => {
        if (!user) return

        // Create channel for presence
        const channel = supabase.channel('online-users')

        channel
            .on('presence', { event: 'sync' }, () => {
                // console.log('Presence synced', channel.presenceState())
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        full_name: profile?.full_name || user.email,
                        online_at: new Date().toISOString(),
                        current_path: location.pathname
                        // We can track last_active here too
                    })
                }
            })

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe()
            }
        }
    }, [user, profile]) // Re-sub if user changes

    // Update Presence on path change
    useEffect(() => {
        if (channelRef.current && user) {
            channelRef.current.track({
                user_id: user.id,
                full_name: profile?.full_name || user.email,
                online_at: new Date().toISOString(),
                current_path: location.pathname
            })
        }
    }, [location.pathname, user, profile])

    // 2. Historical Logging (Insert into DB)
    useEffect(() => {
        if (!user) return

        const logActivity = async () => {
            try {
                await supabase.from('user_activity_logs').insert({
                    user_id: user.id,
                    action_type: 'navigation',
                    path: location.pathname,
                    details: {
                        userAgent: navigator.userAgent
                    }
                })
            } catch (err) {
                // Silence 401s to avoid console spam if table missing/unauthed
                if (err?.code !== '401' && err?.status !== 401) {
                    console.warn('Activity Log Warning:', err.message)
                }
            }
        }

        logActivity()

    }, [location.pathname, user])

    return null // Headless component
}
