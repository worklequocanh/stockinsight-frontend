import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './LandingPage.css'

const featureCards = [
  {
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: 'Quản lý Hàng hóa & SKU Số hóa',
    description: 'Hệ thống chuẩn hóa mã SKU, Barcode, quản lý chi tiết nhà cung cấp, đối tác khách hàng và tự động tính toán định mức tồn kho an toàn.'
  },
  {
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Xuất Nhập theo Thuật toán FEFO',
    description: 'AI Engine tự động ưu tiên xuất các lô cận hạn sử dụng (First Expired First Out) giúp tối ưu hóa hao phí và rủi ro hết hạn cho doanh nghiệp.'
  },
  {
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Thống kê & Cảnh báo Realtime',
    description: 'Biểu đồ phân tích trực quan Chart.js và luồng cảnh báo tức thì qua Socket.io mỗi khi tồn kho xuống thấp hoặc phát hiện lô sắp hết hạn.'
  },
  {
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
    title: 'Sơ đồ Kho Trực quan 2D/3D Map',
    description: 'Bản đồ số hóa từng khu vực A-B-C, kệ hàng trong kho. Cho phép tra cứu nhanh vị trí lưu trữ của sản phẩm chỉ với 1 cú click.'
  }
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [health, setHealth] = useState({
    status: 'checking',
    message: 'Đang kết nối tới máy chủ WMS Cloud...'
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
            message: response.data?.message || 'Máy chủ Backend & Database đã sẵn sàng hoạt động tối đa.',
            database: payload?.database || 'Postgres Cloud',
            timestamp: new Date().toLocaleTimeString('vi-VN')
          })
        }
      } catch {
        if (isMounted) {
          setHealth({
            status: 'offline',
            message: 'Đang kết nối... (Vui lòng khởi động Backend API tại localhost:3001)'
          })
        }
      }
    }

    loadHealth()
    return () => { isMounted = false }
  }, [])

  return (
    <div className="landing-shell">
      {/* Navigation Bar */}
      <header className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" style={{ width: 24, height: 24 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504 1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h2>StockInsight</h2>
        </div>
        <div>
          <Link className="hero-btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem' }} to={isAuthenticated ? '/dashboard' : '/login'}>
            {isAuthenticated ? 'Vào Command Center' : 'Đăng nhập ngay'}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span>⚡</span> WMS Enterprise v3.0 Deep Cyber
          </div>
          <h1>
            Quản lý Kho thông minh chuẩn <span className="gradient-text">FEFO & Realtime AI</span>
          </h1>
          <p className="hero-copy">
            Nền tảng quản lý tồn kho thế hệ mới dành cho doanh nghiệp bán lẻ và chuỗi cung ứng. Tối ưu hóa lô hàng, kiểm soát hạn sử dụng tự động và báo cáo đa chiều trên giao diện Glassmorphism đỉnh cao.
          </p>

          <div className="hero-buttons">
            <Link className="hero-btn-primary" to={isAuthenticated ? '/dashboard' : '/login'}>
              {isAuthenticated ? 'Truy cập Command Center' : 'Bắt đầu Trải nghiệm'}
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a href="#features" className="hero-btn-secondary">
              Khám phá tính năng
            </a>
          </div>
        </div>

        {/* Mockup Preview Card */}
        <div className="hero-visual">
          <div className="mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span /><span /><span />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>stockinsight.enterprise / command-center</span>
            </div>

            <div className="mockup-stats">
              <div className="mock-stat-box">
                <p>📦 Tổng sản phẩm lưu kho</p>
                <h4>1,428 SKU</h4>
              </div>
              <div className="mock-stat-box">
                <p>📈 Giá trị tồn kho thực tế</p>
                <h4 style={{ color: '#38bdf8' }}>3.24 Tỷ VNĐ</h4>
              </div>
            </div>

            <div className="mock-fefo-alert">
              <span style={{ fontSize: '1.6rem' }}>⚡</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>Phát hiện 3 lô hàng cận date trong 30 ngày</strong>
                <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>Thuật toán FEFO đã tự động điều hướng ưu tiên vào phiếu xuất tiếp theo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Health Status Banner */}
      <section className="health-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className={`health-badge ${health.status === 'ok' ? 'ok' : 'offline'}`}>
            {health.status === 'ok' ? '● System Online & Ready' : '○ Checking Backend API'}
          </span>
          <span style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 600 }}>
            {health.message}
          </span>
        </div>
        {health.timestamp && (
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Cập nhật lúc: {health.timestamp}
          </span>
        )}
      </section>

      {/* Features Showcase */}
      <section id="features" className="landing-features">
        <div className="section-title">
          <h2>Bộ Tính năng Nghiệp vụ Cốt lõi</h2>
          <p>Được thiết kế chuẩn hóa cho tốc độ xử lý nhanh, bảo mật chặt chẽ và trải nghiệm người dùng hiện đại nhất.</p>
        </div>

        <div className="features-grid">
          {featureCards.map((feat) => (
            <div className="feature-box" key={feat.title}>
              <div className="feature-icon-wrapper">
                {feat.icon}
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
