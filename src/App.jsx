"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"
import { useSelector } from "react-redux"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import UserAssignTask from "./pages/user/AssignTaskUser"
import DataPage from "./pages/admin/DataPage"
import AdminDataPage from "./pages/admin/admin-data-page"
import AccountDataPage from "./pages/delegation"
import QuickTask from "./pages/QuickTask"
import AdminDelegationTask from "./pages/delegation-data"
import "./index.css"
import Demo from "./pages/user/Demo"
import Setting from "./pages/Setting"
import MisReport from "./pages/MisReport"
import HistoryPage from "./pages/admin/HistoryPage"
import TrainingVideoPage from "./pages/admin/TrainingVideoPage"
import CalendarPage from "./pages/admin/CalendarPage"
import HolidayManagementPage from "./pages/admin/HolidayManagementPage"
import RealtimeLogoutListener from "./components/RealtimeLogoutListener"   // ✅ Added listener
import { hasPageAccess } from "./utils/permissionUtils"

// Repair Module Imports
// import RepairDashboard from "./pages/repair/repairDashboard"
// import RequestForm from "./pages/repair/requestForm"
// import PendingRequest from "./pages/repair/pendingRequest"
// import RequestApproval from "./pages/repair/requestApproval"
// import RepairSetting from "./pages/repair/repairSetting"

// Auth wrapper component to protect routes
const ProtectedRoute = ({ children, page }) => {
  const username = localStorage.getItem("user-name")

  // If no user is logged in, redirect to login
  if (!username) {
    return <Navigate to="/login" replace />
  }

  // Permission check
  if (page && !hasPageAccess(page)) {
    // If user doesn't even have dashboard access, don't redirect to dashboard (causes infinite loop)
    if (page === "dashboard") {
      return <Navigate to="/login" replace />
    }
    return <Navigate to="/dashboard/admin" replace />
  }

  return children
}

const AssignTaskRouter = () => {
  const reduxUserData = useSelector((state) => state.login.userData);
  const role = (reduxUserData && !Array.isArray(reduxUserData))
    ? reduxUserData.role
    : localStorage.getItem('role');

  return (role === 'admin' || role === 'super_admin' || role === 'div_admin') 
    ? <AdminAssignTask /> 
    : <UserAssignTask />;
}

function App() {
  return (
    <Router>
      {/* ✅ Realtime listener inside Router so useNavigate works */}
      <RealtimeLogoutListener />

      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/demo" element={<Demo />} />

        {/* Dashboard redirect */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Admin & User Dashboard route */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute page="dashboard">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/quick-task"
          element={
            <ProtectedRoute page="quick_task">
              <QuickTask />
            </ProtectedRoute>
          }
        />

        {/* Assign Task route - reactive role check via Redux */}
        <Route
          path="/dashboard/assign-task"
          element={
            <ProtectedRoute page="assign_task">
              <AssignTaskRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/delegation-task"
          element={
            <ProtectedRoute page="delegation_task">
              <AdminDelegationTask />
            </ProtectedRoute>
          }
        />

        {/* Delegation route for user */}
        <Route
          path="/dashboard/delegation"
          element={
            <ProtectedRoute page="delegation">
              <AccountDataPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/setting"
          element={
            <ProtectedRoute page="settings">
              <Setting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/mis-report"
          element={
            <ProtectedRoute page="mis_report">
              <MisReport />
            </ProtectedRoute>
          }
        />

        {/* Training Video page route */}
        <Route
          path="/dashboard/training-video"
          element={
            <ProtectedRoute page="training_video">
              <TrainingVideoPage />
            </ProtectedRoute>
          }
        />

        {/* History page route */}
        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute page="admin_approval">
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Calendar page route */}
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute page="calendar">
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Holiday Management page route */}
        <Route
          path="/dashboard/holidays"
          element={
            <ProtectedRoute page="holiday_management">
              <HolidayManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Data routes */}
        <Route
          path="/dashboard/data/:category"
          element={
            <ProtectedRoute page="pending_task">
              <DataPage />
            </ProtectedRoute>
          }
        />

        {/* Specific route for Admin Data Page */}
        <Route
          path="/dashboard/data/admin"
          element={
            <ProtectedRoute page="admin_data">
              <AdminDataPage />
            </ProtectedRoute>
          }
        />

        {/* Repair Module Routes */}
        {/* <Route
          path="/repair/dashboard"
          element={
            <ProtectedRoute page="dashboard">
              <RepairDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repair/request-form"
          element={
            <ProtectedRoute page="request_form">
              <RequestForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repair/pending-request"
          element={
            <ProtectedRoute page="pending_request">
              <PendingRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repair/request-approval"
          element={
            <ProtectedRoute page="request_approval">
              <RequestApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repair/repair-setting"
          element={
            <ProtectedRoute page="repair_setting">
              <RepairSetting />
            </ProtectedRoute>
          }
        /> */}

        {/* Backward compatibility redirects */}
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/quick" element={<Navigate to="/dashboard/quick-task" replace />} />
        <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
        <Route path="/admin/delegation-task" element={<Navigate to="/dashboard/delegation-task" replace />} />
        <Route path="/admin/mis-report" element={<Navigate to="/dashboard/mis-report" replace />} />
        <Route path="/admin/data/:category" element={<Navigate to="/dashboard/data/:category" replace />} />
        <Route path="/user/*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </Router>
  )
}

export default App
