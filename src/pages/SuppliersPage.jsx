import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import './SuppliersPage.css'

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
  const [isFormOpen, setIsFormOpen] = useState(false)

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/suppliers?${buildQuery({ search: params.search ?? search, page: params.page ?? page, limit: 10 })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách nhà cung cấp'))
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
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu nhà cung cấp'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này khỏi hệ thống?')) return
    try {
      await api.delete(`/suppliers/${id}`)
      if (form.id === id) setForm(emptySupplierForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xóa nhà cung cấp'))
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
    setIsFormOpen(true)
  }

  return (
    <div className="suppliers-container">
      {/* Hero Header */}
      <div className="suppliers-hero">
        <div className="suppliers-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● SUPPLIER NETWORK</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Quản lý chuỗi cung ứng đầu vào</span>
          </div>
          <h1>Đối Tác Nhà Cung Cấp (Suppliers Master)</h1>
          <p>Quản lý hồ sơ đối tác, thông tin liên lạc, địa chỉ kho bãi và theo dõi luồng nhập khẩu hàng hóa vào chuỗi cung ứng.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setForm(emptySupplierForm); setIsFormOpen(true); }}>
            ✨ Thêm Nhà Cung Cấp Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Số Nhà Cung Cấp"
          value={meta.total || items.length}
          unit="đối tác"
          trend="↑ Đã kết nối chuỗi cung ứng"
          status="success"
          icon="🏢"
        />
        <StatKPI
          title="Tình Trạng Hợp Tác"
          value="Liên Tục"
          unit="đáp ứng SLA"
          trend="Bảo đảm nguồn hàng nhập"
          status="info"
          icon="🤝"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="suppliers-layout-grid">
        {/* Table Container */}
        <div className="suppliers-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm kiếm tên đối tác, số điện thoại, email..."
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
                  <th>Đối tác & Tên thương hiệu</th>
                  <th>Thông tin liên hệ</th>
                  <th>Địa chỉ kho / Trụ sở</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={4} text="⏳ Đang tải dữ liệu hồ sơ nhà cung cấp..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={4} text="❌ Chưa tìm thấy nhà cung cấp nào khớp với từ khóa" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div className="supplier-icon-box">
                            🏢
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--brand-400)' }}>ID: #{item.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>📞 {item.phone || 'Chưa có SĐT'}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>✉️ {item.email || 'Chưa có email'}</div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 260 }}>
                        {item.address || <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>Chưa cập nhật địa chỉ</span>}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button type="button" className="icon-btn edit" title="Sửa thông tin" onClick={() => handleEdit(item)}>✏️</button>
                          <button type="button" className="icon-btn delete" title="Xóa nhà cung cấp" onClick={() => handleDelete(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination meta={meta} onPageChange={setPage} loading={loading} />
          </div>
        </div>
      </div>

      {/* SidePanel Drawer */}
      <SidePanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={form.id ? 'Cập Nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
        subtitle={form.id ? `ID: #${form.id.slice(0, 8)}` : 'Hồ sơ nhà cung cấp / đối tác'}
        width="500px"
      >
        <div className="suppliers-side-form">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Tên doanh nghiệp / Nhà cung cấp *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="VD: Công ty Cổ phần Sữa Việt Nam"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại liên hệ</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="VD: 028 5415 5555"
              />
            </div>

            <div className="form-group">
              <label>Email liên hệ</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="contact@company.com"
              />
            </div>

            <div className="form-group full-width">
              <label>Địa chỉ kho hoặc văn phòng trụ sở</label>
              <textarea
                className="select-field"
                style={{ height: 100, resize: 'vertical' }}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="VD: 10 Tân Trào, P. Tân Phú, Q.7, TP.HCM..."
              />
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : form.id ? '💾 Cập Nhật NCC' : '➕ Tạo Đối Tác'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>
                ✕ Đóng
              </button>
            </div>
          </form>
        </div>
      </SidePanel>
    </div>
  )
}
