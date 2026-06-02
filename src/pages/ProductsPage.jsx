import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const emptyProductForm = { id: '', sku: '', barcode: '', name: '', unit: '', minStock: '0', costPrice: '', salePrice: '', currentStock: '0', categoryId: '', supplierId: '' }

export default function ProductsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyProductForm)

  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    // Load categories and suppliers for dropdowns
    api.get('/categories?limit=100').then(res => setCategories(res.data?.data?.items || []))
    api.get('/suppliers?limit=100').then(res => setSuppliers(res.data?.data?.items || []))
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/products?${buildQuery({ 
        search: params.search ?? search, 
        page: params.page ?? page, 
        limit: 10,
        categoryId: params.categoryId ?? categoryFilter,
        supplierId: params.supplierId ?? supplierFilter,
      })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Failed to load products'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ search, page, categoryId: categoryFilter, supplierId: supplierFilter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, categoryFilter, supplierFilter])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        sku: form.sku,
        barcode: form.barcode || undefined,
        name: form.name,
        unit: form.unit,
        minStock: Number(form.minStock),
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        categoryId: form.categoryId,
        supplierId: form.supplierId,
      }
      
      if (form.id) {
        await api.put(`/products/${form.id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setForm(emptyProductForm)
      setPage(1)
      await loadData({ search, page: 1, categoryId: categoryFilter, supplierId: supplierFilter })
    } catch (err) {
      setError(parseApiError(err, 'Failed to save product'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      if (form.id === id) setForm(emptyProductForm)
      setPage(1)
      await loadData({ search, page: 1, categoryId: categoryFilter, supplierId: supplierFilter })
    } catch (err) {
      setError(parseApiError(err, 'Failed to delete product'))
    }
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      sku: item.sku || '',
      barcode: item.barcode || '',
      name: item.name || '',
      unit: item.unit || '',
      minStock: String(item.minStock ?? 0),
      costPrice: String(item.costPrice ?? ''),
      salePrice: String(item.salePrice ?? ''),
      currentStock: String(item.currentStock ?? 0),
      categoryId: item.categoryId || '',
      supplierId: item.supplierId || '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Products</h1>
        <p className="hero-copy">Manage product catalog, prices, and stock limits</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel" style={{ flex: 2 }}>
          <div className="resource-header">
            <div>
              <p className="section-label">Master data</p>
              <h2>Product List</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm(emptyProductForm)}>
              New product
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search by name, SKU, barcode"
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
            />
            <select
              className="field-select"
              value={categoryFilter}
              onChange={(event) => {
                setPage(1)
                setCategoryFilter(event.target.value)
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="field-select"
              value={supplierFilter}
              onChange={(event) => {
                setPage(1)
                setSupplierFilter(event.target.value)
              }}
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="error-banner">{error}</p>}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category/Supplier</th>
                  <th>Prices (Cost / Sale)</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="Loading products..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="No products found" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="muted-line">
                          SKU: {item.sku} {item.barcode ? ` | BC: ${item.barcode}` : ''}
                        </div>
                      </td>
                      <td>
                        <div>{item.category?.name || '-'}</div>
                        <div className="muted-line">{item.supplier?.name || '-'}</div>
                      </td>
                      <td>
                        <div>{Number(item.costPrice).toLocaleString()}</div>
                        <div className="muted-line">{Number(item.salePrice).toLocaleString()}</div>
                      </td>
                      <td>
                        <strong>
                          {item.currentStock} {item.unit}
                        </strong>
                        <div className="muted-line">Min: {item.minStock}</div>
                      </td>
                      <td className="actions-cell">
                        <button type="button" className="text-button" onClick={() => handleEdit(item)}>Edit</button>
                        <button type="button" className="text-button danger" onClick={() => handleDelete(item.id)}>Delete</button>
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
              <p className="section-label">{form.id ? 'Edit product' : 'Create product'}</p>
              <h2>{form.id ? form.name || 'Product details' : 'New product'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input className="field-input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </label>
            <div className="two-col">
              <label>
                SKU
                <input className="field-input" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} required />
              </label>
              <label>
                Barcode
                <input className="field-input" value={form.barcode} onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))} />
              </label>
            </div>
            <div className="two-col">
              <label>
                Category
                <select className="field-select" value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Supplier
                <select className="field-select" value={form.supplierId} onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))} required>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="two-col">
              <label>
                Unit
                <input className="field-input" placeholder="e.g. Box, Kg, Pcs" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} required />
              </label>
              <label>
                Min Stock
                <input type="number" min="0" className="field-input" value={form.minStock} onChange={(e) => setForm((prev) => ({ ...prev, minStock: e.target.value }))} required />
              </label>
            </div>
            <div className="two-col">
              <label>
                Cost Price
                <input type="number" min="0" step="0.01" className="field-input" value={form.costPrice} onChange={(e) => setForm((prev) => ({ ...prev, costPrice: e.target.value }))} required />
              </label>
              <label>
                Sale Price
                <input type="number" min="0" step="0.01" className="field-input" value={form.salePrice} onChange={(e) => setForm((prev) => ({ ...prev, salePrice: e.target.value }))} required />
              </label>
            </div>
            {form.id && (
              <label>
                Current Stock (Read-only)
                <input type="number" className="field-input" value={form.currentStock} disabled />
              </label>
            )}
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update product' : 'Create product'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setForm(emptyProductForm)}>
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
