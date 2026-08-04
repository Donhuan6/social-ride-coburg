import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { Landing } from './pages/Landing'
import { Rides } from './pages/Rides'
import { RideDetail } from './pages/RideDetail'
import { Login, NewPassword, PasswordReset, Register } from './pages/auth/AuthPages'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { MyRides } from './pages/dashboard/MyRides'
import { SavedRides } from './pages/dashboard/SavedRides'
import { ProfilePage, SettingsPage } from './pages/dashboard/Profile'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminStats } from './pages/admin/AdminStats'
import { AdminRides } from './pages/admin/AdminRides'
import { AdminRideForm } from './pages/admin/AdminRideForm'
import { AdminParticipants } from './pages/admin/AdminParticipants'
import { Datenschutz, Haftungsausschluss, Impressum } from './pages/Legal'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/rides" element={<Rides />} />
              <Route path="/rides/:slug" element={<RideDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/passwort-reset" element={<PasswordReset />} />
              <Route path="/passwort-neu" element={<NewPassword />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="meine-rides" element={<MyRides />} />
                <Route path="gemerkt" element={<SavedRides />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="einstellungen" element={<SettingsPage />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminStats />} />
                <Route path="rides" element={<AdminRides />} />
                <Route path="rides/neu" element={<AdminRideForm />} />
                <Route path="rides/:id" element={<AdminRideForm />} />
                <Route path="teilnehmer" element={<AdminParticipants />} />
              </Route>
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="/haftungsausschluss" element={<Haftungsausschluss />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
