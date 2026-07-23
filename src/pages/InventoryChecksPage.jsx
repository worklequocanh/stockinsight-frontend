import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateCheckStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import './InventoryChecksPage.css'
import { useToast } from '../context/ToastContext'

export default function InventoryChecksPage() {
  const [items, setItems] = useState([])
  const { showToast } = useToast()
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingItems, setUpdatingItems] = useState(false)

  useEffect(() => {
    api.get('/products?limit=200').then(res => setProducts(res.data?.data?.items || []))
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/inventory-checks?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách phiếu kiểm kê'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ search, page })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page])

  async function handleCreate() {
    setSaving(true)
    setError('')
    try {
      await api.post('/inventory-checks', {
        note: selectedProductIds.length > 0 ? `Kiểm kê theo chỉ định ${selectedProductIds.length} sản phẩm` : 'Kiểm kê định kỳ toàn bộ kho hàng',
        productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      })
      setSelectedProductIds([])
      setCreating(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu kiểm kê'))
    } finally {
      setSaving(false)
    }
  }

  async function handleViewDetail(id) {
    setDetailLoading(true)
    setError('')
    try {
      const res = await api.get(`/inventory-checks/${id}`)
      setDetail(res.data?.data?.item || null)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải chi tiết phiếu'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleUpdateItems() {
    if (!detail) return
    setUpdatingItems(true)
    setError('')
    try {
      const payload = {
        items: detail.items.map(i => ({
          id: i.id,
          actualQty: i._actualQty !== undefined ? Number(i._actualQty) : null,
        })),
      }
      await api.put(`/inventory-checks/${detail.id}/items`, payload)
      await handleViewDetail(detail.id)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi cập nhật số liệu kiểm kê'))
    } finally {
      setUpdatingItems(false)
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('⚡ Chốt đợt kiểm kê này? Hệ thống AI se tự động tạo các bút toán chênh lệch (cộng/trừ tồn kho tự động theo số đếm thực tế) và khóa sổ đợt kiểm kê này!')) return
    try {
      await api.put(`/inventory-checks/${id}/approve`)
      showToast('Đã chốt kiểm kê thành công!', 'success')
      if (detail?.id === id) await handleViewDetail(id)
      await loadData({ search, page })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi chốt phiếu')
      setError(msg)
      showToast(msg, 'error')
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Hủy đợt kiểm kê này?')) return
    try {
      await api.put(`/inventory-checks/${id}/cancel`)
      showToast('Đã hủy đợt kiểm kê.', 'info')
      if (detail?.id === id) setDetail(null)
      await loadData({ search, page })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi hủy phiếu')
      setError(msg)
      showToast(msg, 'error')
    }
  }

  function toggleProduct(productId) {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  function selectAll() {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(products.map(p => p.id))
    }
  }

  function getDiffPreview(item) {
    const raw = item._actualQty
    if (raw === undefined || raw === null || raw === '') return null
    const val = Number(raw)
    return val - item.systemQty
  }

  const draftCount = items.filter(i => i.status === 'DRAFT' || i.status === 'IN_PROGRESS').length
  const completedCount = items.filter(i => i.status === 'COMPLETED').length

  return (
    <div className="checks-container">
      {/* Hero Header */}
      <div className="checks-hero">
        <div className="checks-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● INVENTORY AUDIT & RECONCILIATION</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Cân bằng chênh lệch tồn kho thực tế</span>
          </div>
          <h1>Đối Soát & Kiểm Kê Kho (Inventory Auditing)</h1>
          <p>Tạo các đợt kiểm kê định kỳ toàn bộ kho hoặc theo chỉ định từng SKU. Ghi nhận số lượng thực tế tại kệ, tự động tính toán chênh lệch và chốt cân bằng tồn kho.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setCreating(true); setDetail(null); }}>
            📋 Khởi Tạo Đợt Kiểm Kê
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Đợt Kiểm Kê"
          value={meta.total || items.length}
          unit="đợt"
          trend="↑ Đối soát định kỳ"
          status="success"
          icon="📋"
        />
        <StatKPI
          title="Đang Đếm / Khai Báo"
          value={draftCount}
          unit="phiếu active"
          trend={draftCount > 0 ? 'Đang cập nhật số liệu' : 'Tất cả đã chốt sổ'}
          status={draftCount > 0 ? 'warning' : 'success'}
          icon="🔍"
        />
        <StatKPI
          title="Đã Chốt Cân Bằng"
          value={completedCount}
          unit="đợt hoàn tất"
          trend="Cộng/trừ tự động"
          status="success"
          icon="✔"
        />
        <StatKPI
          title="Thuật Toán Đối Soát"
          value="AI Balance"
          unit="active"
          trend="Chuẩn hóa sai số 0%"
          status="info"
          icon="⚖️"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      {/* Main Table View */}
      <div className="checks-main-card">
        <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div className="table-search" style={{ flex: 1 }}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              placeholder="Tìm theo mã đợt kiểm kê (VD: CHK-2026), ghi chú..."
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
                <th>Mã Đợt Kiểm & Ngày lập</th>
                <th>Phạm vi / Ghi chú</th>
                <th>Trạng thái</th>
                <th>Người khởi tạo</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmpty colSpan={5} text="⏳ Đang đồng bộ dữ liệu kiểm kê từ cloud..." />
              ) : items.length === 0 ? (
                <TableEmpty colSpan={5} text="❌ Chưa có đợt kiểm kê kho nào được tạo" />
              ) : (
                items.map((item) => {
                  const statusClass = item.status === 'COMPLETED' ? 'success' : item.status === 'CANCELED' ? 'danger' : 'info'
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.code}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--brand-400)' }}>
                          📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>
                        {item.note || <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>Kiểm kê định kỳ toàn bộ kho</span>}
                      </td>
                      <td>
                        <span className={`status-pill ${statusClass}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                          {translateCheckStatus(item.status)}
                        </span>
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                        👤 {item.createdBy?.name || '-'}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button type="button" className="status-pill info" style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontWeight: 700 }} onClick={() => { handleViewDetail(item.id); setCreating(false); }}>
                            🔍 Xem & Nhập số liệu
                          </button>
                          {(item.status === 'DRAFT' || item.status === 'IN_PROGRESS') && (
                            <button type="button" className="status-pill success" style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontWeight: 700 }} onClick={() => handleApprove(item.id)}>
                              ✔ Chốt Cân Bằng
                            </button>
                          )}
                          {item.status !== 'COMPLETED' && item.status !== 'CANCELED' && (
                            <button type="button" className="icon-btn delete" title="Hủy phiếu" onClick={() => handleCancel(item.id)}>
                              🗑️
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

      {/* Creation Drawer / Panel */}
      <SidePanel
        isOpen={creating}
        onClose={() => { setCreating(false); setSelectedProductIds([]); }}
        title="📋 THIẾT LẬP ĐỢT KIỂM KÊ"
        subtitle="Tạo Phiếu Kiểm Kê Mới"
        width="600px"
      >
        <div style={{ padding: '8px 0' }}>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 16 }}>
              {selectedProductIds.length === 0
                ? '💡 Mặc định: Để trống lựa chọn bên dưới nếu bạn muốn kiểm kê TOÀN BỘ SẢN PHẨM trong kho. Hoặc chọn các SKU cụ thể bên dưới:'
                : `🎯 Đã chọn chỉ định ${selectedProductIds.length}/${products.length} sản phẩm để kiểm kê:`}
            </p>

            <div style={{ marginBottom: 16 }}>
              <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={selectAll}>
                {selectedProductIds.length === products.length ? '☑️ Bỏ chọn tất cả' : '☑️ Chọn tất cả SKU'}
              </button>
            </div>

            <div className="product-select-grid">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className="product-select-item"
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, var(--info-bg), rgba(14, 165, 233, 0.2))' : 'var(--bg-glass)',
                      border: isSelected ? '1px solid var(--brand-400)' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--brand-400)', width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', color: isSelected ? '#fff' : '#cbd5e1', fontWeight: isSelected ? 700 : 400 }}>
                      <strong>{p.sku}</strong> — {p.name}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn-primary" onClick={handleCreate} disabled={saving} style={{ flex: 1 }}>
                {saving ? '⏳ Đang khởi tạo...' : '🚀 Phát Hành Phiếu Kiểm Kê'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setCreating(false); setSelectedProductIds([]); }}>
                Hủy
              </button>
            </div>
        </div>
      </SidePanel>

      {/* Detail Worksheet Panel */}
      <SidePanel
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="🔍 BẢNG ĐỐI SOÁT CHI TIẾT"
        subtitle={`Phiếu ${detail?.code || ''}`}
        width="840px"
      >
        {detail && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tạo bởi {detail.createdBy?.name} lúc {new Date(detail.createdAt).toLocaleString('vi-VN')} {detail.note && `(${detail.note})`}
              </div>
              <span className={`status-pill ${detail.status === 'COMPLETED' ? 'success' : 'info'}`} style={{ fontSize: '0.85rem' }}>
                {translateCheckStatus(detail.status)}
              </span>
            </div>

            <div className="modern-table-wrapper" style={{ maxHeight: 450, overflowY: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Sản phẩm SKU</th>
                    <th>Lô hàng / Vị trí kệ</th>
                    <th style={{ textAlign: 'center' }}>Tồn Hệ Thống</th>
                    <th style={{ textAlign: 'center', width: 160 }}>Tồn Thực Tế Đếm</th>
                    <th style={{ textAlign: 'center' }}>Chênh Lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLoading ? (
                    <TableEmpty colSpan={5} text="⏳ Đang tải số liệu kiểm kê chi tiết..." />
                  ) : detail.items?.map((item) => {
                    const diff = getDiffPreview(item)
                    const isDiff = diff !== null && diff !== 0
                    const diffClass = (diff ?? item.difference) > 0 ? 'success' : (diff ?? item.difference) < 0 ? 'danger' : 'info'
                    return (
                      <tr key={item.id} style={{ background: isDiff ? 'rgba(251, 113, 133, 0.04)' : 'transparent' }}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>{item.product?.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--brand-400)' }}>SKU: {item.product?.sku}</span>
                        </td>
                        <td>
                          {item.batch ? (
                            <>
                              <strong style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>Lot: {item.batch.lotNumber}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HSD: {new Date(item.batch.expiryDate).toLocaleDateString('vi-VN')}</div>
                              {item.batch.location && <span className="status-pill info" style={{ fontSize: '0.68rem', padding: '1px 6px', marginTop: 2 }}>📍 {item.batch.location.code}</span>}
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>Tồn chung SKU</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: 'var(--brand-400)' }}>
                          {item.systemQty}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {(detail.status === 'DRAFT' || detail.status === 'IN_PROGRESS') ? (
                            <input
                              type="number"
                              min="0"
                              className="input-field"
                              style={{ width: 110, textAlign: 'center', fontWeight: 700, padding: '6px 10px' }}
                              placeholder="Nhập số..."
                              value={item._actualQty !== undefined ? item._actualQty : (item.actualQty !== null ? item.actualQty : '')}
                              onChange={(e) => {
                                const val = e.target.value
                                const newItems = detail.items.map(i =>
                                  i.id === item.id ? { ...i, _actualQty: val === '' ? '' : Number(val) } : i
                                )
                                setDetail({ ...detail, items: newItems })
                              }}
                            />
                          ) : (
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                              {item.actualQty !== null ? item.actualQty : 'Chưa đếm'}
                            </strong>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {diff !== null ? (
                            <span className={`status-pill ${diffClass}`} style={{ fontWeight: 800, fontSize: '0.88rem', padding: '4px 12px' }}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          ) : item.difference !== null && item.difference !== undefined ? (
                            <span className={`status-pill ${item.difference > 0 ? 'success' : item.difference < 0 ? 'danger' : 'info'}`} style={{ fontWeight: 800, fontSize: '0.88rem', padding: '4px 12px' }}>
                              {item.difference > 0 ? `+${item.difference}` : item.difference}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {(detail.status === 'DRAFT' || detail.status === 'IN_PROGRESS') && (
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn-primary" onClick={handleUpdateItems} disabled={updatingItems} style={{ flex: 1 }}>
                  {updatingItems ? '⏳ Đang lưu...' : '💾 Lưu Số Liệu Thực Tế'}
                </button>
                <button type="button" className="btn-secondary" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)' }} onClick={() => handleApprove(detail.id)} disabled={updatingItems}>
                  ✔ Chốt Cân Bằng Kho
                </button>
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </div>
  )
}
