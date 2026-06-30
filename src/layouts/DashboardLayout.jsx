import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import '../management.css'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="dashboard-layout">
      <div className="mobile-header">
        <h2>StockInsight</h2>
        <NotificationBell />
        <button className="hamburger-btn" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      ></div>

      <aside className={`sidebar glass-card ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>StockInsight</h2>
          <p className="eyebrow">WMS System</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Tổng quan
          </NavLink>
          <NavLink to="/dashboard/visual-map" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Sơ đồ kho (Map)
          </NavLink>
          <NavLink to="/dashboard/inventory-reports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Báo cáo tồn kho
          </NavLink>

          <div className="nav-sep" />

          <NavLink to="/dashboard/products" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Sản phẩm
          </NavLink>
          <NavLink to="/dashboard/categories" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Danh mục
          </NavLink>
          <NavLink to="/dashboard/suppliers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Nhà cung cấp
          </NavLink>
          <NavLink to="/dashboard/customers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Khách hàng
          </NavLink>
          <NavLink to="/dashboard/locations" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Vị trí lưu kho
          </NavLink>

          <div className="nav-sep" />

          <NavLink to="/dashboard/imports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Nhập kho
          </NavLink>
          <NavLink to="/dashboard/exports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Xuất kho
          </NavLink>
          <NavLink to="/dashboard/transfers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Chuyển kho
          </NavLink>
          <NavLink to="/dashboard/inventory-checks" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Kiểm kê kho
          </NavLink>
          <NavLink to="/dashboard/returns" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Trả hàng
          </NavLink>

          {user?.role === 'ADMIN' && (
            <>
              <div className="nav-sep" />
              <NavLink to="/dashboard/users" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Quản lý tài khoản
              </NavLink>
              <NavLink to="/dashboard/audit-logs" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Nhật ký hệ thống
              </NavLink>
            </>
          )}

          <div className="nav-sep" />

          <NavLink to="/dashboard/profile" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Hồ sơ cá nhân
          </NavLink>
        </nav>

        <div className="sidebar-footer session-card glass-panel">
          <span className="session-label">Tài khoản</span>
          <strong>{user?.name}</strong>
          <span className="session-meta">{user?.role}</span>
          <button type="button" className="secondary-button logout-btn" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <div className="desktop-header glass-panel">
          <NotificationBell />
        </div>
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ minHeight: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
