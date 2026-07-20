import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import { translateRole } from '../utils/translations'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import './UsersPage.css'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const password = window.prompt('Nhập mật khẩu mới cho người dùng (tối thiểu 6 ký tự):')
    if (!password) return
    if (password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.put(`/users/${resetPwId}/reset-password`, { password })
      setResetPwId(null)
      alert('✅ Đặt lại mật khẩu thành công!')
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

  const adminCount = items.filter(i => i.role === 'ADMIN').length
  const activeCount = items.filter(i => i.isActive).length

  return (
    <div className="users-container">
      {/* Hero Header */}
      <div className="users-hero">
        <div className="users-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● IAM ROLE-BASED ACCESS CONTROL</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Hệ thống định danh và bảo mật WMS</span>
          </div>
          <h1>Quản Lý Tài Khoản & Phân Quyền (Identity & IAM)</h1>
          <p>Phân quyền định danh theo vai trò (Quản trị viên, Quản lý kho, Nhân viên thao tác), kiểm soát quyền truy cập nghiệp vụ và đặt lại mật khẩu bảo mật (dành riêng cho Admin).</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => setForm(emptyForm)}>
            ✨ Cấp Tài Khoản Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Tài Khoản IAM"
          value={meta.total || items.length}
          unit="users"
          trend="↑ Định danh hệ thống"
          status="success"
          icon="👥"
        />
        <StatKPI
          title="Tài Khoản Hoạt Động"
          value={activeCount}
          unit="active"
          trend="Đang trực tuyến / Hợp lệ"
          status="success"
          icon="🟢"
        />
        <StatKPI
          title="Quản Trị Viên (Admin)"
          value={adminCount}
          unit="root"
          trend="Toàn quyền hệ thống"
          status="danger"
          icon="🛡️"
        />
        <StatKPI
          title="Độ Cứng Bảo Mật"
          value="JWT / IAM"
          unit="auth"
          trend="Mã hóa BCrypt"
          status="info"
          icon="🔒"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="users-layout-grid">
        {/* Table Container */}
        <div className="users-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm kiếm tài khoản theo tên hoặc địa chỉ email..."
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
              />
            </div>
          </div>

          <div className="modern-table-wrapper" style={{ flex: 1 }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Tên người dùng</th>
                  <th>Địa chỉ Email</th>
                  <th>Vai Trò Phân Quyền</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang tải danh sách người dùng hệ thống từ cloud..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Không tìm thấy tài khoản người dùng nào" />
                ) : (
                  items.map((item) => {
                    const roleBadgeClass = item.role === 'ADMIN' ? 'danger' : item.role === 'WAREHOUSE_MANAGER' ? 'info' : 'success'
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="user-avatar-circle">
                              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <strong style={{ display: 'block', color: '#fff', fontSize: '0.98rem' }}>{item.name}</strong>
                          </div>
                        </td>
                        <td style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
                          ✉️ {item.email}
                        </td>
                        <td>
                          <span className={`status-pill ${roleBadgeClass}`} style={{ fontSize: '0.78rem', padding: '4px 12px', fontWeight: 800 }}>
                            {translateRole(item.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${item.isActive ? 'success' : 'danger'}`} style={{ fontSize: '0.78rem' }}>
                            {item.isActive ? '● Hoạt động' : '🔒 Đã khóa'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            <button type="button" className="icon-btn edit" title="Sửa thông tin" onClick={() => handleEdit(item)}>✏️</button>
                            <button type="button" className="status-pill info" style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setResetPwId(item.id)}>
                              🔑 Đặt MK
                            </button>
                            <button
                              type="button"
                              className={`status-pill ${item.isActive ? 'danger' : 'success'}`}
                              style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => handleToggleActive(item)}
                            >
                              {item.isActive ? '🔒 Khóa' : '🔓 Mở khóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination meta={meta} onPageChange={setPage} loading={loading} />
          </div>
        </div>

        {/* Side Form Card */}
        <div className="users-side-form">
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16, marginBottom: 20 }}>
            <span className="status-pill info" style={{ marginBottom: 6 }}>
              {form.id ? '✏️ CHỈNH SỬA TÀI KHOẢN' : '✨ TẠO TÀI KHOẢN MỚI'}
            </span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#fff' }}>
              {form.id ? form.name : 'Cấp Quyền Truy Cập'}
            </h2>
          </div>

          {resetPwId && (
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: 16, borderRadius: 16, marginBottom: 20 }}>
              <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                🔑 Khởi tạo lại mật khẩu cho người dùng đã chọn
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', flex: 1 }} onClick={handleResetPassword} disabled={saving}>
                  Xác nhận đặt lại
                </button>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setResetPwId(null)}>
                  Hủy
                </button>
              </div>
            </div>
          )}

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Tên hiển thị (Full Name) *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="VD: Nguyễn Văn A..."
              />
            </div>

            <div className="form-group full-width">
              <label>Địa chỉ Email (Tên đăng nhập) *</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                placeholder="VD: nguyenvana@stockinsight.vn"
              />
            </div>

            <div className="form-group full-width">
              <label>Vai trò phân quyền (IAM Role) *</label>
              <select className="select-field" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="EMPLOYEE">🟢 Nhân viên thao tác (Employee)</option>
                <option value="WAREHOUSE_MANAGER">🔵 Quản lý kho (Warehouse Manager)</option>
                <option value="ADMIN">🔴 Quản trị viên hệ thống (Admin)</option>
              </select>
            </div>

            {!form.id && (
              <div className="form-group full-width">
                <label>Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required={!form.id}
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự bảo mật"
                />
              </div>
            )}

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? '⏳ Đang xử lý...' : form.id ? '💾 Cập Nhật Tài Khoản' : '🚀 Khởi Tạo Tài Khoản'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setForm(emptyForm)}>
                🔄 Làm Mới
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
