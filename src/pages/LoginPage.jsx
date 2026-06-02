import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading } = useAuth()
  const [email, setEmail] = useState('admin@stockinsight.local')
  const [password, setPassword] = useState('admin123')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

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
          'Đăng nhập thất bại. Kiểm tra email và mật khẩu.',
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
      <section className="auth-card">
        <p className="auth-eyebrow">StockInsight</p>
        <h1>Đăng nhập hệ thống</h1>
        <p className="auth-copy">
          Dùng tài khoản seed để kiểm tra JWT, `GET /auth/me` và phân quyền.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-hint">
          <p>Demo accounts</p>
          <ul>
            <li>admin@stockinsight.local / admin123</li>
            <li>manager@stockinsight.local / admin123</li>
            <li>employee@stockinsight.local / admin123</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
