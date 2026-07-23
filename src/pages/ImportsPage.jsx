import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import QRScannerModal from '../components/QRScannerModal'
import SidePanel from '../components/common/SidePanel'
import { useRoleAccess } from '../hooks/useRoleAccess'
import { useToast } from '../context/ToastContext'
import './ImportsPage.css'

export default function ImportsPage() {
  const { canApprove } = useRoleAccess()
  const { showToast } = useToast()
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 30, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ id: '', supplierId: '', note: '', items: [] })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [targetItemIndex, setTargetItemIndex] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [activeTab, setActiveTab] = useState('PENDING')

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
      const response = await api.get(`/imports?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 30 })}`)
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
    const timer = setTimeout(() => {
      loadData({ search, page })
    }, 400);
    return () => clearTimeout(timer);
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
      showToast('Phiếu nhập đã được tạo thành công! Đang chờ quản lý phê duyệt.', 'success')
      setForm({ id: '', supplierId: '', note: '', items: [] })
      setIsFormOpen(false)
      setPage(1)
      setActiveTab('PENDING')
      await loadData({ search, page: 1 })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi tạo phiếu nhập')
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function approveImport(id) {
    if (!canApprove) {
      showToast('Chỉ Quản lý kho hoặc Admin mới có thể phê duyệt phiếu nhập.', 'warning')
      return
    }
    if (!window.confirm('⚡ Duyệt phiếu nhập này? Tồn kho sẽ lập tức được cộng dồn vào hệ thống và không thể hoàn tác!')) return
    try {
      await api.post(`/imports/${id}/approve`)
      showToast('Phiếu nhập đã được duyệt thành công!', 'success')
      await loadData({ search, page })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi duyệt phiếu nhập')
      setError(msg)
      showToast(msg, 'error')
    }
  }

  async function rejectImport(id) {
    if (!canApprove) {
      showToast('Chỉ Quản lý kho hoặc Admin mới có thể từ chối phiếu nhập.', 'warning')
      return
    }
    const reason = window.prompt('Nhập lý do từ chối phiếu nhập kho:')
    if (!reason) return
    try {
      await api.post(`/imports/${id}/reject`, { reason })
      showToast('Đã từ chối phiếu nhập.', 'info')
      await loadData({ search, page })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi từ chối phiếu nhập')
      setError(msg)
      showToast(msg, 'error')
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
        showToast('Không tìm thấy sản phẩm nào với mã Barcode/QR này!', 'warning')
      }
    } catch (err) {
      showToast(parseApiError(err, 'Lỗi tìm kiếm sản phẩm qua QR'), 'error')
    }
  }

  async function handleViewItem(item) {
    try {
      const res = await api.get(`/imports/${item.id}`)
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

  const pendingItems = items.filter(i => i.status === 'PENDING')
  const approvedItems = items.filter(i => i.status === 'APPROVED')
  const rejectedItems = items.filter(i => i.status === 'REJECTED')

  const tabConfig = [
    { key: 'PENDING',  label: 'Chờ Duyệt',  count: pendingItems.length,  color: '#f59e0b' },
    { key: 'APPROVED', label: 'Đã Duyệt',   count: approvedItems.length, color: '#22c55e' },
    { key: 'REJECTED', label: 'Từ Chối',    count: rejectedItems.length, color: '#f43f5e' },
  ]

  const tabItems = activeTab === 'PENDING' ? pendingItems : activeTab === 'APPROVED' ? approvedItems : rejectedItems

  return (
    <div className="imports-container">
      {/* Hero Header */}
      <div className="imports-hero">
        <div className="imports-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● INBOUND RECEIPT &amp; LOT TRACKING</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Quy trình tiếp nhận hàng hóa đầu vào</span>
          </div>
          <h1>Nghiệp Vụ Nhập Kho &amp; Lô Hàng (Inbound Receipt)</h1>
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
        <StatKPI title="Tổng Phiếu Nhập Kho" value={meta.total || items.length} unit="lệnh nhập" trend="↑ Đang theo dõi chuỗi" status="success" icon="📥" />
        <StatKPI title="Chờ Thẩm Định (Pending)" value={pendingItems.length} unit="phiếu chờ" trend={pendingItems.length > 0 ? 'Cần thủ kho xác nhận' : 'Đã duyệt hoàn tất'} status={pendingItems.length > 0 ? 'warning' : 'success'} icon="⏳" />
        <StatKPI title="Phiếu Đã Nhập Kho (Approved)" value={approvedItems.length} unit="lệnh thành công" trend="Tồn kho đã cộng dồn" status="success" icon="✔" />
        <StatKPI title="Hỗ Trợ Quét QR SKU" value="Sẵn Sàng" unit="scanner" trend="Nhận diện Barcode tự động" status="info" icon="📷" />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      {/* Tab + Table */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Tab Bar */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px', gap: 4, flexWrap: 'wrap' }}>
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 18px',
                border: 'none',
                borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.18s',
                marginBottom: -1,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeTab === tab.key ? tab.color : 'var(--border-subtle)', display: 'inline-block', flexShrink: 0 }} />
              {tab.label}
              <span style={{
                background: activeTab === tab.key ? `${tab.color}22` : 'var(--bg-card)',
                color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.key ? tab.color + '55' : 'var(--border-subtle)'}`,
                borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700,
              }}>
                {tab.count}
              </span>
            </button>
          ))}

          {/* Search pushed right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <div className="table-search" style={{ maxWidth: 300 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm mã phiếu nhập..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value) }}
              />
            </div>
            {loading && <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>⏳ Đang tải...</span>}
          </div>
        </div>

        {/* Table */}
        <div className="modern-table-wrapper">
          <table className="modern-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Mã Phiếu</th>
                <th>Nhà Cung Cấp</th>
                <th>Người Lập</th>
                <th>Ngày Tạo</th>
                {activeTab === 'APPROVED' && <th>Người Duyệt</th>}
                {activeTab === 'REJECTED' && <th>Lý Do Từ Chối</th>}
                <th>Ghi Chú</th>
                <th style={{ textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>⏳ Đang tải dữ liệu...</td></tr>
              ) : tabItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                      {activeTab === 'PENDING' ? '⏳' : activeTab === 'APPROVED' ? '✅' : '🚫'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {activeTab === 'PENDING' ? 'Không có phiếu chờ duyệt' : activeTab === 'APPROVED' ? 'Chưa có phiếu nào được duyệt' : 'Không có phiếu bị từ chối'}
                    </div>
                  </td>
                </tr>
              ) : (
                tabItems.map(item => (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => handleViewItem(item)}>
                    <td>
                      <strong style={{ color: 'var(--brand-400)', fontSize: '0.92rem' }}>{item.code}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.supplier?.name || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.88rem' }}>👤 {item.createdBy?.name || '—'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </td>
                    {activeTab === 'APPROVED' && (
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>✔ {item.approvedBy?.name || '—'}</div>
                        {item.approvedAt && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(item.approvedAt).toLocaleDateString('vi-VN')}</div>}
                      </td>
                    )}
                    {activeTab === 'REJECTED' && (
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#fb7185' }}>💬 {item.rejectedReason || '—'}</span>
                      </td>
                    )}
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: item.note ? 'normal' : 'italic' }}>
                        {item.note || 'Không có ghi chú'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="action-buttons" style={{ justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="status-pill info"
                          style={{ cursor: 'pointer', border: 'none', padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600 }}
                          onClick={() => handleViewItem(item)}
                        >
                          👁 Chi tiết
                        </button>
                        {activeTab === 'PENDING' && (
                          canApprove ? (
                            <>
                              <button
                                type="button"
                                className="status-pill success"
                                style={{ cursor: 'pointer', border: 'none', padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700 }}
                                onClick={() => approveImport(item.id)}
                              >
                                ✔ Duyệt
                              </button>
                              <button
                                type="button"
                                className="status-pill danger"
                                style={{ cursor: 'pointer', border: 'none', padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700 }}
                                onClick={() => rejectImport(item.id)}
                              >
                                ✕ Từ chối
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>⏳ Chờ duyệt</span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Pagination meta={meta} onPageChange={setPage} loading={loading} />
        </div>
      </div>

      {/* SidePanel — Create Form */}
      <SidePanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Tiếp Nhận Hàng Hóa"
        subtitle="Lập Phiếu Nhập Kho &amp; Quét QR"
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
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--brand-400)' }}>📦 Chi tiết sản phẩm nhập</h3>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={addItem}>
                  + Thêm dòng hàng
                </button>
              </div>

              {form.items.length === 0 ? (
                <div style={{ background: 'var(--bg-glass)', border: '1px dashed var(--border-subtle)', padding: '24px', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có sản phẩm nào. Nhấp "+ Thêm dòng hàng" để bắt đầu chọn SKU nhập kho.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {form.items.map((item, index) => (
                    <div key={index} className="import-item-card">
                      <div className="import-item-header">
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--brand-400)' }}># Dòng hàng {index + 1}</span>
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

      {/* View Detail Modal */}
      {viewItem && (
        <SidePanel
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={`📄 Chi Tiết Phiếu: ${viewItem.code}`}
          subtitle={`Tạo ngày ${new Date(viewItem.createdAt).toLocaleDateString('vi-VN')}`}
          width="700px"
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="kanban-info-row"><span>Đối tác:</span><strong>{viewItem.supplier?.name || 'Không xác định'}</strong></div>
              <div className="kanban-info-row"><span>Người lập:</span><strong>{viewItem.createdBy?.name || '-'}</strong></div>
              <div className="kanban-info-row">
                <span>Trạng thái:</span>
                <strong className={`status-pill ${viewItem.status === 'APPROVED' ? 'success' : viewItem.status === 'REJECTED' ? 'danger' : 'warning'}`}>{viewItem.status}</strong>
              </div>
              {viewItem.approvedBy && <div className="kanban-info-row"><span>Người duyệt:</span><strong>{viewItem.approvedBy.name}</strong></div>}
              {viewItem.rejectedReason && (
                <div className="kanban-info-row">
                  <span style={{ color: 'var(--danger-color)' }}>Lý do hủy:</span>
                  <strong style={{ color: 'var(--danger-color)' }}>{viewItem.rejectedReason}</strong>
                </div>
              )}
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              📦 Danh sách sản phẩm nhập kho
            </h4>

            <div className="modern-table-wrapper" style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table className="modern-table" style={{ width: '100%', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th>STT</th><th>Sản phẩm / SKU</th><th>Lô &amp; Hạn sử dụng</th><th>Lưu tại Kệ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewItem.items && viewItem.items.length > 0) ? (
                    viewItem.items.map((it, idx) => {
                      const total = Number(it.quantity) * Number(it.unitPrice)
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--text-main)' }}>{it.product?.name || 'Không rõ'}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {it.product?.sku}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{it.lotNumber || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                          </td>
                          <td><span className="status-pill info" style={{ fontSize: '0.75rem' }}>{it.location?.code || 'Kho chung'}</span></td>
                          <td style={{ fontWeight: 600 }}>{it.quantity}</td>
                          <td>{Number(it.unitPrice).toLocaleString('vi-VN')} đ</td>
                          <td style={{ fontWeight: 600, color: 'var(--brand-500)' }}>{total.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có chi tiết sản phẩm</td></tr>
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
