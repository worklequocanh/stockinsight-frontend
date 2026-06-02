import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../management.css'

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>StockInsight</h2>
          <p className="eyebrow">Phase 3, 4 & 5</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard/products" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Products
          </NavLink>
          <NavLink to="/dashboard/categories" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Categories
          </NavLink>
          <NavLink to="/dashboard/suppliers" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Suppliers
          </NavLink>
          <NavLink to="/dashboard/imports" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Import Receipts
          </NavLink>
          <NavLink to="/dashboard/exports" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Export Receipts
          </NavLink>
        </nav>
        <div className="sidebar-footer session-card">
          <span className="session-label">Signed in as</span>
          <strong>{user?.name}</strong>
          <span className="session-meta">{user?.role}</span>
          <button type="button" className="secondary-button logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
