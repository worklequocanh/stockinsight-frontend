import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import QRScannerModal from '../components/QRScannerModal'
import './TransfersPage.css'

export default function TransfersPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ id: '', note: '', items: [] })
  
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [targetItemIndex, setTargetItemIndex] = useState(null)

  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    api.get('/products?limit=100').then(res => setProducts(res.data?.data?.items || []))
    api.get('/locations?limit=100').then(res => setLocations(res.data?.data?.items || []))
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/transfers?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách phiếu chuyển kho'))
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
      await api.post('/transfers', {
        note: form.note,
        items: form.items,
      })
      setForm({ id: '', note: '', items: [] })
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu chuyển kho'))
    } finally {
      setSaving(false)
    }
  }

  async function approveTransfer(id) {
    if (!window.confirm('⚡ Duyệt phiếu chuyển kho này? Tồn kho từng khu vực/kệ sẽ được dịch chuyển ngay lập tức trên hệ thống định vị và không thể hoàn tác!')) return
    try {
      await api.post(`/transfers/${id}/approve`)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi duyệt phiếu'))
    }
  }

  async function rejectTransfer(id) {
    const reason = window.prompt('Nhập lý do từ chối phiếu điều chuyển:')
    if (!reason) return
    try {
      await api.post(`/transfers/${id}/reject`, { reason })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi từ chối phiếu'))
    }
  }

  function addItem() {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', fromLocationId: '', toLocationId: '', quantity: 1, fromBatchId: '' }]
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

  function openScanner(index) {
    setTargetItemIndex(index)
    setIsScannerOpen(true)
  }

  async function handleScanSuccess(code) {
    setIsScannerOpen(false)
    try {
      const res = await api.get(`/products/search?code=${code}`)
      const product = res.data?.data?.item
      if (product) {
        updateItem(targetItemIndex, 'productId', product.id)
      } else {
        alert('❌ Không tìm thấy sản phẩm với mã QR/Barcode này!')
      }
    } catch (err) {
      alert(parseApiError(err, 'Lỗi tìm kiếm sản phẩm qua QR'))
    }
  }

  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const approvedCount = items.filter(i => i.status === 'APPROVED').length

  return (
    <div className="transfers-container">
      {/* Hero Header */}
      <div className="transfers-hero">
        <div className="transfers-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● INTERNAL GRID RELOCATION</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Dịch chuyển cấu trúc tọa độ hàng hóa</span>
          </div>
          <h1>Điều Chuyển Vị Trí Kho (Internal Transfers)</h1>
          <p>Dịch chuyển vị trí lưu trữ hàng hóa giữa các khu vực kệ (VD: Từ kho tổng A1 sang kệ bán lẻ B2) để tối ưu không gian và thuận tiện soạn hàng.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => setForm({ id: '', note: '', items: [] })}>
            ✨ Lập Phiếu Điều Chuyển
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Lệnh Điều Chuyển"
          value={meta.total || items.length}
          unit="phiếu"
          trend="↑ Dịch chuyển nội bộ"
          status="success"
          icon="🔄"
        />
        <StatKPI
          title="Chờ Xác Nhận (Pending)"
          value={pendingCount}
          unit="phiếu chờ"
          trend={pendingCount > 0 ? 'Cần thủ kho xác nhận dịch kệ' : 'Tọa độ đã đồng bộ'}
          status={pendingCount > 0 ? 'warning' : 'success'}
          icon="⏳"
        />
        <StatKPI
          title="Đã Chuyển Vị Trí Hoàn Tất"
          value={approvedCount}
          unit="lệnh thành công"
          trend="Grid 3D cập nhật mới"
          status="success"
          icon="✔"
        />
        <StatKPI
          title="Độ Chính Xác Tọa Độ"
          value="100%"
          unit="grid"
          trend="Sơ đồ kệ chuẩn hóa"
          status="info"
          icon="🗺️"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="transfers-layout-grid">
        {/* Table Container */}
        <div className="transfers-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm mã phiếu điều chuyển (VD: TRF-2026), ghi chú..."
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
                  <th>Mã Phiếu & Ngày chuyển</th>
                  <th>Ghi chú điều chuyển</th>
                  <th>Trạng thái</th>
                  <th>Thẩm định bởi</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang đồng bộ danh sách điều chuyển kho từ cloud..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Chưa có phiếu điều chuyển nào được tạo" />
                ) : (
                  items.map((item) => {
                    const statusClass = item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ display: 'block', color: '#fff', fontSize: '0.98rem' }}>{item.code}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                            📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>
                          {item.note || <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>Không có ghi chú</span>}
                        </td>
                        <td>
                          <span className={`status-pill ${statusClass}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                            {translateStatus(item.status)}
                          </span>
                          {item.rejectedReason && (
                            <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: 4 }}>💬 {item.rejectedReason}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>👤 Tạo: {item.createdBy?.name || '-'}</div>
                          {item.approvedBy && (
                            <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: 2 }}>✔ Duyệt: {item.approvedBy.name}</div>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            {item.status === 'PENDING' ? (
                              <>
                                <button type="button" className="status-pill success" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => approveTransfer(item.id)}>
                                  ✔ Duyệt
                                </button>
                                <button type="button" className="status-pill danger" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => rejectTransfer(item.id)}>
                                  ✕ Từ chối
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Đã khóa</span>
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

        {/* Side Form Card */}
        <div className="transfers-side-form">
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16, marginBottom: 20 }}>
            <span className="status-pill info" style={{ marginBottom: 6 }}>🔄 LẬP PHIẾU ĐIỀU CHUYỂN</span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#fff' }}>Dịch Chuyển Kệ Hàng</h2>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Ghi chú lệnh điều chuyển *</label>
              <input
                className="input-field"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                required
                placeholder="VD: Đưa hàng từ kho dự trữ tầng 3 xuống quầy trưng bày A1..."
              />
            </div>

            {/* Products Dynamic List */}
            <div className="form-group full-width" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#a855f7' }}>📦 Sản phẩm chuyển vị trí</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Xác định kệ nguồn và kệ đích</span>
                </div>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={addItem}>
                  + Thêm dòng chuyển
                </button>
              </div>

              {form.items.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', padding: '24px', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa chọn sản phẩm chuyển. Nhấp "+ Thêm dòng chuyển" hoặc quét QR để bắt đầu.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {form.items.map((item, index) => (
                    <div key={index} className="transfer-item-card">
                      <div className="transfer-item-header">
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#c084fc' }}># Dòng chuyển {index + 1}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="status-pill info" style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => openScanner(index)}>
                            📷 Quét QR SKU
                          </button>
                          <button type="button" className="icon-btn delete" style={{ width: 28, height: 28 }} onClick={() => removeItem(index)}>
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="form-grid" style={{ gap: 12 }}>
                        <div className="form-group full-width">
                          <label style={{ fontSize: '0.8rem' }}>Chọn SKU Sản phẩm *</label>
                          <select className="select-field" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} required>
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>📍 Vị trí TỪ (Kệ nguồn) *</label>
                          <select className="select-field" value={item.fromLocationId} onChange={(e) => updateItem(index, 'fromLocationId', e.target.value)} required>
                            <option value="">-- Chọn vị trí từ --</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>🎯 Vị trí ĐẾN (Kệ đích) *</label>
                          <select className="select-field" value={item.toLocationId} onChange={(e) => updateItem(index, 'toLocationId', e.target.value)} required>
                            <option value="">-- Chọn vị trí đến --</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>ID Lô Hàng (Batch ID) *</label>
                          <input type="text" className="input-field" value={item.fromBatchId} onChange={(e) => updateItem(index, 'fromBatchId', e.target.value)} required placeholder="VD: batch-xxx..." />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Số lượng điều chuyển *</label>
                          <input type="number" min="1" className="input-field" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving || form.items.length === 0}>
                {saving ? '⏳ Đang xử lý...' : '🚀 Hoàn Tất Chuyển Kệ'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setForm({ id: '', note: '', items: [] })}>
                🔄 Làm Mới
              </button>
            </div>
          </form>
        </div>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  )
}
