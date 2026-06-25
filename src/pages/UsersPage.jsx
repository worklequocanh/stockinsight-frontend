import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateRole } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

const emptyForm = { id: '', name: '', email: '', password: '', role: 'EMPLOYEE' }

export default function UsersPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [resetPwId, setResetPwId] = useState(null)

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/users?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách người dùng'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ search, page })
  }, [search, page])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (form.id) {
        await api.put(`/users/${form.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
        })
      } else {
        await api.post('/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        })
      }
      setForm(emptyForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu tài khoản'))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(user) {
    const action = user.isActive ? 'khóa' : 'mở khóa'
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.name}?`)) return
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive })
      await loadData({ search, page })
    } catch (err) {
      setError(parseApiError(err, `Lỗi khi ${action} tài khoản`))
    }
  }

  async function handleResetPassword() {
    if (!resetPwId) return
    const password = window.prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):')
    if (!password) return
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.put(`/users/${resetPwId}/reset-password`, { password })
      setResetPwId(null)
      alert('Đặt lại mật khẩu thành công!')
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi đặt lại mật khẩu'))
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      name: item.name || '',
      email: item.email || '',
      password: '',
      role: item.role || 'EMPLOYEE',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quản lý tài khoản</h1>
        <p className="hero-copy">Quản lý tài khoản người dùng hệ thống (chỉ Quản trị viên)</p>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Người dùng</p>
              <h2>Danh sách tài khoản</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setForm(emptyForm)}>
              Thêm tài khoản
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Tìm theo tên hoặc email"
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
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="Đang tải danh sách..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="Không tìm thấy tài khoản nào" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Tên">
                        <strong>{item.name}</strong>
                      </td>
                      <td data-label="Email">
                        <span className="muted-line">{item.email}</span>
                      </td>
                      <td data-label="Vai trò">
                        <span className={`badge badge--role badge--role-${item.role.toLowerCase()}`}>
                          {translateRole(item.role)}
                        </span>
                      </td>
                      <td data-label="Trạng thái">
                        <span className={`badge ${item.isActive ? 'badge--approved' : 'badge--rejected'}`}>
                          {item.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td data-label="Thao tác" className="actions-cell">
                        <button type="button" className="text-button" onClick={() => handleEdit(item)}>Sửa</button>
                        <button type="button" className="text-button" onClick={() => setResetPwId(item.id)}>Đặt lại MK</button>
                        <button
                          type="button"
                          className={`text-button ${item.isActive ? 'danger' : ''}`}
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
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
              <p className="section-label">{form.id ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}</p>
              <h2>{form.id ? form.name || 'Chi tiết tài khoản' : 'Tài khoản mới'}</h2>
            </div>
          </div>

          {resetPwId && (
            <div className="error-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Đặt lại mật khẩu cho người dùng đã chọn</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="primary-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleResetPassword} disabled={saving}>
                  Xác nhận
                </button>
                <button type="button" className="secondary-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setResetPwId(null)}>
                  Hủy
                </button>
              </div>
            </div>
          )}

          <form className="resource-form" onSubmit={handleSubmit}>
            <label>
              Tên hiển thị
              <input className="field-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </label>
            <label>
              Email
              <input type="email" className="field-input" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            </label>
            <label>
              Vai trò
              <select className="field-select" value={form.role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}>
                <option value="EMPLOYEE">Nhân viên</option>
                <option value="WAREHOUSE_MANAGER">Quản lý kho</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </label>
            {!form.id && (
              <label>
                Mật khẩu
                <input type="password" className="field-input" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} required={!form.id} minLength={6} placeholder="Tối thiểu 6 ký tự" />
              </label>
            )}
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
