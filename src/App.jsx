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
        <Route path="inventory-reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}><InventoryReportPage /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}><ProductsPage /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}><CategoriesPage /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}><SuppliersPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}><CustomersPage /></ProtectedRoute>} />
        <Route path="locations" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}><LocationsPage /></ProtectedRoute>} />
        <Route path="imports" element={<ImportsPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="inventory-checks" element={<InventoryChecksPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
