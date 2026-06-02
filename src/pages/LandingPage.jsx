import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../landing.css'

const featureItems = [
  {
    title: 'Quản lý hàng hóa',
    description: 'CRUD danh mục, nhà cung cấp và sản phẩm với kiểm soát SKU.',
  },
  {
    title: 'Nhập xuất theo lô',
    description: 'Theo dõi hạn sử dụng, duyệt phiếu và trừ tồn theo FEFO.',
  },
  {
    title: 'Phân tích bán hàng',
    description: 'Dashboard KPI, cảnh báo tồn thấp và gợi ý đặt hàng.',
  },
]

const phaseItems = [
  'Phase 1: Scaffold nền tảng',
  'Phase 2: Auth + RBAC',
  'Phase 3: Dữ liệu nền',
  'Phase 4: Nhập kho',
  'Phase 5: Xuất kho FEFO',
  'Phase 6: Dashboard & báo cáo',
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [health, setHealth] = useState({
    status: 'checking',
    message: 'Đang kiểm tra kết nối backend...',
  })

  useEffect(() => {
    let isMounted = true

    async function loadHealth() {
      try {
        const response = await api.get('/health')
        const payload = response.data?.data ?? response.data

        if (isMounted) {
          setHealth({
            status: payload?.status || 'ok',
            message: response.data?.message || 'Backend đã sẵn sàng.',
            database: payload?.database || 'unknown',
            environment: payload?.environment || 'unknown',
            timestamp: payload?.timestamp || '',
          })
        }
      } catch {
        if (isMounted) {
          setHealth({
            status: 'offline',
            message: 'Không kết nối được backend. Kiểm tra server local.',
          })
        }
      }
    }

    loadHealth()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="landing-shell">
      <section className="hero-card">
        <p className="eyebrow">Website quản lý hàng hóa</p>
        <h1>Dashboard nội bộ cho kho bán lẻ, có báo cáo phân tích bán hàng.</h1>
        <p className="hero-copy">
          Khởi tạo nền tảng code cho đồ án với backend, frontend và Prisma
          schema sẵn sàng cho các phase tiếp theo.
        </p>

        <div className="hero-meta">
          <span>Backend: stockinsight-backend</span>
          <span>Frontend: stockinsight-frontend</span>
          <span>DB: PostgreSQL</span>
        </div>

        <div className="hero-actions">
          <Link className="hero-button primary" to={isAuthenticated ? '/dashboard' : '/login'}>
            {isAuthenticated ? 'Open dashboard' : 'Sign in'}
          </Link>
          <Link className="hero-button secondary" to="/login">
            View login
          </Link>
        </div>

        <div className={`health-panel health-${health.status}`}>
          <div className="health-copy">
            <p className="health-label">Kết nối local</p>
            <h2>{health.message}</h2>
          </div>
          <div className="health-meta">
            <span>Trạng thái: {health.status}</span>
            {health.database ? <span>Database: {health.database}</span> : null}
            {health.environment ? <span>Env: {health.environment}</span> : null}
            {health.timestamp ? <span>Last check: {health.timestamp}</span> : null}
          </div>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Module chính</h2>
          <div className="feature-list">
            {featureItems.map((item) => (
              <div className="feature-item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Lộ trình code</h2>
          <ul className="phase-list">
            {phaseItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}
