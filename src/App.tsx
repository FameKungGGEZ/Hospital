import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import StudentHomePage from './pages/student/StudentHomePage'
import StudentVerificationPage from './pages/student/StudentVerificationPage'
import ServiceFormPage from './pages/student/ServiceFormPage'
import SuccessPage from './pages/student/SuccessPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import AdminHistoryPage from './pages/admin/AdminHistoryPage'
import AdminImportPage from './pages/admin/AdminImportPage'
import AdminExportPage from './pages/admin/AdminExportPage'
import AdminReportPage from './pages/admin/AdminReportPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/nurse" replace />} />
        <Route path="/nurse" element={<StudentHomePage />} />
        <Route path="/nurse/verify" element={<StudentVerificationPage />} />
        <Route path="/nurse/service" element={<ServiceFormPage />} />
        <Route path="/nurse/success" element={<SuccessPage />} />
        <Route path="/nurse/admin/login" element={<AdminLoginPage />} />
        <Route path="/nurse/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/nurse/admin/students" element={<AdminStudentsPage />} />
        <Route path="/nurse/admin/history" element={<AdminHistoryPage />} />
        <Route path="/nurse/admin/import" element={<AdminImportPage />} />
        <Route path="/nurse/admin/export" element={<AdminExportPage />} />
        <Route path="/nurse/admin/report" element={<AdminReportPage />} />
        <Route path="/nurse/admin/settings" element={<AdminSettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
