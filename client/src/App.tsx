import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { MainLayout } from "./components/layout/MainLayout"
import { AdminLayout } from "./components/layout/AdminLayout"
import { Login } from "./pages/Login"
import { AuthCallback } from "./pages/AuthCallback"
import { Landing } from "./pages/Landing"
import { Dashboard } from "./pages/Dashboard"
import { Rooms } from "./pages/Rooms"
import { RoomDetail } from "./pages/RoomDetail"
import { Profile } from "./pages/Profile"
import { Friends } from "./pages/Friends"
import { Analytics } from "./pages/Analytics"
import { AdminOverview } from "./pages/admin/AdminOverview"
import { AdminUsers } from "./pages/admin/AdminUsers"
import { AdminRooms } from "./pages/admin/AdminRooms"
import { AdminAnalytics } from "./pages/admin/AdminAnalytics"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute"
import { Toaster } from "./hooks/useToast"
import { useAuth } from "./contexts/AuthContext"

function RootRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<MainLayout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="rooms"
            element={
              <ProtectedRoute>
                <Rooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="rooms/:roomId"
            element={
              <ProtectedRoute>
                <RoomDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <AdminProtectedRoute>
                <AdminOverview />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <AdminProtectedRoute>
                <AdminUsers />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="rooms"
            element={
              <AdminProtectedRoute>
                <AdminRooms />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <AdminProtectedRoute>
                <AdminAnalytics />
              </AdminProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App

