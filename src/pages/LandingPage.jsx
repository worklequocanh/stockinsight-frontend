import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './LandingPage.css'

const FEATURES = [
  {
    icon: '📦',
    title: 'Quản lý Hàng hóa & SKU',
    desc: 'Chuẩn hóa mã SKU, Barcode, quản lý chi tiết nhà cung cấp, đối tác khách hàng và tự động tính toán định mức tồn kho an toàn.'
  },
  {
    icon: '⏱️',
    title: 'Xuất Nhập theo FEFO AI',
    desc: 'Engine tự động ưu tiên xuất các lô cận hạn sử dụng (First Expired First Out) giúp tối ưu hóa hao phí và rủi ro hết hạn.'
  },
  {
    icon: '📊',
    title: 'Thống kê & Cảnh báo Realtime',
    desc: 'Biểu đồ phân tích trực quan Chart.js và luồng cảnh báo tức thì qua Socket.io mỗi khi tồn kho xuống thấp hoặc lô sắp hết hạn.'
  },
  {
    icon: '🗺️',
    title: 'Sơ đồ Kho 2D/3D Map',
    desc: 'Bản đồ số hóa từng khu vực A-B-C, kệ hàng trong kho. Tra cứu nhanh vị trí lưu trữ của sản phẩm chỉ với 1 click.'
  },
]

const STATS = [
  { value: '13+', label: 'Bảng dữ liệu tích hợp' },
  { value: '100%', label: 'Dữ liệu demo thực tế' },
  { value: 'FEFO', label: 'Thuật toán AI xuất kho' },
  { value: '99.9%', label: 'Uptime cam kết' },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [health, setHealth] = useState({ status: 'checking', message: 'Đang kết nối...' })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    api.get('/health').then(() => {
      setHealth({ status: 'online', message: 'Máy chủ đang hoạt động ổn định' })
    }).catch(() => {
      setHealth({ status: 'offline', message: 'Không thể kết nối máy chủ' })
    })
  }, [])

  const handleCTA = () => {
    if (isAuthenticated) navigate('/dashboard')
    else navigate('/login')
  }

  return (
    <div className="lp-wrapper">
      {/* Navbar */}
      <nav className={`lp-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-logo">
          <div className="lp-nav-logo-icon">📦</div>
          <span className="lp-nav-logo-text">StockInsight</span>
        </div>
        <div className="lp-nav-links">
          <a className="lp-nav-link" href="#features">Tính năng</a>
          <a className="lp-nav-link" href="#stats">Số liệu</a>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.855rem' }}>
            {isAuthenticated ? '→ Vào Dashboard' : 'Đăng nhập'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        {/* Background */}
        <div className="lp-grid-bg" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-hero-content">
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-dot" />
            Hệ thống WMS Enterprise v5.0
          </div>

          <h1 className="lp-hero-title">
            Xây dựng Website
            <br />
            <span className="gradient-text">Quản lý Bán hàng</span>
            <br />
            tích hợp Báo cáo Phân tích
          </h1>

          <p className="lp-hero-sub">
            Nền tảng quản lý kho hàng thông minh — theo dõi tồn kho realtime,
            xuất nhập theo thuật toán FEFO, phân tích BI chuyên sâu và báo cáo doanh thu tức thì.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={handleCTA}>
              {isAuthenticated ? '→ Vào Dashboard ngay' : '🚀 Bắt đầu miễn phí'}
            </button>
            <a href="#features" className="lp-btn-secondary">
              Xem tính năng ↓
            </a>
          </div>

          <div className="lp-server-status">
            <span className={`status-dot ${health.status}`} />
            {health.message}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="lp-stats" id="stats">
        {STATS.map((s, i) => (
          <div className="lp-stat-item" key={i}>
            <div className="lp-stat-value">{s.value}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="lp-features" id="features">
        <div className="lp-section-label">✦ Tính năng nổi bật</div>
        <h2 className="lp-section-title">Mọi thứ bạn cần cho kho hàng</h2>
        <p className="lp-section-sub">
          Từ nhập kho, xuất kho, kiểm kê đến phân tích BI — tất cả trên một nền tảng thống nhất.
        </p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className="lp-feature-card animate-slide-up" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-card">
          <h2 className="lp-cta-title">Sẵn sàng nâng cấp kho hàng?</h2>
          <p className="lp-cta-sub">
            Đăng nhập ngay để trải nghiệm hệ thống quản lý kho thông minh với đầy đủ dữ liệu demo thực tế.
          </p>
          <button className="lp-btn-primary" onClick={handleCTA} style={{ fontSize: '1rem', padding: '14px 36px' }}>
            {isAuthenticated ? '→ Vào Dashboard' : '🔐 Đăng nhập ngay'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        © 2026 StockInsight WMS Enterprise — Đồ án Tốt nghiệp · Xây dựng Website Quản lý Bán hàng tích hợp Báo cáo Phân tích Hàng hóa
      </footer>
    </div>
  )
}
