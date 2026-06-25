import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const emptyForm = { id: '', code: '', name: '', description: '' }

export default function LocationsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/locations?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách vị trí lưu kho'))
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
        await api.put(`/locations/${form.id}`, { code: form.code, name: form.name, description: form.description })
      } else {
        await api.post('/locations', { code: form.code, name: form.name, description: form.description })
      }
      setForm(emptyForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu vị trí lưu kho'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return
    try {
      await api.delete(`/locations/${id}`)
      if (form.id === id) setForm(emptyForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xóa vị trí lưu kho'))
    }
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Vị trí lưu kho</h1>
        <p className="hero-copy">Quản lý vị trí lưu trữ hàng hóa trong kho</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Dữ liệu gốc</p>
              <h2>Danh sách vị trí lưu kho</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm(emptyForm)}>
              Thêm vị trí
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Tìm kiếm vị trí"
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
                  <th>Mã vị trí</th>
                  <th>Tên vị trí</th>
                  <th>Mô tả</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={4} text="Đang tải danh sách vị trí..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={4} text="Không tìm thấy vị trí nào" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Mã vị trí">
                        <strong>{item.code}</strong>
                      </td>
                      <td data-label="Tên vị trí">{item.name}</td>
                      <td data-label="Mô tả">{item.description || '-'}</td>
                      <td data-label="Thao tác" className="actions-cell">
                        <button type="button" className="text-button" onClick={() => handleEdit(item)}>Sửa</button>
                        <button type="button" className="text-button danger" onClick={() => handleDelete(item.id)}>Xóa</button>
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
              <p className="section-label">{form.id ? 'Sửa vị trí' : 'Tạo vị trí mới'}</p>
              <h2>{form.id ? form.code || 'Chi tiết vị trí' : 'Vị trí mới'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <div className="two-col">
              <label>
                Mã vị trí
                <input className="field-input" value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} required placeholder="VD: A1-R2-S3" />
              </label>
              <label>
                Tên vị trí
                <input className="field-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="VD: Kệ A1" />
              </label>
            </div>
            <label>
              Mô tả
              <textarea className="field-textarea" rows="3" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Mô tả vị trí..."/>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setForm(emptyForm)}>Làm mới</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
