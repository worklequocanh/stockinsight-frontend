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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

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

  // Helper for ABC classification
  const getAbcGroup = (item, index) => {
    if (index < Math.ceil(inventory.length * 0.2)) return { group: 'Nhóm A', badge: 'purple', text: '💎 Giá trị / Chu chuyển cao' }
    if (index < Math.ceil(inventory.length * 0.5)) return { group: 'Nhóm B', badge: 'info', text: '⚖️ Chu chuyển trung bình' }
    return { group: 'Nhóm C', badge: 'neutral', text: '📦 Tồn bình thường' }
  }

  // Filtered inventory items
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'LOW' && item.isLowStock) || (statusFilter === 'OK' && !item.isLowStock)
    return matchesSearch && matchesStatus
  })

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = activeTab === 'inventory' 
      ? ['SKU', 'Tên sản phẩm', 'Danh mục', 'Nhà cung cấp', 'Tồn kho', 'Mức tối thiểu', 'Burn Rate', 'Cảnh báo']
      : ['SKU', 'Tên sản phẩm', 'Số lô', 'Số lượng lô', 'Hạn sử dụng', 'Số ngày còn lại']

    const rows = activeTab === 'inventory'
      ? filteredInventory.map(i => [i.sku, `"${i.name}"`, i.category || '', i.supplier || '', i.currentStock, i.minStock, i.avgDailyExport, i.isLowStock ? 'Cần nhập gấp' : 'Đủ hàng'])
      : expiring.map(b => [b.productSku, `"${b.productName}"`, b.lotNumber, b.remainingQuantity, new Date(b.expiryDate).toLocaleDateString('vi-VN'), b.daysUntilExpiry])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Bao_Cao_${activeTab.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="report-page-container">
      {/* Hero Header */}
      <div className="report-hero">
        <div className="report-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● BI ANALYTICS & EXPLICIT ALERTS</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Hệ thống cảnh báo tự động</span>
          </div>
          <h1>Báo Cáo Tồn Kho & Cảnh Báo Sớm (Inventory BI)</h1>
          <p>Phân tích số dư SKU, kiểm soát tốc độ tiêu thụ trung bình (Burn Rate) và phân loại nhóm hàng ABC giúp kho vận hành thông minh.</p>
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
        {/* Table Toolbar */}
        <div className="report-toolbar">
          <div className="table-search">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm theo tên SKU hoặc tên sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {activeTab === 'inventory' && (
            <select 
              className="select-field"
              style={{ width: 'auto', minWidth: '170px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">🌐 Tất cả trạng thái</option>
              <option value="LOW">🚨 Cần nhập gấp</option>
              <option value="OK">✔ An toàn (Đủ hàng)</option>
            </select>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={handleExportCSV}>
              📥 Xuất Excel (CSV)
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              🖨️ In Báo Cáo
            </button>
          </div>
        </div>

        {activeTab === 'inventory' ? (
          <>
            <div className="report-table-header">
              <h3>
                <span>📋</span> Báo Cáo Số Dư SKU & Phân Loại ABC Analysis
              </h3>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                💡 Hàng Nhóm A chiếm ưu tiên lưu giữ và kiểm kê thường xuyên
              </span>
            </div>

            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Sản phẩm SKU</th>
                    <th>Phân Loại ABC</th>
                    <th style={{ textAlign: 'center' }}>Tồn Kho Thực Tế</th>
                    <th style={{ textAlign: 'center' }}>Burn Rate (30 Ngày)</th>
                    <th style={{ textAlign: 'center' }}>Dự Báo Đáp Ứng</th>
                    <th style={{ textAlign: 'right' }}>Khuyến Nghị Nhập Hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableEmpty colSpan={6} text="⏳ Đang tổng hợp số liệu tồn kho toàn hệ thống..." />
                  ) : filteredInventory.length === 0 ? (
                    <TableEmpty colSpan={6} text="❌ Không tìm thấy dữ liệu phù hợp" />
                  ) : (
                    filteredInventory.map((item, index) => {
                      const abc = getAbcGroup(item, index)
                      return (
                        <tr key={item.id} className={item.isLowStock ? 'low-stock-row' : ''}>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.96rem' }}>{item.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--brand-600)', fontWeight: 600 }}>SKU: {item.sku}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${abc.badge}`} title={abc.text}>
                              {abc.group}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.category || 'Chưa phân loại'}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: item.isLowStock ? '#d97706' : '#059669' }}>
                              {item.currentStock} {item.unit}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Min: {item.minStock} {item.unit}</div>
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                            🔥 {item.avgDailyExport} {item.unit}/ngày
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.daysRemaining !== null ? (
                              <span className={`status-pill ${item.daysRemaining < 7 ? 'danger' : item.daysRemaining < 15 ? 'warning' : 'success'}`} style={{ fontWeight: 800 }}>
                                ⏳ Còn {item.daysRemaining} ngày
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)' }}>Chưa có xuất hàng</span>
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
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="report-table-header">
              <h3 style={{ color: '#e11d48' }}>
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
                            <span style={{ fontSize: '0.78rem', color: 'var(--brand-600)', fontWeight: 600 }}>SKU: {batch.productSku}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#e11d48', fontSize: '0.94rem' }}>Lot: {batch.lotNumber}</strong>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {batch.remainingQuantity}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
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
