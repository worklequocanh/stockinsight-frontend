import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

export default function ImportsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ id: '', supplierId: '', note: '', items: [] })

  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    api.get('/suppliers?limit=100').then(res => setSuppliers(res.data?.data?.items || []))
    api.get('/products?limit=100').then(res => setProducts(res.data?.data?.items || []))
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
        items: form.items,
      })
      setForm({ id: '', supplierId: '', note: '', items: [] })
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tạo phiếu nhập'))
    } finally {
      setSaving(false)
    }
  }

  async function approveImport(id) {
    if (!window.confirm('Duyệt phiếu nhập này? Tồn kho sẽ được cập nhật và không thể hoàn tác.')) return
    try {
      await api.post(`/imports/${id}/approve`)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi duyệt phiếu nhập'))
    }
  }

  async function rejectImport(id) {
    const reason = window.prompt('Lý do từ chối:')
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
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0, lotNumber: '', expiryDate: '' }]
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Nhập kho</h1>
        <p className="hero-copy">Quản lý các lô hàng nhập vào kho</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Kho hàng</p>
              <h2>Danh sách phiếu nhập</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm({ id: '', supplierId: '', note: '', items: [] })}>
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

          {error && <p className="error-banner">{error}</p>}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Nhà cung cấp</th>
                  <th>Trạng thái</th>
                  <th>Người xử lý</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="Đang tải dữ liệu..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="Không tìm thấy phiếu nhập nào" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Mã phiếu">
                        <strong>{item.code}</strong>
                        <div className="muted-line">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td data-label="Nhà cung cấp">{item.supplier?.name || '-'}</td>
                      <td data-label="Trạng thái">
                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                          {translateStatus(item.status)}
                        </span>
                        {item.rejectedReason && <div className="muted-line">{item.rejectedReason}</div>}
                      </td>
                      <td data-label="Người xử lý">
                        <div>Tạo bởi: {item.createdBy?.name || '-'}</div>
                        {item.approvedBy && <div className="muted-line">Duyệt bởi: {item.approvedBy.name}</div>}
                      </td>
                      <td data-label="Thao tác" className="actions-cell">
                        {item.status === 'PENDING' && (
                          <>
                            <button type="button" className="text-button" onClick={() => approveImport(item.id)}>Duyệt</button>
                            <button type="button" className="text-button danger" onClick={() => rejectImport(item.id)}>Từ chối</button>
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
              <p className="section-label">Tạo phiếu nhập</p>
              <h2>Nhập kho mới</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Nhà cung cấp
              <select className="field-select" value={form.supplierId} onChange={(e) => setForm(prev => ({ ...prev, supplierId: e.target.value }))} required>
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              Ghi chú
              <input className="field-input" value={form.note} onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))} />
            </label>

            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Sản phẩm</h3>
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
                        <label>Giá nhập <input type="number" min="0" step="0.01" className="field-input" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} required /></label>
                      </div>

                      <div className="two-col">
                        <label>Số lô <input className="field-input" value={item.lotNumber} onChange={(e) => updateItem(index, 'lotNumber', e.target.value)} required /></label>
                        <label>HSD <input type="date" className="field-input" value={item.expiryDate} onChange={(e) => updateItem(index, 'expiryDate', e.target.value)} required /></label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving || form.items.length === 0}>
                {saving ? 'Đang lưu...' : 'Tạo phiếu nhập'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
