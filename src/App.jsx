import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'
import ActivityTracker from './components/analytics/ActivityTracker'
import { SettingsProvider } from './context/SettingsContext'
import { supabase } from './lib/supabase'
import { APP_VERSION } from './config'
import UpdateDialog from './components/common/UpdateDialog'
import OfflineModal from './components/common/OfflineModal'
import UpdateModal from './components/common/UpdateModal'
import { useSettings } from './context/SettingsContext'

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const EmployeeList = lazy(() => import('./pages/admin/EmployeeList'))
const AddEmployee = lazy(() => import('./pages/admin/AddEmployee'))
const EmployeeDetails = lazy(() => import('./pages/admin/EmployeeDetails'))
const Announcements = lazy(() => import('./pages/admin/Announcements'))
const AdminCirculars = lazy(() => import('./pages/admin/Circulars'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const SentMessages = lazy(() => import('./pages/admin/SentMessages'))
const EmployeeGrid = lazy(() => import('./pages/admin/EmployeeGrid'))
const SystemAnalytics = lazy(() => import('./pages/admin/SystemAnalytics'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const BulkSalaryUpload = lazy(() => import('./pages/admin/BulkSalaryUpload'))
const BulkCourseAssign = lazy(() => import('./pages/admin/BulkCourseAssign'))


const UserProfile = lazy(() => import('./pages/user/Profile'))
const Settings = lazy(() => import('./pages/user/Settings'))
const Salary = lazy(() => import('./pages/user/Salary'))
const Orders = lazy(() => import('./pages/user/Orders'))
const UserCirculars = lazy(() => import('./pages/user/Circulars'))
const Courses = lazy(() => import('./pages/user/Courses'))
const Documents = lazy(() => import('./pages/user/Documents'))
const Appreciation = lazy(() => import('./pages/user/Appreciation'))
const ReportIssue = lazy(() => import('./pages/user/ReportIssue'))
const Messages = lazy(() => import('./pages/user/Messages'))
const PersonalInfo = lazy(() => import('./pages/user/PersonalInfo'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

import ProtectedRoute from './components/common/ProtectedRoute'

const Loading = () => <div className="p-10 text-center text-slate-500">جاري التحميل...</div>

function App() {
  const [updateInfo, setUpdateInfo] = useState(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine)
  const { settings } = useSettings()

  useEffect(() => {
    checkVersion()

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkVersion = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('latest_version, min_version')
        .single()

      if (!error && data) {
        if (APP_VERSION < data.latest_version) {
          setUpdateInfo(data)
          setShowUpdate(true)
        }
      }
    } catch (err) {
      console.error('Failed to check version:', err)
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <GoogleAnalytics />
      <ActivityTracker />
      {isOffline && <OfflineModal />}
      <UpdateModal settings={settings} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/:id" element={<EmployeeDetails />} />
            <Route path="add-employee" element={<AddEmployee />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="circulars" element={<AdminCirculars />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<SystemAnalytics />} />
            <Route path="complaints" element={<AdminReports />} />
            <Route path="messages" element={<SentMessages />} />
            <Route path="employees-grid" element={<EmployeeGrid />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="bulk-salary-upload" element={<BulkSalaryUpload />} />
            <Route path="bulk-course-assign" element={<BulkCourseAssign />} />
          </Route>

        </Route>

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<Navigate to="/user/profile" replace />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="personal-info" element={<PersonalInfo />} />
            <Route path="settings" element={<Settings />} />
            <Route path="salary" element={<Salary />} />
            <Route path="orders" element={<Orders />} />
            <Route path="circulars" element={<UserCirculars />} />
            <Route path="courses" element={<Courses />} />
            <Route path="documents" element={<Documents />} />
            <Route path="support" element={<ReportIssue />} />
            <Route path="appreciation" element={<Appreciation />} />
            <Route path="messages" element={<Messages />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
