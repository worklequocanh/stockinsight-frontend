import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
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
      setError(parseApiError(err, 'Failed to load imports'))
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
      setError(parseApiError(err, 'Failed to create import receipt'))
    } finally {
      setSaving(false)
    }
  }

  async function approveImport(id) {
    if (!window.confirm('Approve this import receipt? This will update stock and cannot be undone.')) return
    try {
      await api.post(`/imports/${id}/approve`)
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Failed to approve import'))
    }
  }

  async function rejectImport(id) {
    const reason = window.prompt('Reason for rejection:')
    if (!reason) return
    try {
      await api.post(`/imports/${id}/reject`, { reason })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, 'Failed to reject import'))
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
        <h1>Import Receipts</h1>
        <p className="hero-copy">Manage warehouse inbound shipments</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Warehouse</p>
              <h2>Receipt List</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm({ id: '', supplierId: '', note: '', items: [] })}>
              New receipt
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search by code"
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
                  <th>Code</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="Loading imports..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="No imports found" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.code}</strong>
                        <div className="muted-line">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>{item.supplier?.name || '-'}</td>
                      <td>
                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                        {item.rejectedReason && <div className="muted-line">{item.rejectedReason}</div>}
                      </td>
                      <td>
                        <div>Creator: {item.createdBy?.name || '-'}</div>
                        {item.approvedBy && <div className="muted-line">Action by: {item.approvedBy.name}</div>}
                      </td>
                      <td className="actions-cell">
                        {item.status === 'PENDING' && (
                          <>
                            <button type="button" className="text-button" onClick={() => approveImport(item.id)}>Approve</button>
                            <button type="button" className="text-button danger" onClick={() => rejectImport(item.id)}>Reject</button>
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

        <aside className="resource-panel form-panel" style={{ minWidth: '400px' }}>
          <div className="resource-header">
            <div>
              <p className="section-label">Create receipt</p>
              <h2>New Import</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Supplier
              <select className="field-select" value={form.supplierId} onChange={(e) => setForm(prev => ({ ...prev, supplierId: e.target.value }))} required>
                <option value="">Select supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              Note
              <input className="field-input" value={form.note} onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))} />
            </label>

            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Items</h3>
                <button type="button" className="text-button" onClick={addItem}>+ Add Item</button>
              </div>
              
              {form.items.length === 0 ? (
                <div className="muted-line">No items added.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {form.items.map((item, index) => (
                    <div key={index} style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>Item {index + 1}</strong>
                        <button type="button" className="text-button danger" onClick={() => removeItem(index)}>Remove</button>
                      </div>
                      
                      <select className="field-select" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} required style={{ marginBottom: '0.5rem' }}>
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                      </select>

                      <div className="two-col" style={{ marginBottom: '0.5rem' }}>
                        <label>Qty <input type="number" min="1" className="field-input" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required /></label>
                        <label>Price <input type="number" min="0" step="0.01" className="field-input" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} required /></label>
                      </div>

                      <div className="two-col">
                        <label>Lot # <input className="field-input" value={item.lotNumber} onChange={(e) => updateItem(index, 'lotNumber', e.target.value)} required /></label>
                        <label>Expiry <input type="date" className="field-input" value={item.expiryDate} onChange={(e) => updateItem(index, 'expiryDate', e.target.value)} required /></label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving || form.items.length === 0}>
                {saving ? 'Saving...' : 'Create receipt'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
