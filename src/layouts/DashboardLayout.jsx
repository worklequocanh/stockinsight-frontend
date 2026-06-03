import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../management.css'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2>StockInsight</h2>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>StockInsight</h2>
          <p className="eyebrow">Phase 3, 4 & 5</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Tổng quan
          </NavLink>
          <NavLink to="/dashboard/inventory-reports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Báo cáo Tồn kho
          </NavLink>
          <NavLink to="/dashboard/products" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Sản phẩm
          </NavLink>
          <NavLink to="/dashboard/categories" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Danh mục
          </NavLink>
          <NavLink to="/dashboard/suppliers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Nhà cung cấp
          </NavLink>
          <NavLink to="/dashboard/imports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Nhập kho
          </NavLink>
          <NavLink to="/dashboard/exports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Xuất kho
          </NavLink>
        </nav>
        <div className="sidebar-footer session-card">
          <span className="session-label">Tài khoản</span>
          <strong>{user?.name}</strong>
          <span className="session-meta">{user?.role}</span>
          <button type="button" className="secondary-button logout-btn" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
