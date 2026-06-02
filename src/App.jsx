import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'

// Nested Dashboard Pages
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import SuppliersPage from './pages/SuppliersPage'
import ImportsPage from './pages/ImportsPage'
import ExportsPage from './pages/ExportsPage'
import DashboardPage from './pages/DashboardPage'
import InventoryReportPage from './pages/InventoryReportPage'

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
        <Route path="inventory-reports" element={<InventoryReportPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="imports" element={<ImportsPage />} />
        <Route path="exports" element={<ExportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
