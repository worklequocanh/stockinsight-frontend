import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateReturnStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import './ReturnsPage.css'

const QUALITY_OPTIONS = ['Mới', 'Tốt', 'Hư hỏng', 'Mất niêm phong']

export default function ReturnsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewItem, setViewItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ reason: '', originalExportId: '', items: [] })
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    api.get('/products?limit=200').then(res => setProducts(res.data?.data?.items || []))
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/returns?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách phiếu trả'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ search, page })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/returns', {
        reason: form.reason,
        originalExportId: form.originalExportId || undefined,
        items: form.items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          qualityStatus: i.qualityStatus || 'Mới',
        })),
      })
      setForm({ reason: '', originalExportId: '', items: [] })
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu trả'))
    } finally {
      setSaving(false)
    }
  }

  async function handleProcess(id, action) {
    const label = action === 'RETURNED_TO_STOCK' ? 'nhập lại kho (cộng tăng tồn khả dụng)' : 'tiêu hủy (không cộng tồn kho)'
    if (!window.confirm(`⚡ Xác nhận ${label} đối với phiếu trả hàng này?`)) return
    try {
      await api.put(`/returns/${id}/process`, { action })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xử lý phiếu trả'))
    }
  }

  async function handleViewItem(item) {
    try {
      const res = await api.get(`/returns/${item.id}`)
      if (res.data?.data) {
        setViewItem(res.data.data.item || res.data.data)
      } else {
        setViewItem(item)
      }
    } catch (err) {
      console.error(err)
      setViewItem(item)
    }
  }

  function addItem() {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, qualityStatus: 'Mới' }]
    }))
  }

  function updateItem(index, field, value) {
    setForm(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  function removeItem(index) {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const restockedCount = items.filter(i => i.status === 'RETURNED_TO_STOCK').length
  const discardedCount = items.filter(i => i.status === 'DISCARDED').length

  return (
    <div className="returns-container">
      {/* Hero Header */}
      <div className="returns-hero">
        <div className="returns-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● REVERSE LOGISTICS ENGINE</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Quy trình thu hồi & tái nhập kho</span>
          </div>
          <h1>Quản Lý Hàng Trả & Thu Hồi (Reverse Logistics)</h1>
          <p>Tiếp nhận, thẩm định chất lượng hàng hóa do khách hàng hoặc đối tác hoàn trả. Quyết định tái nhập kho (sản phẩm nguyên vẹn) hoặc tiêu hủy (hàng lỗi/mất niêm phong).</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setForm({ reason: '', originalExportId: '', items: [] }); setIsFormOpen(true); }}>
            ✨ Lập Phiếu Trả Hàng Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Phiếu Tiếp Nhận"
          value={meta.total || items.length}
          unit="phiếu trả"
          trend="↑ Reverse logistics"
          status="success"
          icon="↩️"
        />
        <StatKPI
          title="Chờ Thẩm Định (Pending)"
          value={pendingCount}
          unit="phiếu chờ"
          trend={pendingCount > 0 ? 'Cần phán quyết chất lượng' : 'Đã thẩm định hết'}
          status={pendingCount > 0 ? 'warning' : 'success'}
          icon="⏳"
        />
        <StatKPI
          title="Đã Tái Nhập Kho"
          value={restockedCount}
          unit="lô hàng tốt"
          trend="Cộng tăng tồn khả dụng"
          status="success"
          icon="📦"
        />
        <StatKPI
          title="Đã Tiêu Hủy / Loại Bỏ"
          value={discardedCount}
          unit="lô hàng lỗi"
          trend="Loại khỏi kho chính"
          status="danger"
          icon="🔥"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="returns-layout-grid">
        {/* Table Container */}
        <div className="returns-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm mã phiếu hoàn trả (VD: RET-2026), lý do..."
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
              />
            </div>
          </div>

          <div className="modern-table-wrapper" style={{ flex: 1 }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Mã Phiếu & Ngày tiếp nhận</th>
                  <th>Lý do hoàn trả</th>
                  <th>Trạng thái & Phân loại</th>
                  <th>Khởi tạo bởi</th>
                  <th style={{ textAlign: 'center' }}>Thao tác xử lý</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang tải danh sách hoàn trả hàng hóa từ cloud..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Chưa ghi nhận phiếu hoàn trả hàng nào" />
                ) : (
                  items.map((item) => {
                    const statusClass = item.status === 'RETURNED_TO_STOCK' ? 'success' : item.status === 'DISCARDED' ? 'danger' : 'warning'
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.code}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--brand-400)' }}>
                            📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td>
                          <div style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600 }}>{item.reason || 'Khách hàng hoàn trả'}</div>
                          {item.originalExportId && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              🔗 Từ lệnh xuất: <strong style={{ color: 'var(--brand-400)' }}>{item.originalExportId}</strong>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${statusClass}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                            {translateReturnStatus(item.status)}
                          </span>
                        </td>
                        <td style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                          👤 {item.createdBy?.name || '-'}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center', gap: '8px' }}>
                            <button type="button" className="status-pill info" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => handleViewItem(item)}>
                              👁️ Xem
                            </button>
                            {item.status === 'PENDING' && (
                              <>
                                <button type="button" className="status-pill success" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => handleProcess(item.id, 'RETURNED_TO_STOCK')}>
                                  ↩ Nhập lại kho
                                </button>
                                <button type="button" className="status-pill danger" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => handleProcess(item.id, 'DISCARDED')}>
                                  🔥 Tiêu hủy
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination meta={meta} onPageChange={setPage} loading={loading} />
          </div>
        </div>
      </div>

      {/* SidePanel Drawer */}
      <SidePanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Lập Phiếu Trả Hàng Mới"
        subtitle="Reverse Logistics & Thu Hồi"
        width="600px"
      >
        <div className="returns-side-form">
          <form className="return-form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Lý do hoàn trả hàng *</label>
              <input
                className="input-field"
                value={form.reason}
                onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))}
                required
                placeholder="VD: Hàng bị móp vỏ do vận chuyển, hết hạn..."
              />
            </div>

            <div className="form-group full-width">
              <label>Mã phiếu xuất gốc (Original Export ID)</label>
              <input
                className="input-field"
                value={form.originalExportId}
                onChange={(e) => setForm(p => ({ ...p, originalExportId: e.target.value }))}
                placeholder="VD: EX-2026-0001 (Nếu có)"
              />
            </div>

            <div className="form-group full-width" style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>Danh mục SKU bị hoàn trả *</label>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={addItem}>
                  ➕ Thêm dòng SKU
                </button>
              </div>

              {form.items.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 12, border: '1px dashed var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có sản phẩm nào. Nhấn &quot;➕ Thêm dòng SKU&quot; bên trên.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="return-item-box" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-400)' }}>Dòng #{idx + 1}</span>
                        <button type="button" className="icon-btn delete" onClick={() => removeItem(idx)}>🗑️</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.8rem' }}>Chọn sản phẩm SKU *</label>
                          <select
                            className="select-field"
                            value={item.productId}
                            onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                            required
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: '0.8rem' }}>Số lượng trả *</label>
                            <input
                              type="number"
                              min="1"
                              className="input-field"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.8rem' }}>Đánh giá tình trạng *</label>
                            <select
                              className="select-field"
                              value={item.qualityStatus}
                              onChange={(e) => updateItem(idx, 'qualityStatus', e.target.value)}
                            >
                              {QUALITY_OPTIONS.map(q => (
                                <option key={q} value={q}>{q}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving || form.items.length === 0}>
                {saving ? '⏳ Đang xử lý...' : '🚀 Hoàn Tất Lập Phiếu Trả'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>
                ✕ Đóng
              </button>
            </div>
          </form>
        </div>
      </SidePanel>

      {/* View Item Modal */}
      {viewItem && (
        <SidePanel
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={`📄 Chi Tiết Phiếu Hoàn Trả: ${viewItem.code}`}
          subtitle={`Tạo ngày ${new Date(viewItem.createdAt).toLocaleDateString('vi-VN')}`}
          width="700px"
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="form-group">
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 4 }}>Người lập:</span>
                <strong style={{ color: 'var(--text-main)' }}>{viewItem.createdBy?.name || '-'}</strong>
              </div>
              <div className="form-group">
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 4 }}>Trạng thái:</span>
                <strong className={`status-pill ${viewItem.status === 'RETURNED_TO_STOCK' ? 'success' : viewItem.status === 'DISCARDED' ? 'danger' : 'warning'}`}>
                  {translateReturnStatus(viewItem.status)}
                </strong>
              </div>
              {viewItem.originalExportId && (
                <div className="form-group full-width">
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 4 }}>Phiếu xuất gốc (nếu có):</span>
                  <strong style={{ color: 'var(--brand-400)' }}>{viewItem.originalExportId}</strong>
                </div>
              )}
              {viewItem.reason && (
                <div className="form-group full-width">
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 4 }}>Lý do hoàn trả:</span>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 6, color: 'var(--text-main)' }}>
                    {viewItem.reason}
                  </div>
                </div>
              )}
            </div>
            
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              🔄 Danh sách sản phẩm hoàn trả
            </h4>
            
            <div className="modern-table-wrapper" style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table className="modern-table" style={{ width: '100%', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Sản phẩm / SKU</th>
                    <th>Về Kệ (nếu có)</th>
                    <th>Tình trạng HH</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewItem.items && viewItem.items.length > 0) ? (
                    viewItem.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)' }}>{it.product?.name || 'Không rõ'}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {it.product?.sku || 'N/A'}</span>
                        </td>
                        <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>{it.location?.code || '-'}</td>
                        <td>{it.condition === 'GOOD' ? 'Tốt' : it.condition === 'DAMAGED' ? 'Hư hỏng' : 'Hết hạn'}</td>
                        <td style={{ fontWeight: 700 }}>{it.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có chi tiết sản phẩm</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn-secondary" onClick={() => setViewItem(null)}>
                ✕ Đóng
              </button>
            </div>
          </div>
        </SidePanel>
      )}
    </div>
  )
}
