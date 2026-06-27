import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { io } from 'socket.io-client'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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
        setError(parseApiError(err, 'Lỗi khi tải dữ liệu báo cáo'))
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchData()

    const socket = io('http://localhost:3001')
    socket.on('stock_updated', (data) => {
      setToast('Có thay đổi về dữ liệu kho. Đang tự động cập nhật...')
      fetchData()
      setTimeout(() => setToast(''), 3000)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <p>Đang tải dữ liệu báo cáo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="error-banner">{error}</p>
      </div>
    )
  }

  const chartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Giá trị Nhập (VNĐ)',
        data: monthlyData.map(d => d.importValue),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Giá trị Xuất (VNĐ)',
        data: monthlyData.map(d => d.exportValue),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Biểu đồ Nhập/Xuất 6 Tháng Gần Nhất' },
    },
  }

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#38bdf8', color: '#fff', padding: '10px 20px', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {toast}
        </div>
      )}
      <div className="page-header">
        <h1>Tổng quan Dashboard</h1>
        <p className="hero-copy">Các chỉ số KPI và biểu đồ phân tích hoạt động kho</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="resource-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Tổng sản phẩm</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{kpi?.totalProducts}</p>
        </div>
        <div className="resource-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Tổng giá trị tồn</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#10b981' }}>
            {Number(kpi?.totalStockValue || 0).toLocaleString()} VNĐ
          </p>
        </div>
        <div className="resource-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Cảnh báo tồn thấp</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#f59e0b' }}>{kpi?.lowStockProducts}</p>
        </div>
        <div className="resource-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Lô sắp hết hạn</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#ef4444' }}>{kpi?.expiringBatches}</p>
        </div>
      </div>

      <div className="resource-layout">
        <section className="resource-panel" style={{ flex: 2 }}>
          <div className="resource-header">
            <div>
              <p className="section-label">Báo cáo 6 tháng</p>
              <h2>Nhập / Xuất kho</h2>
            </div>
          </div>
          <div style={{ padding: '1rem' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </section>

        <aside className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Thống kê</p>
              <h2>Top Sản Phẩm Bán Chạy</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style={{ textAlign: 'right' }}>SL Đã Bán</th>
                </tr>
              </thead>
              <tbody>
                {topSelling.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                  </tr>
                ) : (
                  topSelling.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{index + 1}. {item.name}</strong>
                        <div className="muted-line">SKU: {item.sku}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {item.totalSold}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  )
}
