import { useState } from 'react'
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const DEMO_ROLES = [
  {
    id: 'admin',
    title: 'Admin Quản trị',
    icon: '🔥',
    email: 'admin@stockinsight.local',
    pass: 'admin123',
  },
  {
    id: 'manager',
    title: 'Quản lý kho',
    icon: '📦',
    email: 'manager@stockinsight.local',
    pass: 'admin123',
  },
  {
    id: 'employee',
    title: 'Nhân viên kho',
    icon: '🧑‍💻',
    email: 'employee@stockinsight.local',
    pass: 'admin123',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading } = useAuth()
  const [email, setEmail] = useState('admin@stockinsight.local')
  const [password, setPassword] = useState('admin123')
  const [selectedDemo, setSelectedDemo] = useState('admin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSelectDemo = (role) => {
    setSelectedDemo(role.id)
    setEmail(role.email)
    setPassword(role.pass)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu hoặc kiểm tra Backend server.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-badge">⚡ WMS Enterprise v3.0</div>
          <h1>Đăng nhập Hệ thống</h1>
          <p>Chọn tài khoản trải nghiệm nhanh hoặc điền thông tin đăng nhập</p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="demo-quick-switcher">
          <p>✨ Chọn tài khoản thử nghiệm nhanh (Click để điền)</p>
          <div className="demo-pills">
            {DEMO_ROLES.map((role) => (
              <button
                type="button"
                key={role.id}
                className={`demo-pill-btn ${selectedDemo === role.id ? 'active' : ''}`}
                onClick={() => handleSelectDemo(role)}
              >
                <span className="role-icon">{role.icon}</span>
                <span>{role.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email đăng nhập</label>
            <div className="input-with-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="name@company.local"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">
              <span>Mật khẩu bảo mật</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', cursor: 'pointer' }}>Quên mật khẩu?</span>
            </label>
            <div className="input-with-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting ? '⏳ Đang xác thực thông tin...' : '🚀 Truy Nhập Hệ Thống Ngay'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            ← Quay lại Trang Chủ Showcase
          </Link>
        </div>
      </div>
    </main>
  )
}
