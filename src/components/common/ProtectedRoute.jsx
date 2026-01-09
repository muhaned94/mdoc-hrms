import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ adminOnly = false }) {
    const { user, isAdmin, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        )
    }

    // 1. Not logged in -> Go to Login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // 2. Admin Only route but user is NOT admin -> Go to User Dashboard
    if (adminOnly && !isAdmin) {
        return <Navigate to="/user/profile" replace />
    }

    // 3. User is logged in (and matches admin requirements if any) -> Show Content
    return <Outlet />
}
