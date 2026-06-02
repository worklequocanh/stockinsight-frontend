import { useState } from 'react'
import '../auth.css'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const demoChecks = [
  {
    key: 'auth',
    label: 'Authenticated route',
    path: '/protected/auth',
  },
  {
    key: 'admin',
    label: 'Admin route',
    path: '/protected/admin',
  },
  {
    key: 'warehouse',
    label: 'Warehouse route',
    path: '/protected/warehouse',
  },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [result, setResult] = useState(null)
  const [loadingKey, setLoadingKey] = useState(null)

  async function runCheck(item) {
    setLoadingKey(item.key)
    setResult(null)

    try {
      const response = await api.get(item.path)
      setResult({
        type: 'success',
        label: item.label,
        message: response.data?.message || 'OK',
        data: response.data?.data || null,
      })
    } catch (error) {
      setResult({
        type: 'error',
        label: item.label,
        message: error?.response?.data?.message || error.message || 'Request failed',
        status: error?.response?.status || 'unknown',
      })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Phase 2</p>
          <h1>Auth và phân quyền đã sẵn sàng.</h1>
          <p className="dashboard-copy">
            Đây là màn hình xác minh đăng nhập, JWT, `GET /auth/me` và các route phân quyền mẫu.
          </p>
        </div>

        <button className="ghost-button" onClick={logout} type="button">
          Logout
        </button>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <h2>Current user</h2>
          <div className="info-stack">
            <div>
              <span className="info-label">Name</span>
              <strong>{user?.name}</strong>
            </div>
            <div>
              <span className="info-label">Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div>
              <span className="info-label">Role</span>
              <strong>{user?.role}</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <h2>Role checks</h2>
          <div className="check-list">
            {demoChecks.map((item) => (
              <button
                key={item.key}
                className="check-button"
                type="button"
                onClick={() => runCheck(item)}
                disabled={loadingKey !== null}
              >
                {loadingKey === item.key ? 'Checking...' : item.label}
              </button>
            ))}
          </div>

          {result ? (
            <div className={`result-card ${result.type}`}>
              <strong>{result.label}</strong>
              <p>{result.message}</p>
              {'status' in result ? <span>Status: {result.status}</span> : null}
            </div>
          ) : null}
        </article>
      </section>
    </main>
  )
}
