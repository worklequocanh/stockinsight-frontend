import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const emptyCategoryForm = { id: '', name: '', description: '' }

export default function CategoriesPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyCategoryForm)

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/categories?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Failed to load categories'))
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
        await api.put(`/categories/${form.id}`, { name: form.name, description: form.description })
      } else {
        await api.post('/categories', { name: form.name, description: form.description })
      }
      setForm(emptyCategoryForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Failed to save category'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return
    try {
      await api.delete(`/categories/${id}`)
      if (form.id === id) setForm(emptyCategoryForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Failed to delete category'))
    }
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Categories</h1>
        <p className="hero-copy">Manage product categories</p>
      </div>
      
      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Master data</p>
              <h2>Category List</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm(emptyCategoryForm)}>
              New category
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search categories"
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
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={3} text="Loading categories..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={3} text="No categories found" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.description || '-'}</td>
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
              <p className="section-label">{form.id ? 'Edit category' : 'Create category'}</p>
              <h2>{form.id ? form.name || 'Category details' : 'New category'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input className="field-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </label>
            <label>
              Description
              <textarea className="field-textarea" rows="4" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update category' : 'Create category'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setForm(emptyCategoryForm)}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
