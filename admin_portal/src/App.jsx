import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import IncidentsPage from './pages/incidents/IncidentsPage'
import IncidentDetailsPage from './pages/incidents/IncidentDetailsPage'
import LiveIncidentMapPage from './pages/operations/LiveIncidentMapPage'
import ServiceProvidersPage from './pages/administration/ServiceProvidersPage'
import ReportTypesPage from './pages/administration/ReportTypesPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import { isAuthorityAuthenticated } from './services/authService'

function RootRedirect() {
  return isAuthorityAuthenticated() ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <LandingPage />
  )
}

function ProtectedPage({ children, roles = null }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
        <Route path="/incidents" element={<ProtectedPage><IncidentsPage /></ProtectedPage>} />
        <Route path="/incidents/:id" element={<ProtectedPage><IncidentDetailsPage /></ProtectedPage>} />
        <Route path="/operations/live-map" element={<ProtectedPage><LiveIncidentMapPage /></ProtectedPage>} />
        <Route path="/analytics" element={<ProtectedPage><AnalyticsPage /></ProtectedPage>} />
        <Route path="/administration/service-providers" element={<ProtectedPage roles={['super_admin']}><ServiceProvidersPage /></ProtectedPage>} />
        <Route path="/administration/report-types" element={<ProtectedPage roles={['super_admin']}><ReportTypesPage /></ProtectedPage>} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
