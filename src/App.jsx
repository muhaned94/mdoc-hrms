import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'
import ActivityTracker from './components/analytics/ActivityTracker'
import { SettingsProvider } from './context/SettingsContext'

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

import ProtectedRoute from './components/common/ProtectedRoute'

const Loading = () => <div className="p-10 text-center text-slate-500">جاري التحميل...</div>

function App() {
  return (
    <SettingsProvider>
      <Suspense fallback={<Loading />}>
        <GoogleAnalytics />
        <ActivityTracker />
        <Routes>
          <Route path="/login" element={<Login />} />

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
    </SettingsProvider>
  )
}

export default App
