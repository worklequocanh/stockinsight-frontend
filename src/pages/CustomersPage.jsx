import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const emptyForm = { id: '', name: '', phone: '', email: '', address: '' }

export default function CustomersPage() {
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
      const response = await api.get(`/customers?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách khách hàng'))
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
        await api.put(`/customers/${form.id}`, { name: form.name, phone: form.phone, email: form.email, address: form.address })
      } else {
        await api.post('/customers', { name: form.name, phone: form.phone, email: form.email, address: form.address })
      }
      setForm(emptyForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu khách hàng'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return
    try {
      await api.delete(`/customers/${id}`)
      if (form.id === id) setForm(emptyForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xóa khách hàng'))
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
        <h1>Khách hàng</h1>
        <p className="hero-copy">Quản lý thông tin khách hàng và liên hệ</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Dữ liệu gốc</p>
              <h2>Danh sách khách hàng</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm(emptyForm)}>
              Thêm khách hàng
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Tìm kiếm khách hàng"
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
                  <th>Tên</th>
                  <th>Liên lạc</th>
                  <th>Địa chỉ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={4} text="Đang tải danh sách khách hàng..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={4} text="Không tìm thấy khách hàng nào" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Tên">
                        <strong>{item.name}</strong>
                      </td>
                      <td data-label="Liên lạc">
                        <div className="muted-line">{item.phone || '-'}</div>
                        <div className="muted-line">{item.email || '-'}</div>
                      </td>
                      <td data-label="Địa chỉ">{item.address || '-'}</td>
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
              <p className="section-label">{form.id ? 'Sửa khách hàng' : 'Tạo khách hàng mới'}</p>
              <h2>{form.id ? form.name || 'Chi tiết khách hàng' : 'Khách hàng mới'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Tên
              <input className="field-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </label>
            <div className="two-col">
              <label>
                Số điện thoại
                <input className="field-input" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
              </label>
              <label>
                Email
                <input type="email" className="field-input" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              </label>
            </div>
            <label>
              Địa chỉ
              <textarea className="field-textarea" rows="4" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} />
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
