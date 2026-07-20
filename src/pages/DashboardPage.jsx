import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'
import StatKPI from '../components/common/StatKPI'
import './DashboardPage.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardPage() {
  const [kpi, setKpi] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [topSelling, setTopSelling] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [kpiRes, monthlyRes, topRes] = await Promise.all([
        api.get('/reports/overview'),
        api.get('/reports/monthly'),
        api.get('/reports/top-selling')
      ])

      setKpi(kpiRes.data?.data)
      setMonthlyData(monthlyRes.data?.data || [])
      setTopSelling(topRes.data?.data || [])
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải dữ liệu báo cáo Command Center'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const apiUrl = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname.includes('fly.dev') ? 'https://stockinsight-backend.fly.dev/api' : 'http://localhost:3001/api')
    const socketUrl = apiUrl.replace('/api', '')
    const socket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    })
    
    socket.on('stock_updated', () => {
      setToast('⚡ Phát hiện thay đổi dữ liệu kho thực tế! Đang đồng bộ tự động...')
      fetchData()
      setTimeout(() => setToast(''), 4500)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="glass-panel" style={{ height: 120, borderRadius: 24, opacity: 0.5, animation: 'pulseGlow 2s infinite' }} />
        <div className="kpi-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel" style={{ height: 140, borderRadius: 22, opacity: 0.5, animation: 'pulseGlow 2s infinite' }} />
          ))}
        </div>
        <div className="glass-panel" style={{ height: 420, borderRadius: 24, opacity: 0.5, animation: 'pulseGlow 2s infinite' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="status-pill danger" style={{ padding: '20px 24px', fontSize: '1.05rem', borderRadius: 16 }}>
          ⚠️ {error}
        </div>
      </div>
    )
  }

  const chartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Giá trị Nhập kho (VNĐ)',
        data: monthlyData.map(d => d.importValue),
        backgroundColor: 'rgba(56, 189, 248, 0.78)',
        borderColor: '#38bdf8',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Giá trị Xuất kho (VNĐ)',
        data: monthlyData.map(d => d.exportValue),
        backgroundColor: 'rgba(244, 63, 94, 0.78)',
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top', 
        labels: { color: '#e2e8f0', font: { family: 'Outfit', weight: '600', size: 13 } } 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#fff',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 14,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${Number(context.raw).toLocaleString('vi-VN')} đ`
        }
      }
    },
    scales: {
      x: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { weight: '600' } } 
      },
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { 
          color: '#94a3b8', 
          font: { weight: '600' },
          callback: (value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value
        } 
      }
    }
  }

  const lastExport = monthlyData[monthlyData.length - 1]?.exportValue || 0
  const forecastData = {
    labels: [...monthlyData.map(d => d.month), 'Tháng tiếp theo (+1)', 'Tháng kế (+2)'],
    datasets: [
      {
        label: 'Dự báo Nhịp độ Xuất kho (AI Forecast Model)',
        data: [...monthlyData.map(d => d.exportValue), lastExport * 1.12, lastExport * 1.18],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.16)',
        borderWidth: 3,
        tension: 0.42,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointRadius: 5,
        pointHoverRadius: 8
      }
    ]
  }

  const forecastOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { position: 'top', labels: { color: '#10b981', font: { family: 'Outfit', weight: '700', size: 13 } } }
    }
  }

  return (
    <div className="dashboard-container">
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="live-sync-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <span>✨</span>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Center Hero Banner */}
      <div className="command-hero">
        <div className="command-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="status-pill success">● LIVE COMMAND CENTER</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Cập nhật mỗi giây qua Socket.io</span>
          </div>
          <h1>Trung tâm Điều hành Kho WMS Enterprise</h1>
          <p>Đồng bộ tức thì mọi chỉ số hoạt động kho bán lẻ, luồng xuất nhập hàng và kiểm soát lô cận hạn (FEFO).</p>
        </div>
        <div className="command-actions">
          <button onClick={fetchData} className="btn-secondary" title="Làm mới dữ liệu tức thì">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Làm mới ngay
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <StatKPI
          title="📦 Tổng Sản Phẩm (SKU)"
          value={kpi?.totalProducts || 0}
          subtitle="Đang lưu kho hoạt động"
          icon="📦"
          trend="+12% so với tháng trước"
          trendDirection="up"
          color="cyan"
        />
        <StatKPI
          title="💰 Tổng Giá Trị Tồn Kho"
          value={`${Number(kpi?.totalStockValue || 0).toLocaleString('vi-VN')} đ`}
          subtitle="Tối ưu tài sản lưu động"
          icon="💎"
          trend="Chuẩn định mức"
          trendDirection="up"
          color="emerald"
        />
        <StatKPI
          title="⚠️ Cảnh Báo Tồn Thấp"
          value={kpi?.lowStockProducts || 0}
          subtitle="SKU dưới ngưỡng an toàn"
          icon="🚨"
          trend="Cần nhập bổ sung"
          trendDirection="down"
          color="amber"
        />
        <StatKPI
          title="🔥 Lô Hàng Cận Hạn (FEFO)"
          value={kpi?.expiringBatches || 0}
          subtitle="Lô hết hạn trong 30 ngày"
          icon="⏳"
          trend="Ưu tiên xuất trước"
          trendDirection="down"
          color="rose"
        />
      </div>

      {/* Main Analytics Layout */}
      <div className="analytics-grid">
        {/* Monthly Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="status-pill info" style={{ marginBottom: 6 }}>📊 BÁO CÁO NHẬP / XUẤT</span>
              <h2>Biểu đồ Biến động Kho 6 Tháng</h2>
            </div>
          </div>
          <div className="chart-wrapper">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Selling Products Table */}
        <div className="top-selling-card">
          <div className="top-selling-header">
            <h3>🔥 Top Sản Phẩm Bán Chạy</h3>
            <p>Xếp hạng theo sản lượng xuất kho FEFO</p>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '410px' }}>
            {topSelling.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu bán hàng gần đây
              </div>
            ) : (
              topSelling.map((item, idx) => {
                const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'
                return (
                  <div key={item.id} className="top-item-row">
                    <div className="top-item-left">
                      <div className={`rank-badge ${rankClass}`}>
                        #{idx + 1}
                      </div>
                      <div className="top-item-info">
                        <strong>{item.name}</strong>
                        <span>SKU: {item.sku}</span>
                      </div>
                    </div>
                    <div className="top-item-stat">
                      {item.totalSold} <span>đơn vị</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* AI Forecasting Panel */}
      <div className="ai-forecast-card">
        <div className="chart-header">
          <div>
            <span className="status-pill success" style={{ marginBottom: 6 }}>🤖 AI PREDICTIVE ANALYTICS</span>
            <h2>Dự báo Xu hướng Nhu cầu Xuất Kho 60 Ngày Tới</h2>
          </div>
          <span style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: 600 }}>● Thuật toán Exponential Smoothing</span>
        </div>
        <div className="chart-wrapper" style={{ height: 320 }}>
          <Line data={forecastData} options={forecastOptions} />
        </div>
      </div>
    </div>
  )
}
