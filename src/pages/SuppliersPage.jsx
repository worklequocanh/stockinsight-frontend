import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const emptySupplierForm = { id: '', name: '', phone: '', email: '', address: '' }

export default function SuppliersPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptySupplierForm)

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/suppliers?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Failed to load suppliers'))
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
      if (form.id) {
        await api.put(`/suppliers/${form.id}`, { name: form.name, phone: form.phone, email: form.email, address: form.address })
      } else {
        await api.post('/suppliers', { name: form.name, phone: form.phone, email: form.email, address: form.address })
      }
      setForm(emptySupplierForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Failed to save supplier'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this supplier?')) return
    try {
      await api.delete(`/suppliers/${id}`)
      if (form.id === id) setForm(emptySupplierForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Failed to delete supplier'))
    }
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Suppliers</h1>
        <p className="hero-copy">Manage suppliers and contact information</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Master data</p>
              <h2>Supplier List</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm(emptySupplierForm)}>
              New supplier
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search suppliers"
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
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={4} text="Loading suppliers..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={4} text="No suppliers found" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>
                        <div className="muted-line">{item.phone || '-'}</div>
                        <div className="muted-line">{item.email || '-'}</div>
                      </td>
                      <td>{item.address || '-'}</td>
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
              <p className="section-label">{form.id ? 'Edit supplier' : 'Create supplier'}</p>
              <h2>{form.id ? form.name || 'Supplier details' : 'New supplier'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input className="field-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </label>
            <div className="two-col">
              <label>
                Phone
                <input className="field-input" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
              </label>
              <label>
                Email
                <input type="email" className="field-input" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              </label>
            </div>
            <label>
              Address
              <textarea className="field-textarea" rows="4" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update supplier' : 'Create supplier'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setForm(emptySupplierForm)}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
