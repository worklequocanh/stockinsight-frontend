import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateReturnStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const QUALITY_OPTIONS = ['Mới', 'Tốt', 'Hư hỏng', 'Mất niêm phong']

export default function ReturnsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ reason: '', originalExportId: '', items: [] })

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
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu trả'))
    } finally {
      setSaving(false)
    }
  }

  async function handleProcess(id, action) {
    const label = action === 'RETURNED_TO_STOCK' ? 'nhập lại kho' : 'tiêu hủy'
    if (!window.confirm(`Xác nhận ${label} phiếu trả hàng này?`)) return
    try {
      await api.put(`/returns/${id}/process`, { action })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xử lý phiếu trả'))
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Trả hàng</h1>
        <p className="hero-copy">Quản lý hàng hóa khách trả lại</p>
      </div>

      {error && <p className="error-banner" style={{ marginBottom: '1rem' }}>{error}</p>}

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Nghiệp vụ</p>
              <h2>Danh sách phiếu trả</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm({ reason: '', originalExportId: '', items: [] })}>
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
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Người tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="Đang tải dữ liệu..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="Không tìm thấy phiếu trả nào" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Mã phiếu">
                        <strong>{item.code}</strong>
                        <div className="muted-line">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td data-label="Lý do">{item.reason}</td>
                      <td data-label="Trạng thái">
                        <span className={`badge badge--${item.status.toLowerCase()}`}>
                          {translateReturnStatus(item.status)}
                        </span>
                      </td>
                      <td data-label="Người tạo">{item.createdBy?.name || '-'}</td>
                      <td data-label="Thao tác" className="actions-cell">
                        {item.status === 'PENDING' && (
                          <>
                            <button type="button" className="text-button" onClick={() => handleProcess(item.id, 'RETURNED_TO_STOCK')}>
                              Nhập lại kho
                            </button>
                            <button type="button" className="text-button danger" onClick={() => handleProcess(item.id, 'DISCARDED')}>
                              Tiêu hủy
                            </button>
                          </>
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

        <aside className="resource-panel form-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Tạo phiếu trả</p>
              <h2>Phiếu trả mới</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Lý do trả hàng
              <textarea className="field-textarea" rows="2" value={form.reason} onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))} required placeholder="VD: Hàng hư hỏng, sai quy cách..." />
            </label>
            <label>
              Mã phiếu xuất gốc (tuỳ chọn)
              <input className="field-input" value={form.originalExportId} onChange={(e) => setForm(prev => ({ ...prev, originalExportId: e.target.value }))} placeholder="Nhập mã phiếu xuất bán gốc" />
            </label>

            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Sản phẩm trả</h3>
                <button type="button" className="text-button" onClick={addItem}>+ Thêm sản phẩm</button>
              </div>
              
              {form.items.length === 0 ? (
                <div className="muted-line">Chưa có sản phẩm nào.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {form.items.map((item, index) => (
                    <div key={index} style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>Sản phẩm {index + 1}</strong>
                        <button type="button" className="text-button danger" onClick={() => removeItem(index)}>Xóa</button>
                      </div>
                      
                      <select className="field-select" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} required style={{ marginBottom: '0.5rem' }}>
                        <option value="">Chọn sản phẩm</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                      </select>

                      <div className="two-col" style={{ marginBottom: '0.5rem' }}>
                        <label>Số lượng <input type="number" min="1" className="field-input" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required /></label>
                        <label>
                          Tình trạng
                          <select className="field-select" value={item.qualityStatus} onChange={(e) => updateItem(index, 'qualityStatus', e.target.value)}>
                            {QUALITY_OPTIONS.map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving || form.items.length === 0}>
                {saving ? 'Đang lưu...' : 'Tạo phiếu trả'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
