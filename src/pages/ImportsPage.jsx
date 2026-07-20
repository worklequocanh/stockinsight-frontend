import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import QRScannerModal from '../components/QRScannerModal'
import SidePanel from '../components/common/SidePanel'
import './ImportsPage.css'

export default function ImportsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ id: '', supplierId: '', note: '', items: [] })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [targetItemIndex, setTargetItemIndex] = useState(null)

  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    api.get('/suppliers?limit=100').then(res => setSuppliers(res.data?.data?.items || []))
    api.get('/products?limit=100').then(res => setProducts(res.data?.data?.items || []))
    api.get('/locations?limit=100').then(res => setLocations(res.data?.data?.items || []))
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/imports?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách phiếu nhập'))
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
      await api.post('/imports', {
        supplierId: form.supplierId,
        note: form.note,
        items: form.items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          lotNumber: i.lotNumber,
          expiryDate: i.expiryDate,
          locationId: i.locationId || undefined,
        })),
      })
      setForm({ id: '', supplierId: '', note: '', items: [] })
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu nhập'))
    } finally {
      setSaving(false)
    }
  }

  async function approveImport(id) {
    if (!window.confirm('⚡ Duyệt phiếu nhập này? Tồn kho sẽ lập tức được cộng dồn vào hệ thống và không thể hoàn tác!')) return
    try {
      await api.post(`/imports/${id}/approve`)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi duyệt phiếu nhập'))
    }
  }

  async function rejectImport(id) {
    const reason = window.prompt('Nhập lý do từ chối phiếu nhập kho:')
    if (!reason) return
    try {
      await api.post(`/imports/${id}/reject`, { reason })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi từ chối phiếu nhập'))
    }
  }

  function addItem() {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0, lotNumber: '', expiryDate: '', locationId: '' }]
    }))
  }

  function updateItem(index, field, value) {
    setForm(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        if (product) {
          newItems[index].unitPrice = product.costPrice || 0
        }
      }
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
        alert('❌ Không tìm thấy sản phẩm nào với mã Barcode/QR này trong chuỗi cung ứng!')
      }
    } catch (err) {
      alert(parseApiError(err, 'Lỗi tìm kiếm sản phẩm qua QR'))
    }
  }

  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const approvedCount = items.filter(i => i.status === 'APPROVED').length

  return (
    <div className="imports-container">
      {/* Hero Header */}
      <div className="imports-hero">
        <div className="imports-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● INBOUND RECEIPT & LOT TRACKING</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Quy trình tiếp nhận hàng hóa đầu vào</span>
          </div>
          <h1>Nghiệp Vụ Nhập Kho & Lô Hàng (Inbound Receipt)</h1>
          <p>Tạo phiếu tiếp nhận hàng hóa từ đối tác cung ứng, gán số lô Lot/Batch, hạn sử dụng FEFO, quét mã QR/Barcode và định vị vị trí lưu trữ kệ hàng.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setForm({ id: '', supplierId: '', note: '', items: [] }); setIsFormOpen(true); }}>
            ✨ Lập Phiếu Nhập Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Phiếu Nhập Kho"
          value={meta.total || items.length}
          unit="lệnh nhập"
          trend="↑ Đang theo dõi chuỗi"
          status="success"
          icon="📥"
        />
        <StatKPI
          title="Chờ Thẩm Định (Pending)"
          value={pendingCount}
          unit="phiếu chờ"
          trend={pendingCount > 0 ? 'Cần thủ kho xác nhận' : 'Đã duyệt hoàn tất'}
          status={pendingCount > 0 ? 'warning' : 'success'}
          icon="⏳"
        />
        <StatKPI
          title="Phiếu Đã Nhập Kho (Approved)"
          value={approvedCount}
          unit="lệnh thành công"
          trend="Tồn kho đã cộng dồn"
          status="success"
          icon="✔"
        />
        <StatKPI
          title="Hỗ Trợ Quét QR SKU"
          value="Sẵn Sàng"
          unit="scanner"
          trend="Nhận diện Barcode tự động"
          status="info"
          icon="📷"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="imports-layout-grid">
        {/* Table Container */}
        <div className="imports-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm mã phiếu nhập (VD: IMP-2026), nhà cung cấp..."
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
                  <th>Mã Phiếu & Ngày nhập</th>
                  <th>Nhà cung cấp đối tác</th>
                  <th>Trạng thái</th>
                  <th>Thẩm định bởi</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang đồng bộ danh sách phiếu nhập kho từ cloud..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Chưa có phiếu nhập kho nào được tạo" />
                ) : (
                  items.map((item) => {
                    const statusClass = item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.code}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                            📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>{item.supplier?.name || 'Không xác định'}</strong>
                          {item.note && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Ghi chú: {item.note}</div>}
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
                                <button type="button" className="status-pill success" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => approveImport(item.id)}>
                                  ✔ Duyệt
                                </button>
                                <button type="button" className="status-pill danger" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => rejectImport(item.id)}>
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
      </div>

      {/* SidePanel Drawer */}
      <SidePanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Tiếp Nhận Hàng Hóa"
        subtitle="Lập Phiếu Nhập Kho & Quét QR"
        width="680px"
      >
        <div className="imports-side-form">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Nhà cung cấp hàng hóa *</label>
              <select className="select-field" value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))} required>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Ghi chú lô nhập / Số hóa đơn</label>
              <input
                className="input-field"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="VD: Nhập hàng theo hợp đồng số HĐ-2026/05..."
              />
            </div>

            {/* Products Dynamic List */}
            <div className="form-group full-width" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#38bdf8' }}>📦 Chi tiết sản phẩm nhập</h3>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={addItem}>
                  + Thêm dòng hàng
                </button>
              </div>

              {form.items.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', padding: '24px', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có sản phẩm nào. Nhấp "+ Thêm dòng hàng" để bắt đầu chọn SKU nhập kho.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {form.items.map((item, index) => (
                    <div key={index} className="import-item-card">
                      <div className="import-item-header">
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#38bdf8' }}># Dòng hàng {index + 1}</span>
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
                          <label style={{ fontSize: '0.8rem' }}>Chọn sản phẩm SKU *</label>
                          <select className="select-field" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} required>
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Số lượng nhập *</label>
                          <input type="number" min="1" className="input-field" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Giá nhập đơn vị (VNĐ) *</label>
                          <input type="number" min="0" step="0.01" className="input-field" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} required />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Số Lot / Batch *</label>
                          <input className="input-field" value={item.lotNumber} onChange={(e) => updateItem(index, 'lotNumber', e.target.value)} required placeholder="VD: LOT-2026-05" />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Hạn sử dụng (Expiry Date) *</label>
                          <input type="date" className="input-field" value={item.expiryDate} onChange={(e) => updateItem(index, 'expiryDate', e.target.value)} required />
                        </div>

                        <div className="form-group full-width">
                          <label style={{ fontSize: '0.8rem' }}>Định vị kệ / Vị trí lưu kho (Location)</label>
                          <select className="select-field" value={item.locationId} onChange={(e) => updateItem(index, 'locationId', e.target.value)}>
                            <option value="">-- Kho chung (Chưa gán vị trí) --</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.code} ({loc.name})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving || form.items.length === 0}>
                {saving ? '⏳ Đang lưu...' : '🚀 Hoàn Tất Gửi Phiếu Nhập'}
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
    </div>
  )
}
