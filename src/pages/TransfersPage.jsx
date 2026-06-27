import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateStatus } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import QRScannerModal from '../components/QRScannerModal'

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
  const [batches, setBatches] = useState([])

  useEffect(() => {
    api.get('/products?limit=100').then(res => setProducts(res.data?.data?.items || []))
    api.get('/locations?limit=100').then(res => setLocations(res.data?.data?.items || []))
    api.get('/reports/inventory').then(res => {
      // In the current architecture, we might not have a direct endpoint for batches easily
      // A workaround is to fetch products with their batches or use a specific batch endpoint.
      // Assuming /reports/inventory returns batches with products. Let's see later.
      // But actually, we only need batches for selected products. Let's load batches when product changes.
    }).catch(err => console.error(err))
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

  async function loadBatchesForProduct(productId) {
    try {
      // To get batches for a product, we could query /exports endpoint logic or directly.
      // Actually we will use a workaround: The backend doesn't have a direct /batches endpoint yet?
      // Wait, let's just make the user input lot number or we can fetch a product by id to get its batches.
      const res = await api.get(`/products/${productId}`);
      const productBatches = res.data?.data?.item?.stockBatches || [];
      // we need a new way to get batches.
    } catch (err) {
      console.error(err);
    }
  }

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
    if (!window.confirm('Duyệt phiếu chuyển kho này? Tồn kho sẽ được cập nhật và không thể hoàn tác.')) return
    try {
      await api.post(`/transfers/${id}/approve`)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi duyệt phiếu'))
    }
  }

  async function rejectTransfer(id) {
    const reason = window.prompt('Lý do từ chối:')
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
        alert('Không tìm thấy sản phẩm với mã này!')
      }
    } catch (err) {
      alert(parseApiError(err, 'Lỗi tìm kiếm sản phẩm'))
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Chuyển kho</h1>
        <p className="hero-copy">Quản lý điều chuyển hàng hóa giữa các vị trí</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Danh sách</p>
              <h2>Phiếu chuyển kho</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm({ id: '', note: '', items: [] })}>
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
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                  <th>Người xử lý</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="Đang tải dữ liệu..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="Không tìm thấy phiếu nào" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Mã phiếu">
                        <strong>{item.code}</strong>
                        <div className="muted-line">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td data-label="Ghi chú">{item.note || '-'}</td>
                      <td data-label="Trạng thái">
                        <span className={`badge badge--${item.status.toLowerCase()}`}>
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
                            <button type="button" className="text-button" onClick={() => approveTransfer(item.id)}>Duyệt</button>
                            <button type="button" className="text-button danger" onClick={() => rejectTransfer(item.id)}>Từ chối</button>
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
              <p className="section-label">Tạo phiếu điều chuyển</p>
              <h2>Chuyển kho mới</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Ghi chú
              <input className="field-input" value={form.note} onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))} placeholder="Lý do chuyển kho..." />
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
                        <div>
                          <button type="button" className="text-button" onClick={() => openScanner(index)} style={{ marginRight: '10px' }}>📷 Quét QR</button>
                          <button type="button" className="text-button danger" onClick={() => removeItem(index)}>Xóa</button>
                        </div>
                      </div>
                      
                      <select className="field-select" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} required style={{ marginBottom: '0.5rem' }}>
                        <option value="">Chọn sản phẩm</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                      </select>

                      <div className="two-col" style={{ marginBottom: '0.5rem' }}>
                        <label>Vị trí từ <select className="field-select" value={item.fromLocationId} onChange={(e) => updateItem(index, 'fromLocationId', e.target.value)} required><option value="">Chọn vị trí từ</option>{locations.map(loc => <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>)}</select></label>
                        <label>Vị trí đến <select className="field-select" value={item.toLocationId} onChange={(e) => updateItem(index, 'toLocationId', e.target.value)} required><option value="">Chọn vị trí đến</option>{locations.map(loc => <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>)}</select></label>
                      </div>

                      <div className="two-col" style={{ marginBottom: '0.5rem' }}>
                        <label>Lô hàng ID (Tạm thời nhập thủ công) <input type="text" className="field-input" value={item.fromBatchId} onChange={(e) => updateItem(index, 'fromBatchId', e.target.value)} required placeholder="VD: batch-id..." /></label>
                        <label>Số lượng <input type="number" min="1" className="field-input" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required /></label>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving || form.items.length === 0}>
                {saving ? 'Đang lưu...' : 'Tạo phiếu chuyển kho'}
              </button>
            </div>
          </form>
        </aside>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  )
}
