import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import QRScannerModal from '../components/QRScannerModal'
import SidePanel from '../components/common/SidePanel'
import './TransfersPage.css'
import { useToast } from '../context/ToastContext'

export default function TransfersPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ id: '', note: '', items: [] })
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [targetItemIndex, setTargetItemIndex] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [availableBatches, setAvailableBatches] = useState([])

  const fetchMasterData = () => {
    api.get('/products?limit=100').then(res => setProducts(res.data?.data?.items || []))
    api.get('/locations?limit=100').then(res => setLocations(res.data?.data?.items || []))
    api.get('/transfers/available-batches').then(res => setAvailableBatches(res.data?.data?.batches || []))
  }

  useEffect(() => {
    fetchMasterData()
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
      showToast('Phiếu điều chuyển đã được tạo thành công!', 'success')
      setForm({ id: '', note: '', items: [] })
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi tạo phiếu chuyển kho')
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function approveTransfer(id) {
    if (!window.confirm('⚡ Duyệt phiếu chuyển kho này? Tồn kho từng khu vực/kệ sẽ được dịch chuyển ngay lập tức và không thể hoàn tác!')) return
    try {
      await api.post(`/transfers/${id}/approve`)
      showToast('Phiếu điều chuyển đã được duyệt thành công!', 'success')
      await loadData({ search, page })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi duyệt phiếu')
      setError(msg)
      showToast(msg, 'error')
    }
  }

  async function rejectTransfer(id) {
    const reason = window.prompt('Nhập lý do từ chối phiếu điều chuyển:')
    if (!reason) return
    try {
      await api.post(`/transfers/${id}/reject`, { reason })
      showToast('Đã từ chối phiếu điều chuyển.', 'info')
      await loadData({ search, page })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi từ chối phiếu')
      setError(msg)
      showToast(msg, 'error')
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
        showToast('Không tìm thấy sản phẩm với mã QR/Barcode này!', 'warning')
      }
    } catch (err) {
      showToast(parseApiError(err, 'Lỗi tìm kiếm sản phẩm qua QR'), 'error')
    }
  }

  async function handleViewItem(item) {
    try {
      const res = await api.get(`/transfers/${item.id}`)
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
          <button type="button" className="btn-primary" onClick={() => { setForm({ id: '', note: '', items: [] }); setIsFormOpen(true); }}>
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
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
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
                  <th>Mã Phiếu &amp; Ngày chuyển</th>
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
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.code}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--brand-400)' }}>
                            📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>
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
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>👤 Tạo: {item.createdBy?.name || '-'}</div>
                          {item.approvedBy && (
                            <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: 2 }}>✔ Duyệt: {item.approvedBy.name}</div>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center', gap: '8px' }}>
                            <button type="button" className="status-pill info" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => handleViewItem(item)}>
                              👁️ Xem
                            </button>
                            {item.status === 'PENDING' && (
                              <>
                                <button type="button" className="status-pill success" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => approveTransfer(item.id)}>
                                  ✔ Duyệt
                                </button>
                                <button type="button" className="status-pill danger" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => rejectTransfer(item.id)}>
                                  ✕ Từ chối
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
        title="Dịch Chuyển Kệ Hàng"
        subtitle="Lập Phiếu Điều Chuyển Vị Trí Kho"
        width="680px"
      >
        <div className="transfers-side-form">
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
                <div style={{ background: 'var(--bg-glass)', border: '1px dashed var(--border-subtle)', padding: '24px', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa chọn sản phẩm chuyển. Nhấp &quot;+ Thêm dòng chuyển&quot; hoặc quét QR để bắt đầu.
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
                          <label style={{ fontSize: '0.8rem' }}>1. Chọn SKU Sản phẩm *</label>
                          <select 
                            className="select-field" 
                            value={item.productId} 
                            onChange={(e) => {
                              updateItem(index, 'productId', e.target.value)
                              updateItem(index, 'fromBatchId', '')
                              updateItem(index, 'fromLocationId', '')
                            }} 
                            required
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label style={{ fontSize: '0.8rem' }}>2. Chọn Lô hàng khả dụng & Kệ TỪ (Nguồn thực tế) *</label>
                          <select 
                            className="select-field" 
                            value={item.fromBatchId} 
                            onChange={(e) => {
                              const batchId = e.target.value
                              const selectedBatch = availableBatches.find(b => b.id === batchId)
                              if (selectedBatch) {
                                updateItem(index, 'fromBatchId', selectedBatch.id)
                                updateItem(index, 'fromLocationId', selectedBatch.locationId)
                                if (!item.quantity || item.quantity > selectedBatch.remainingQuantity) {
                                  updateItem(index, 'quantity', selectedBatch.remainingQuantity)
                                }
                              } else {
                                updateItem(index, 'fromBatchId', '')
                                updateItem(index, 'fromLocationId', '')
                              }
                            }} 
                            required
                            disabled={!item.productId}
                          >
                            <option value="">-- {item.productId ? 'Chọn lô hàng & kệ gửi' : 'Vui lòng chọn sản phẩm trước'} --</option>
                            {availableBatches
                              .filter(b => b.productId === item.productId)
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  📦 Lô: {b.lotNumber} | Expiry: {new Date(b.expiryDate).toLocaleDateString('vi-VN')} | 📍 Kệ hiện tại: {b.location?.code || 'N/A'} (Tồn: {b.remainingQuantity} {b.product?.unit})
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>3. 🎯 Chọn Vị trí ĐẾN (Kệ đích) *</label>
                          <select 
                            className="select-field" 
                            value={item.toLocationId} 
                            onChange={(e) => updateItem(index, 'toLocationId', e.target.value)} 
                            required
                          >
                            <option value="">-- Chọn vị trí đến --</option>
                            {locations
                              .filter(loc => loc.id !== item.fromLocationId)
                              .map((loc) => (
                                <option key={loc.id} value={loc.id}>{loc.code} ({loc.name})</option>
                              ))
                            }
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>4. Số lượng điều chuyển *</label>
                          <input 
                            type="number" 
                            min="1" 
                            max={availableBatches.find(b => b.id === item.fromBatchId)?.remainingQuantity || 999999}
                            className="input-field" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving || form.items.length === 0}>
                {saving ? '⏳ Đang xử lý...' : '🚀 Hoàn Tất Chuyển Kệ'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>
                ✕ Đóng
              </button>
            </div>
          </form>
        </div>
      </SidePanel>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      {/* View Item Modal */}
      {viewItem && (
        <SidePanel
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={`📄 Chi Tiết Phiếu Chuyển: ${viewItem.code}`}
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
                <strong className={`status-pill ${viewItem.status === 'APPROVED' ? 'success' : viewItem.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                  {translateStatus(viewItem.status)}
                </strong>
              </div>
              {viewItem.approvedBy && (
                <div className="form-group">
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 4 }}>Người duyệt:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{viewItem.approvedBy.name}</strong>
                </div>
              )}
              {viewItem.rejectedReason && (
                <div className="form-group">
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--danger-color)', marginBottom: 4 }}>Lý do hủy:</span>
                  <strong style={{ color: 'var(--danger-color)' }}>{viewItem.rejectedReason}</strong>
                </div>
              )}
              {viewItem.note && (
                <div className="form-group full-width">
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 4 }}>Ghi chú:</span>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 6, color: 'var(--text-main)' }}>
                    {viewItem.note}
                  </div>
                </div>
              )}
            </div>
            
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              🔄 Danh sách sản phẩm điều chuyển
            </h4>
            
            <div className="modern-table-wrapper" style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table className="modern-table" style={{ width: '100%', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Sản phẩm / Lô</th>
                    <th>Từ Kệ</th>
                    <th>Đến Kệ</th>
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
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lô: {it.stockBatch?.batchNumber || 'N/A'}</span>
                        </td>
                        <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>{it.fromLocation?.code || '-'}</td>
                        <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>{it.toLocation?.code || '-'}</td>
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
