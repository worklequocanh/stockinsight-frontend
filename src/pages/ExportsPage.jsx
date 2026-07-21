import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateStatus, translateExportType } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import QRScannerModal from '../components/QRScannerModal'
import SidePanel from '../components/common/SidePanel'
import './ExportsPage.css'

export default function ExportsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ id: '', exportType: 'SALE', note: '', customerId: '', items: [] })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [targetItemIndex, setTargetItemIndex] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    api.get('/products?limit=100').then(res => setProducts(res.data?.data?.items || []))
    api.get('/customers?limit=100').then(res => setCustomers(res.data?.data?.items || []))
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/exports?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách phiếu xuất'))
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
      await api.post('/exports', {
        exportType: form.exportType,
        note: form.note,
        customerId: form.exportType === 'SALE' ? form.customerId : undefined,
        items: form.items,
      })
      setForm({ id: '', exportType: 'SALE', note: '', customerId: '', items: [] })
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu xuất'))
    } finally {
      setSaving(false)
    }
  }

  async function approveExport(id) {
    if (!window.confirm('⚡ Duyệt lệnh xuất này? Hệ thống AI FEFO Engine sẽ tự động ưu tiên trích xuất các lô hàng cận date nhất trước và khấu trừ tồn khả dụng, không thể hoàn tác!')) return
    try {
      await api.post(`/exports/${id}/approve`)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi duyệt phiếu xuất'))
    }
  }

  async function rejectExport(id) {
    const reason = window.prompt('Nhập lý do từ chối phiếu xuất kho:')
    if (!reason) return
    try {
      await api.post(`/exports/${id}/reject`, { reason })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi từ chối phiếu xuất'))
    }
  }

  function addItem() {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  function updateItem(index, field, value) {
    setForm(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        if (product) {
          newItems[index].unitPrice = product.sellingPrice || product.salePrice || product.price || 0
          newItems[index].costPrice = product.costPrice || 0
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
        alert('❌ Không tìm thấy sản phẩm nào với mã Barcode/QR này!')
      }
    } catch (err) {
      alert(parseApiError(err, 'Lỗi tìm kiếm sản phẩm qua QR'))
    }
  }

  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const approvedCount = items.filter(i => i.status === 'APPROVED').length

  return (
    <div className="exports-container">
      {/* Hero Header */}
      <div className="exports-hero">
        <div className="exports-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● OUTBOUND FEFO ENGINE</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Điều phối xuất hàng tự động tối ưu hạn dùng</span>
          </div>
          <h1>Nghiệp Vụ Xuất Kho &amp; FEFO (Outbound Fulfillment)</h1>
          <p>Xuất hàng tự động theo thuật toán First Expired, First Out (lô cận date xuất trước). Hỗ trợ xuất bán hàng cho đại lý, điều chuyển nội bộ và xử lý hàng hư hỏng.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setForm({ id: '', exportType: 'SALE', note: '', customerId: '', items: [] }); setIsFormOpen(true); }}>
            ✨ Lập Phiếu Xuất Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Phiếu Xuất Kho"
          value={meta.total || items.length}
          unit="lệnh xuất"
          trend="↑ Điều phối picking"
          status="success"
          icon="📤"
        />
        <StatKPI
          title="Chờ Duyệt Xuất (Pending)"
          value={pendingCount}
          unit="phiếu chờ"
          trend={pendingCount > 0 ? 'Cần kích hoạt FEFO Engine' : 'Đã điều phối hết'}
          status={pendingCount > 0 ? 'warning' : 'success'}
          icon="⚡"
        />
        <StatKPI
          title="Đã Xuất Kho Hoàn Tất"
          value={approvedCount}
          unit="lệnh thành công"
          trend="FEFO đã trích lô chuẩn xác"
          status="success"
          icon="✔"
        />
        <StatKPI
          title="Thuật Toán Phân Bổ"
          value="FEFO AI"
          unit="active"
          trend="Khấu trừ lô cận date trước"
          status="info"
          icon="🤖"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="exports-layout-grid">
        {/* Table Container */}
        <div className="exports-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm mã phiếu xuất (VD: EXP-2026), khách hàng..."
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
                  <th>Mã Phiếu &amp; Ngày xuất</th>
                  <th>Phân loại &amp; Khách hàng</th>
                  <th>Trạng thái</th>
                  <th>Người thẩm định</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang đồng bộ danh sách phiếu xuất kho từ cloud..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Chưa có phiếu xuất kho nào được tạo" />
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
                        <td>
                          <span className="status-pill info" style={{ fontSize: '0.72rem', padding: '2px 8px', marginBottom: 4 }}>
                            {translateExportType(item.exportType)}
                          </span>
                          {item.customer ? (
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>🧑‍💼 {item.customer.name}</div>
                          ) : (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Xuất nội bộ / Khác</div>
                          )}
                          {item.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>Ghi chú: {item.note}</div>}
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
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            {item.status === 'PENDING' ? (
                              <>
                                <button type="button" className="status-pill success" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => approveExport(item.id)}>
                                  ✔ Duyệt
                                </button>
                                <button type="button" className="status-pill danger" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => rejectExport(item.id)}>
                                  ✕ Từ chối
                                </button>
                              </>
                            ) : (
                              <button 
                                type="button" 
                                className="status-pill info" 
                                style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }}
                                onClick={() => setSelectedInvoice(item)}
                              >
                                🧾 In Hóa Đơn
                              </button>
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
        title="Xuất Hàng FEFO"
        subtitle="Lập Phiếu Xuất Kho &amp; FEFO Engine"
        width="680px"
      >
        <div className="exports-side-form">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Loại nghiệp vụ xuất *</label>
              <select className="select-field" value={form.exportType} onChange={(e) => setForm((p) => ({ ...p, exportType: e.target.value }))} required>
                <option value="SALE">🛍️ Xuất Bán hàng cho Đại lý</option>
                <option value="INTERNAL">🏢 Xuất Nội bộ / Tiêu hao chi nhánh</option>
                <option value="DAMAGED">🗑️ Hủy hàng Hư hỏng/Hết date</option>
                <option value="TRANSFER">🔄 Điều chuyển sang chi nhánh khác</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Ghi chú / Số lệnh xuất</label>
              <input
                className="input-field"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="VD: Xuất theo lệnh số LX-09..."
              />
            </div>

            {form.exportType === 'SALE' && (
              <div className="form-group full-width">
                <label>Khách hàng / Đại lý nhận hàng *</label>
                <select className="select-field" value={form.customerId} onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))} required>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Products Dynamic List */}
            <div className="form-group full-width" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f43f5e' }}>📦 Sản phẩm xuất kho</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hệ thống tự động trích lô cận date (FEFO Engine)</span>
                </div>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={addItem}>
                  + Thêm dòng xuất
                </button>
              </div>

              {form.items.length === 0 ? (
                <div style={{ background: 'var(--bg-glass)', border: '1px dashed var(--border-subtle)', padding: '24px', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa chọn sản phẩm xuất. Nhấp "+ Thêm dòng xuất" hoặc quét mã QR để bắt đầu.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {form.items.map((item, index) => (
                    <div key={index} className="export-item-card">
                      <div className="export-item-header">
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fb7185' }}># Dòng xuất {index + 1}</span>
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
                              <option key={p.id} value={p.id}>{p.sku} - {p.name} (Tồn khả dụng: {p.currentStock} {p.unit})</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Số lượng yêu cầu xuất *</label>
                          <input type="number" min="1" className="input-field" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Đơn giá xuất (VNĐ) *</label>
                          <input type="number" min="0" step="0.01" className="input-field" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue & Profit Summary */}
            {(() => {
              const totalRev = form.items.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0)
              const totalCost = form.items.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.costPrice || i.unitPrice * 0.7 || 0)), 0)
              const estProfit = totalRev - totalCost
              const marginPct = totalRev > 0 ? Math.round((estProfit / totalRev) * 100) : 0

              if (form.exportType !== 'SALE' || form.items.length === 0) return null

              return (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '16px 20px', borderRadius: '16px', marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>🛍️ Tổng Doanh Thu Đơn Xuất Bán:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{totalRev.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>📈 Lợi Nhuận Gộp Dự Kiến:</span>
                    <strong style={{ color: '#059669', fontSize: '1.1rem' }}>+{estProfit.toLocaleString('vi-VN')} đ ({marginPct}%)</strong>
                  </div>
                </div>
              )
            })()}

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving || form.items.length === 0}>
                {saving ? '⏳ Đang xử lý...' : '🚀 Hoàn Tất Lệnh Xuất Kho'}
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

      {/* Printable Sales Invoice Modal — paper stays white for printing */}
      {selectedInvoice && (
        <div className="invoice-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header no-print">
              <h3>🧾 Hóa Đơn Xuất Bán Hàng (Sales Receipt)</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-primary" onClick={() => window.print()}>
                  🖨️ In Hóa Đơn A4
                </button>
                <button type="button" className="btn-secondary" onClick={() => setSelectedInvoice(null)}>
                  ✕ Đóng
                </button>
              </div>
            </div>

            <div className="printable-invoice-paper">
              <div className="invoice-paper-header">
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b', fontWeight: 800 }}>STOCKINSIGHT WMS</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Hệ Thống Quản Lý Kho &amp; Bán Hàng Doanh Nghiệp</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#4f46e5' }}>HÓA ĐƠN BÁN HÀNG</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Mã: {selectedInvoice.code}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Ngày: {new Date(selectedInvoice.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

              <div className="invoice-paper-info-grid">
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Đơn vị xuất hàng:</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Tổng Kho WMS Enterprise</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#475569' }}>Người lập phiếu: {selectedInvoice.createdBy?.name || 'Nhân viên bán hàng'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Khách hàng nhận hàng:</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    {selectedInvoice.customer ? selectedInvoice.customer.name : 'Khách hàng lẻ'}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#475569' }}>
                    SĐT: {selectedInvoice.customer?.phone || 'Chưa cập nhật'} | ĐC: {selectedInvoice.customer?.address || 'Tại kho'}
                  </p>
                </div>
              </div>

              <table className="printable-invoice-table" style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.82rem', color: '#334155' }}>STT</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.82rem', color: '#334155' }}>Sản phẩm / SKU</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.82rem', color: '#334155' }}>SL</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.82rem', color: '#334155' }}>Đơn giá</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.82rem', color: '#334155' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                    selectedInvoice.items.map((item, idx) => {
                      const lineTotal = Number(item.quantity) * Number(item.unitPrice)
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#475569' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                            {item.product?.name || 'Sản phẩm kinh doanh'}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>SKU: {item.product?.sku}</span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{item.quantity}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>{Number(item.unitPrice).toLocaleString('vi-VN')} đ</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{lineTotal.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Phiếu xuất tiêu chuẩn</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  <p style={{ margin: 0 }}>* Hóa đơn xuất theo quy trình kiểm tra FEFO tự động.</p>
                  <p style={{ margin: '2px 0 0 0' }}> Cảm ơn quý khách đã tin tưởng và hợp tác!</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    Tổng Cộng Thanh Toán: {((selectedInvoice.items || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0)).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', fontSize: '0.85rem', color: '#475569' }}>
                <div>
                  <strong>Người Lập Phiếu</strong>
                  <div style={{ height: 50 }} />
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.78rem' }}>(Ký &amp; ghi rõ họ tên)</p>
                </div>
                <div>
                  <strong>Thủ Kho Xuất Hàng</strong>
                  <div style={{ height: 50 }} />
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.78rem' }}>(Ký &amp; ghi rõ họ tên)</p>
                </div>
                <div>
                  <strong>Khách Hàng Nhận Hàng</strong>
                  <div style={{ height: 50 }} />
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.78rem' }}>(Ký &amp; ghi rõ họ tên)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
