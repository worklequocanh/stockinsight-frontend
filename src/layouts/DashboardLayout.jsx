import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import CommandPalette from '../components/CommandPalette'
import './DashboardLayout.css'

const NAV_ITEMS = [
  {
    section: '📊 Tổng quan & Báo cáo',
    links: [
      {
        to: '/dashboard', end: true, label: 'Tổng quan',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      },
      {
        to: '/dashboard/visual-map', label: 'Sơ đồ kho (Map)',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      },
      {
        to: '/dashboard/inventory-reports', label: 'Báo cáo tồn kho',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      },
    ]
  },
  {
    section: 'Danh mục & Đối tác',
    allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER'],
    links: [
      {
        to: '/dashboard/products', label: 'Sản phẩm & SKU',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      },
      {
        to: '/dashboard/categories', label: 'Danh mục',
        icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></>
      },
      {
        to: '/dashboard/suppliers', label: 'Nhà cung cấp',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      },
      {
        to: '/dashboard/customers', label: 'Khách hàng',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      },
      {
        to: '/dashboard/locations', label: 'Vị trí lưu kho',
        icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></>
      },
    ]
  },
  {
    section: '📦 Nghiệp vụ Kho',
    links: [
      {
        to: '/dashboard/imports', label: 'Nhập kho & Lô',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      },
      {
        to: '/dashboard/exports', label: 'Xuất kho (FEFO)',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      },
      {
        to: '/dashboard/transfers', label: 'Điều chuyển kho',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      },
      {
        to: '/dashboard/inventory-checks', label: 'Kiểm kê đối soát',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
      },
      {
        to: '/dashboard/returns', label: 'Trả hàng hoàn',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
      },
    ]
  },
]

const ADMIN_ITEMS = [
  {
    to: '/dashboard/users', label: 'Quản lý tài khoản',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  },
  {
    to: '/dashboard/audit-logs', label: 'Nhật ký hệ thống',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  },
]

function NavIcon({ d }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      {d}
    </svg>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    // If there's a saved preference, use it. Otherwise, default to expanded on large screens.
    const saved = localStorage.getItem('sidebar_expanded')
    if (saved !== null) return saved === 'true'
    return window.innerWidth >= 1024
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)
  const toggleExpanded = () => {
    const next = !isSidebarExpanded
    setIsSidebarExpanded(next)
    localStorage.setItem('sidebar_expanded', String(next))
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Auto collapse/expand based on screen size when resizing
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarExpanded(false)
      } else if (localStorage.getItem('sidebar_expanded') !== 'false') {
        setIsSidebarExpanded(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => { closeSidebar() }, [location.pathname])

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Tổng quan'
    if (path.includes('visual-map')) return 'Sơ đồ kho'
    if (path.includes('inventory-reports')) return 'Báo cáo Tồn kho'
    if (path.includes('products')) return 'Sản phẩm & SKU'
    if (path.includes('categories')) return 'Danh mục'
    if (path.includes('suppliers')) return 'Nhà cung cấp'
    if (path.includes('customers')) return 'Khách hàng'
    if (path.includes('locations')) return 'Vị trí Kho'
    if (path.includes('imports')) return 'Nhập kho'
    if (path.includes('exports')) return 'Xuất kho'
    if (path.includes('transfers')) return 'Điều chuyển'
    if (path.includes('inventory-checks')) return 'Kiểm kê'
    if (path.includes('returns')) return 'Trả hàng'
    if (path.includes('users')) return 'Tài khoản'
    if (path.includes('audit-logs')) return 'Nhật ký'
    if (path.includes('profile')) return 'Hồ sơ cá nhân'
    return 'StockInsight'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts[parts.length - 1].charAt(0).toUpperCase()
  }

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return '🔥 Admin'
    if (role === 'WAREHOUSE_MANAGER') return '📦 Quản lý'
    return '🧑‍💻 Nhân viên'
  }

  const sidebarClass = [
    'sidebar',
    isSidebarExpanded ? 'expanded' : '',
    isSidebarOpen ? 'open' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="dashboard-layout">
      <CommandPalette />
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-icon" onClick={toggleSidebar} style={{ border: 'none' }}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="mobile-header-logo">StockInsight</span>
        </div>
        <NotificationBell />
      </div>

      {/* Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={sidebarClass}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">📦</div>
          <div className="sidebar-brand">
            <h2>StockInsight</h2>
            <span className="eyebrow">WMS Enterprise v5</span>
          </div>
        </div>


        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((group, gi) => {
            if (group.allowedRoles && !group.allowedRoles.includes(user?.role)) return null
            return (
              <div key={gi}>
                {gi > 0 && <div className="nav-sep" />}
                <div className="nav-section-title">{group.section}</div>
                {group.links.map((link) => {
                  if (link.allowedRoles && !link.allowedRoles.includes(user?.role)) return null
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      title={link.label}
                      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                        {link.icon}
                      </svg>
                      <span className="nav-link-label">{link.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            )
          })}

          {user?.role === 'ADMIN' && (
            <>
              <div className="nav-sep" />
              <div className="nav-section-title">Quản trị & Phân quyền</div>
              {ADMIN_ITEMS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  title={link.label}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                    {link.icon}
                  </svg>
                  <span className="nav-link-label">{link.label}</span>
                </NavLink>
              ))}
            </>
          )}

          <div className="nav-sep" />
          <NavLink
            to="/dashboard/profile"
            title="Hồ sơ cá nhân"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span className="nav-link-label">Hồ sơ cá nhân</span>
          </NavLink>
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="session-card">
            <div className="session-header">
              <div className="session-avatar">{getInitials(user?.name)}</div>
              <div className="session-info">
                <strong>{user?.name || 'Người dùng WMS'}</strong>
                <span className="session-meta">{getRoleLabel(user?.role)}</span>
              </div>
            </div>
            <button type="button" className="logout-btn" onClick={logout}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span className="nav-link-label">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        {/* Desktop Header */}
        <header className="desktop-header">
          <div className="header-left">
            <button className="desktop-sidebar-toggle" onClick={toggleExpanded} title={isSidebarExpanded ? 'Thu gọn' : 'Mở rộng'}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-item">StockInsight</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
            <div className="header-search" onClick={() => document.dispatchEvent(new Event('open-command-palette'))} style={{ cursor: 'pointer' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input type="text" placeholder="Tìm kiếm... (Ctrl+K)" readOnly style={{ cursor: 'pointer', pointerEvents: 'none' }} />
              <span className="kbd-hint">⌘K</span>
            </div>
          </div>

          <div className="header-right">
            <div className="live-clock">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              {' '}
              <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>
                {currentTime.toLocaleTimeString('vi-VN')}
              </span>
            </div>
            <NotificationBell />
            <div className="header-user">
              <div className="header-user-avatar">{getInitials(user?.name)}</div>
              <span className="header-user-name">{user?.name?.split(' ').at(-1) || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
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
