import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import ApplyForm from './pages/ApplyForm'
import EligibilityResult from './pages/EligibilityResult'
import EMISelection from './pages/EMISelection'
import LenderSelection from './pages/LenderSelection'
import MyApplications from './pages/MyApplications'
import LenderDashboard from './pages/LenderDashboard'
import VendorDashboard from './pages/VendorDashboard'

function ProtectedRoute({ children, role }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/apply" element={
          <ProtectedRoute><ApplyForm /></ProtectedRoute>
        } />
        <Route path="/eligibility" element={
          <ProtectedRoute><EligibilityResult /></ProtectedRoute>
        } />
        <Route path="/emi-selection" element={
          <ProtectedRoute><EMISelection /></ProtectedRoute>
        } />
        <Route path="/lender-selection" element={
          <ProtectedRoute><LenderSelection /></ProtectedRoute>
        } />
        <Route path="/my-applications" element={
          <ProtectedRoute><MyApplications /></ProtectedRoute>
        } />
        <Route path="/vendor" element={
          <ProtectedRoute><VendorDashboard /></ProtectedRoute>
        } />
        <Route path="/lender-dashboard" element={
          <ProtectedRoute role="lender"><LenderDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
