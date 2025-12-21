import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Login from './pages/Login' // Keep Login eager for fast time-to-interactive
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'

// Lazy Load Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const EmployeeList = lazy(() => import('./pages/admin/EmployeeList'))
const AddEmployee = lazy(() => import('./pages/admin/AddEmployee'))
const EmployeeDetails = lazy(() => import('./pages/admin/EmployeeDetails'))

const UserProfile = lazy(() => import('./pages/user/Profile'))
const Settings = lazy(() => import('./pages/user/Settings'))
const Salary = lazy(() => import('./pages/user/Salary'))
const Orders = lazy(() => import('./pages/user/Orders'))
const Courses = lazy(() => import('./pages/user/Courses'))
const Documents = lazy(() => import('./pages/user/Documents'))
const Appreciation = lazy(() => import('./pages/user/Appreciation'))
const Announcements = lazy(() => import('./pages/admin/Announcements'))
const Reports = lazy(() => import('./pages/admin/Reports')) // Analytics
const AdminReports = lazy(() => import('./pages/admin/AdminReports')) // Complaints
const ReportIssue = lazy(() => import('./pages/user/ReportIssue'))
const Messages = lazy(() => import('./pages/user/Messages'))
const SentMessages = lazy(() => import('./pages/admin/SentMessages'))
const EmployeeGrid = lazy(() => import('./pages/admin/EmployeeGrid'))

const Loading = () => <div className="p-10 text-center text-slate-500">جاري التحميل...</div>

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeDetails />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="reports" element={<Reports />} /> {/* Analytics */}
          <Route path="complaints" element={<AdminReports />} /> {/* Complaints System */}
          <Route path="messages" element={<SentMessages />} /> {/* Sent Messages */}
          <Route path="employees-grid" element={<EmployeeGrid />} />
        </Route>

        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="/user/profile" replace />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="salary" element={<Salary />} />
          <Route path="orders" element={<Orders />} />
          <Route path="courses" element={<Courses />} />
          <Route path="documents" element={<Documents />} />
          <Route path="support" element={<ReportIssue />} />
          <Route path="appreciation" element={<Appreciation />} />
          <Route path="messages" element={<Messages />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
