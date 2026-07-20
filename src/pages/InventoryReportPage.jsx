import { useEffect, useState } from 'react'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import './InventoryReportPage.css'

export default function InventoryReportPage() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [inventory, setInventory] = useState([])
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [invRes, expRes] = await Promise.all([
          api.get('/reports/inventory'),
          api.get('/reports/expiring')
        ])
        setInventory(invRes.data?.data || [])
        setExpiring(expRes.data?.data || [])
      } catch (err) {
        setError(parseApiError(err, 'Lỗi khi tải dữ liệu báo cáo tồn kho & cảnh báo hạn sử dụng'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="report-page-container">
      {/* Hero Header */}
      <div className="report-hero">
        <div className="report-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● BI ANALYTICS & EXPLICIT ALERTS</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Hệ thống cảnh báo tự động</span>
          </div>
          <h1>Báo Cáo Tồn Kho & Cảnh Báo Sớm (Inventory & Expiry BI)</h1>
          <p>Phân tích mức độ tồn kho tức thì theo từng SKU, tính toán tốc độ tiêu thụ trung bình và tự động phát lệnh cảnh báo nhập hàng cho các mặt hàng sắp cạn kho hoặc lô cận date.</p>
        </div>
        <div>
          <div className="report-tabs-switcher">
            <button
              type="button"
              className={`report-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <span>📊 Tồn Kho & Đề Xuất Nhập</span>
              <span className="tab-badge">{inventory.length}</span>
            </button>
            <button
              type="button"
              className={`report-tab-btn ${activeTab === 'expiring' ? 'active expiry-tab' : ''}`}
              onClick={() => setActiveTab('expiring')}
            >
              <span>⏳ Lô Hàng Cận Date (FEFO)</span>
              {expiring.length > 0 && (
                <span className="tab-badge" style={{ background: '#f43f5e' }}>{expiring.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      {/* Main Report Table Container */}
      <div className="report-table-card">
        {activeTab === 'inventory' ? (
          <>
            <div className="report-table-header">
              <h3>
                <span>📋</span> Báo Cáo Số Dư SKU & Tốc Độ Tiêu Thụ (Burn Rate)
              </h3>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                💡 Các dòng tô cam cho thấy tồn kho hiện tại ≤ định mức tối thiểu an toàn
              </span>
            </div>

            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Sản phẩm SKU</th>
                    <th>Phân loại / Nhà cung cấp</th>
                    <th style={{ textAlign: 'center' }}>Tồn Kho Thực Tế</th>
                    <th style={{ textAlign: 'center' }}>Burn Rate (30 Ngày)</th>
                    <th style={{ textAlign: 'center' }}>Dự Báo Khả Năng Đáp Ứng</th>
                    <th style={{ textAlign: 'right' }}>Khuyến Nghị Nhập Hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableEmpty colSpan={6} text="⏳ Đang tổng hợp số liệu tồn kho toàn hệ thống..." />
                  ) : inventory.length === 0 ? (
                    <TableEmpty colSpan={6} text="❌ Chưa có dữ liệu tồn kho" />
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id} className={item.isLowStock ? 'low-stock-row' : ''}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.96rem' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>SKU: {item.sku}</span>
                        </td>
                        <td>
                          <div style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600 }}>{item.category || 'Chưa phân loại'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.supplier || 'Đối tác chung'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: item.isLowStock ? '#fbbf24' : '#34d399' }}>
                            {item.currentStock} {item.unit}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tối thiểu: {item.minStock} {item.unit}</div>
                        </td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                          🔥 {item.avgDailyExport} {item.unit}/ngày
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.daysRemaining !== null ? (
                            <span className={`status-pill ${item.daysRemaining < 7 ? 'danger' : item.daysRemaining < 15 ? 'warning' : 'success'}`} style={{ fontWeight: 800 }}>
                              ⏳ Còn {item.daysRemaining} ngày
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>Chưa có biến động xuất</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {item.isLowStock ? (
                            <div className="urgent-order-box">
                              <strong>🚨 Cần Nhập Gấp!</strong>
                              <span>+{item.suggestedOrder} {item.unit}</span>
                            </div>
                          ) : (
                            <span className="status-pill success" style={{ padding: '6px 14px' }}>✔ Đủ hàng duy trì</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="report-table-header">
              <h3 style={{ color: '#f43f5e' }}>
                <span>🚨</span> Danh Sách Các Lô Hàng Cận Hạn Sử Dụng (FEFO Alert)
              </h3>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                💡 Ưu tiên xuất bán trước hoặc chuyển vào danh sách chiết khấu thanh lý
              </span>
            </div>

            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Sản phẩm SKU</th>
                    <th>Số Lô (Lot Number)</th>
                    <th style={{ textAlign: 'center' }}>Tồn Kho Lô</th>
                    <th style={{ textAlign: 'center' }}>Ngày Hết Hạn (Expiry Date)</th>
                    <th style={{ textAlign: 'right' }}>Cảnh Báo Hạn Dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableEmpty colSpan={5} text="⏳ Đang rà soát hạn sử dụng các lô hàng trên Cloud..." />
                  ) : expiring.length === 0 ? (
                    <TableEmpty colSpan={5} text="🎉 Tuyệt vời! Hiện không có lô hàng nào sắp hết hạn trong 30 ngày tới" />
                  ) : (
                    expiring.map((batch) => {
                      const badgeClass = batch.severity === 'danger' ? 'danger' : batch.severity === 'warning' ? 'warning' : 'info'
                      return (
                        <tr key={batch.id} className="expiry-alert-row">
                          <td>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.96rem' }}>{batch.productName}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>SKU: {batch.productSku}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#fb7185', fontSize: '0.94rem' }}>Lot: {batch.lotNumber}</strong>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {batch.remainingQuantity}
                          </td>
                          <td style={{ textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                            📅 {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`status-pill ${badgeClass}`} style={{ fontWeight: 800, fontSize: '0.88rem', padding: '6px 14px' }}>
                              ⚡ Còn {batch.daysUntilExpiry} ngày hết hạn
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
