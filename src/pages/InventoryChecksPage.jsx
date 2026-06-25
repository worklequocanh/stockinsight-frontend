import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateCheckStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

export default function InventoryChecksPage() {
  const [items, setItems] = useState([])
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
  }, [search, page])

  async function handleCreate() {
    setSaving(true)
    setError('')
    try {
      await api.post('/inventory-checks', {
        note: selectedProductIds.length > 0 ? `Kiểm kê ${selectedProductIds.length} sản phẩm` : 'Kiểm kê toàn bộ kho',
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
      setError(parseApiError(err, 'Lỗi khi cập nhật số liệu'))
    } finally {
      setUpdatingItems(false)
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('Chốt phiếu kiểm kê này? Hệ thống sẽ tự động cân bằng tồn kho.')) return
    try {
      await api.put(`/inventory-checks/${id}/approve`)
      if (detail?.id === id) await handleViewDetail(id)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi chốt phiếu'))
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Hủy phiếu kiểm kê này?')) return
    try {
      await api.put(`/inventory-checks/${id}/cancel`)
      if (detail?.id === id) setDetail(null)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi hủy phiếu'))
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

  // Compute diff preview for items being edited
  function getDiffPreview(item) {
    const raw = item._actualQty
    if (raw === undefined || raw === null || raw === '') return null
    const val = Number(raw)
    return val - item.systemQty
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Kiểm kê kho</h1>
        <p className="hero-copy">Tạo và quản lý các đợt kiểm kê định kỳ</p>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {/* Danh sách phiếu kiểm kê */}
      <section className="resource-panel">
        <div className="resource-header">
          <div>
            <p className="section-label">Nghiệp vụ</p>
            <h2>Danh sách phiếu kiểm kê</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => setCreating(true)}>
            Tạo phiếu mới
          </button>
        </div>

        <div className="filter-row">
          <input
            className="field-input"
            placeholder="Tìm theo mã phiếu"
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Trạng thái</th>
                <th>Người tạo</th>
                <th>Ghi chú</th>
                <th style={{ width: '180px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmpty colSpan={5} text="Đang tải dữ liệu..." />
              ) : items.length === 0 ? (
                <TableEmpty colSpan={5} text="Không tìm thấy phiếu kiểm kê nào" />
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Mã phiếu">
                      <strong>{item.code}</strong>
                      <div className="muted-line">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td data-label="Trạng thái">
                      <span className={`badge badge--${item.status.toLowerCase()}`}>
                        {translateCheckStatus(item.status)}
                      </span>
                    </td>
                    <td data-label="Người tạo">{item.createdBy?.name || '-'}</td>
                    <td data-label="Ghi chú">{item.note || '-'}</td>
                    <td data-label="Thao tác" className="actions-cell">
                      <button type="button" className="text-button" onClick={() => handleViewDetail(item.id)}>Xem chi tiết</button>
                      {(item.status === 'DRAFT' || item.status === 'IN_PROGRESS') && (
                        <button type="button" className="text-button" onClick={() => handleApprove(item.id)}>Chốt</button>
                      )}
                      {item.status !== 'COMPLETED' && item.status !== 'CANCELED' && (
                        <button type="button" className="text-button danger" onClick={() => handleCancel(item.id)}>Hủy</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={setPage} loading={loading} />
      </section>

      {/* Panel Tạo phiếu mới */}
      {creating && (
        <section className="resource-panel" style={{ marginTop: '24px' }}>
          <div className="resource-header">
            <div>
              <p className="section-label">Tạo phiếu</p>
              <h2>Phiếu kiểm kê mới</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => { setCreating(false); setSelectedProductIds([]) }}>
              Đóng
            </button>
          </div>

          <p className="muted-line">
            {selectedProductIds.length === 0
              ? 'Để trống để kiểm kê toàn bộ kho. Hoặc chọn sản phẩm cần kiểm:'
              : `Đã chọn ${selectedProductIds.length}/${products.length} sản phẩm`}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <button type="button" className="text-button" onClick={selectAll}>
              {selectedProductIds.length === products.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div className="check-product-grid">
            {products.map(p => (
              <label
                key={p.id}
                className={`check-product-chip ${selectedProductIds.includes(p.id) ? 'check-product-chip--active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  style={{ display: 'none' }}
                />
                <span className="check-chip-label">{p.sku} — {p.name}</span>
              </label>
            ))}
          </div>

          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="primary-button" onClick={handleCreate} disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
            </button>
          </div>
        </section>
      )}

      {/* Chi tiết phiếu kiểm kê */}
      {detailLoading && (
        <p className="muted-line" style={{ marginTop: '24px', textAlign: 'center' }}>Đang tải chi tiết phiếu...</p>
      )}

      {detail && (
        <section className="resource-panel" style={{ marginTop: '24px' }}>
          <div className="resource-header">
            <div>
              <p className="section-label">Chi tiết phiếu</p>
              <h2>{detail.code}</h2>
              <div className="muted-line">
                Tạo bởi {detail.createdBy?.name} — {new Date(detail.createdAt).toLocaleString()}
                {detail.note && <> — {detail.note}</>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge badge--${detail.status.toLowerCase()}`}>
                {translateCheckStatus(detail.status)}
              </span>
              <button type="button" className="secondary-button" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Lô / HSD</th>
                  <th style={{ width: '90px' }}>Hệ thống</th>
                  <th style={{ width: '110px' }}>Thực tế</th>
                  <th style={{ width: '100px' }}>Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {detail.items?.map((item) => {
                  const diff = getDiffPreview(item)
                  return (
                    <tr key={item.id}>
                      <td data-label="Sản phẩm">
                        <strong>{item.product?.sku}</strong>
                        <div className="muted-line">{item.product?.name}</div>
                      </td>
                      <td data-label="Lô / HSD">
                        {item.batch ? (
                          <>
                            <div>{item.batch.lotNumber}</div>
                            <div className="muted-line">HSD: {new Date(item.batch.expiryDate).toLocaleDateString()}</div>
                            {item.batch.location && (
                              <div className="muted-line">Vị trí: {item.batch.location.code}</div>
                            )}
                          </>
                        ) : (
                          <span className="muted-line">—</span>
                        )}
                      </td>
                      <td data-label="Hệ thống" style={{ textAlign: 'center', fontWeight: '600' }}>
                        {item.systemQty}
                      </td>
                      <td data-label="Thực tế">
                        {(detail.status === 'DRAFT' || detail.status === 'IN_PROGRESS') ? (
                          <input
                            type="number"
                            min="0"
                            className="field-input check-qty-input"
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
                          item.actualQty !== null ? item.actualQty : <span className="muted-line">—</span>
                        )}
                      </td>
                      <td data-label="Chênh lệch" style={{ textAlign: 'center' }}>
                        {diff !== null ? (
                          <span className={`diff-badge ${diff > 0 ? 'diff-badge--surplus' : diff < 0 ? 'diff-badge--shortage' : ''}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        ) : item.difference !== null && item.difference !== undefined ? (
                          <span className={`diff-badge ${item.difference > 0 ? 'diff-badge--surplus' : item.difference < 0 ? 'diff-badge--shortage' : ''}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </span>
                        ) : (
                          <span className="muted-line">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(detail.status === 'DRAFT' || detail.status === 'IN_PROGRESS') && (
            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="primary-button" onClick={handleUpdateItems} disabled={updatingItems}>
                {updatingItems ? 'Đang lưu...' : 'Lưu số liệu thực tế'}
              </button>
              <button type="button" className="secondary-button" onClick={() => handleApprove(detail.id)} disabled={updatingItems}>
                Chốt kiểm kê
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
