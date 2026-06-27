import { useEffect, useState } from 'react'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'

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
        setError(parseApiError(err, 'Lỗi khi tải dữ liệu báo cáo tồn kho'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Báo cáo Tồn kho & Cảnh báo</h1>
        <p className="hero-copy">Theo dõi tồn kho chi tiết, tốc độ bán và cảnh báo lô hàng sắp hết hạn</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <button 
          className={activeTab === 'inventory' ? 'primary-button' : 'secondary-button'} 
          onClick={() => setActiveTab('inventory')}
        >
          Tồn kho tổng hợp
        </button>
        <button 
          className={activeTab === 'expiring' ? 'primary-button' : 'secondary-button'} 
          onClick={() => setActiveTab('expiring')}
        >
          Lô hàng sắp hết hạn
          {expiring.length > 0 && <span style={{ marginLeft: '8px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{expiring.length}</span>}
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && activeTab === 'inventory' && (
        <div className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Inventory</p>
              <h2>Tồn kho và Cảnh báo nhập hàng</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục / NCC</th>
                  <th>Tồn hiện tại</th>
                  <th>Tốc độ tiêu thụ (30 ngày)</th>
                  <th>Số ngày còn lại ước tính</th>
                  <th>Cảnh báo & Đề xuất</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
                ) : (
                  inventory.map(item => (
                    <tr key={item.id} style={{ background: item.isLowStock ? 'rgba(251, 191, 36, 0.1)' : 'inherit' }}>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="muted-line">SKU: {item.sku}</div>
                      </td>
                      <td>
                        <div>{item.category}</div>
                        <div className="muted-line">{item.supplier}</div>
                      </td>
                      <td>
                        <strong style={{ color: item.isLowStock ? '#d97706' : 'inherit' }}>
                          {item.currentStock} {item.unit}
                        </strong>
                        <div className="muted-line">Tối thiểu: {item.minStock}</div>
                      </td>
                      <td>{item.avgDailyExport} {item.unit}/ngày</td>
                      <td>
                        {item.daysRemaining !== null ? `${item.daysRemaining} ngày` : '-'}
                      </td>
                      <td>
                        {item.isLowStock ? (
                          <>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Tồn kho thấp!</span>
                            <div className="muted-line">Gợi ý nhập: {item.suggestedOrder} {item.unit}</div>
                          </>
                        ) : (
                          <span style={{ color: '#10b981' }}>Đủ hàng</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'expiring' && (
        <div className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Alerts</p>
              <h2>Lô hàng sắp hết hạn (Trong 30 ngày)</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lô (Lot)</th>
                  <th>Tồn kho lô</th>
                  <th>Ngày hết hạn</th>
                  <th>Cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {expiring.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>Không có lô hàng nào sắp hết hạn</td></tr>
                ) : (
                  expiring.map(batch => (
                    <tr key={batch.id}>
                      <td>
                        <strong>{batch.productName}</strong>
                        <div className="muted-line">SKU: {batch.productSku}</div>
                      </td>
                      <td>{batch.lotNumber}</td>
                      <td>{batch.remainingQuantity}</td>
                      <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge--${batch.severity === 'danger' ? 'rejected' : batch.severity === 'warning' ? 'pending' : 'approved'}`}>
                          Còn {batch.daysUntilExpiry} ngày
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
