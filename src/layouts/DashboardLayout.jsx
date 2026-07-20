import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  // Live system clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format page title from pathname
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Tổng quan Command Center'
    if (path.includes('visual-map')) return 'Sơ đồ Kho trực quan (2D/3D Map)'
    if (path.includes('inventory-reports')) return 'Báo cáo Phân tích Tồn kho'
    if (path.includes('products')) return 'Quản lý Sản phẩm & SKU'
    if (path.includes('categories')) return 'Danh mục Hàng hóa'
    if (path.includes('suppliers')) return 'Quản lý Nhà cung cấp'
    if (path.includes('customers')) return 'Quản lý Đối tác Khách hàng'
    if (path.includes('locations')) return 'Sơ đồ Vị trí Kệ hàng'
    if (path.includes('imports')) return 'Phiếu Nhập kho & Quản lý Lô'
    if (path.includes('exports')) return 'Phiếu Xuất kho (FEFO AI Engine)'
    if (path.includes('transfers')) return 'Điều chuyển Nội bộ'
    if (path.includes('inventory-checks')) return 'Kiểm kê Đối soát Thực tế'
    if (path.includes('returns')) return 'Quản lý Trả lại Hàng'
    if (path.includes('users')) return 'Quản trị Tài khoản & Phân quyền'
    if (path.includes('audit-logs')) return 'Nhật ký Kiểm toán (Audit Logs)'
    if (path.includes('profile')) return 'Hồ sơ Cá nhân & Bảo mật'
    return 'Hệ thống WMS Enterprise'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts[parts.length - 1].charAt(0).toUpperCase()
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="icon-btn" onClick={toggleSidebar}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 22, height: 22 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, background: 'linear-gradient(135deg, #fff, var(--primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StockInsight
          </h2>
        </div>
        <NotificationBell />
      </div>

      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      ></div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>StockInsight</h2>
          <div className="eyebrow">WMS Enterprise v3.0</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Command Center</div>
          <NavLink to="/dashboard" end onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Tổng quan
          </NavLink>
          <NavLink to="/dashboard/visual-map" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            Sơ đồ kho (Map)
          </NavLink>
          <NavLink to="/dashboard/inventory-reports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            Báo cáo tồn kho
          </NavLink>

          <div className="nav-sep" />

          <div className="nav-section-title">Danh mục & Đối tác</div>
          <NavLink to="/dashboard/products" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            Sản phẩm & SKU
          </NavLink>
          <NavLink to="/dashboard/categories" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            Danh mục
          </NavLink>
          <NavLink to="/dashboard/suppliers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            Nhà cung cấp
          </NavLink>
          <NavLink to="/dashboard/customers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            Khách hàng
          </NavLink>
          <NavLink to="/dashboard/locations" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Vị trí lưu kho
          </NavLink>

          <div className="nav-sep" />

          <div className="nav-section-title">Nghiệp vụ Kho (FEFO)</div>
          <NavLink to="/dashboard/imports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Nhập kho & Lô
          </NavLink>
          <NavLink to="/dashboard/exports" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Xuất kho (FEFO Engine)
          </NavLink>
          <NavLink to="/dashboard/transfers" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Điều chuyển kho
          </NavLink>
          <NavLink to="/dashboard/inventory-checks" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
            </svg>
            Kiểm kê đối soát
          </NavLink>
          <NavLink to="/dashboard/returns" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
            Trả hàng hoàn
          </NavLink>

          {user?.role === 'ADMIN' && (
            <>
              <div className="nav-sep" />
              <div className="nav-section-title">Quản trị & Phân quyền</div>
              <NavLink to="/dashboard/users" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Quản lý tài khoản
              </NavLink>
              <NavLink to="/dashboard/audit-logs" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Nhật ký hệ thống
              </NavLink>
            </>
          )}

          <div className="nav-sep" />
          <NavLink to="/dashboard/profile" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Hồ sơ cá nhân
          </NavLink>
        </nav>

        {/* User Session Footer */}
        <div className="sidebar-footer">
          <div className="session-card">
            <div className="session-header">
              <div className="session-avatar">
                {getInitials(user?.name)}
              </div>
              <div className="session-info">
                <strong>{user?.name || 'Người dùng WMS'}</strong>
                <span className="session-meta">
                  {user?.role === 'ADMIN' && '🔥 Admin Quản trị'}
                  {user?.role === 'WAREHOUSE_MANAGER' && '📦 Quản lý kho'}
                  {user?.role === 'EMPLOYEE' && '🧑‍💻 Nhân viên kho'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-secondary logout-btn" onClick={logout}>
              Đăng xuất khỏi hệ thống
            </button>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Desktop Header */}
        <header className="desktop-header">
          <div className="header-left">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {getPageTitle()}
            </h3>
            <div className="header-search">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input type="text" placeholder="Tìm nhanh mã SKU, đơn hàng, lô..." />
            </div>
          </div>

          <div className="header-right">
            <div className="live-clock">
              ⚡ {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} • {' '}
              <span style={{ color: 'var(--primary-light)' }}>{currentTime.toLocaleTimeString('vi-VN')}</span>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

