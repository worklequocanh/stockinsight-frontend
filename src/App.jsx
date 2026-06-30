import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'

// Nested Dashboard Pages
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import SuppliersPage from './pages/SuppliersPage'
import CustomersPage from './pages/CustomersPage'
import LocationsPage from './pages/LocationsPage'
import ImportsPage from './pages/ImportsPage'
import ExportsPage from './pages/ExportsPage'
import TransfersPage from './pages/TransfersPage'
import DashboardPage from './pages/DashboardPage'
import InventoryReportPage from './pages/InventoryReportPage'
import InventoryChecksPage from './pages/InventoryChecksPage'
import ReturnsPage from './pages/ReturnsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'
import VisualMapPage from './pages/VisualMapPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="visual-map" element={<VisualMapPage />} />
        <Route path="inventory-reports" element={<InventoryReportPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="imports" element={<ImportsPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="inventory-checks" element={<InventoryChecksPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
