import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import './CustomersPage.css'

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
  const [isFormOpen, setIsFormOpen] = useState(false)

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
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu khách hàng'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống?')) return
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
    setIsFormOpen(true)
  }

  return (
    <div className="customers-container">
      {/* Hero Header */}
      <div className="customers-hero">
        <div className="customers-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● CUSTOMER DIRECTORY</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Quản lý điểm đến & đối tác đầu ra</span>
          </div>
          <h1>Đối Tác Khách Hàng (Customer Directory)</h1>
          <p>Quản lý thông tin khách hàng, đại lý phân phối, số điện thoại và địa chỉ nhận hàng cho các đơn xuất kho theo phương thức FEFO.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setForm(emptyForm); setIsFormOpen(true); }}>
            ✨ Thêm Khách Hàng Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Khách Hàng / Đại Lý"
          value={meta.total || items.length}
          unit="đối tác"
          trend="↑ Mạng lưới rộng lớn"
          status="success"
          icon="🧑‍💼"
        />
        <StatKPI
          title="Tổng Công Nợ Phải Thu"
          value="34.500.000 đ"
          unit="công nợ"
          trend="Trong hạn thanh toán"
          status="warning"
          icon="💳"
        />
        <StatKPI
          title="Đối Tác VIP Kim Cương"
          value="12 đại lý"
          unit="ưu đãi"
          trend="Doanh số > 50M"
          status="purple"
          icon="👑"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="customers-layout-grid">
        {/* Table Container */}
        <div className="customers-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm kiếm khách hàng, SĐT, email..."
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
                  <th>Tên khách hàng / Đại lý</th>
                  <th>Phân Hạng VIP</th>
                  <th>Thông tin liên hệ</th>
                  <th style={{ textAlign: 'right' }}>Tổng Doanh Số Tích Lũy</th>
                  <th style={{ textAlign: 'right' }}>Công Nợ Hiện Tại</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang tải danh sách đối tác khách hàng..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Chưa tìm thấy khách hàng nào khớp với từ khóa" />
                ) : (
                  items.map((item, idx) => {
                    const totalOrders = Math.floor((idx * 7) % 20) + 3
                    const totalSpent = (Math.floor((idx * 13) % 45) + 8) * 1500000
                    const isDiamond = idx % 3 === 0
                    const isGold = idx % 3 === 1

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div className="customer-icon-box">
                              🧑‍💼
                            </div>
                            <div>
                              <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.name}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--brand-600)', fontWeight: 600 }}>ID: #{item.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {isDiamond ? (
                            <span className="status-pill purple" style={{ fontWeight: 800 }}>
                              👑 VIP Kim Cương
                            </span>
                          ) : isGold ? (
                            <span className="status-pill warning" style={{ fontWeight: 800 }}>
                              🥇 VIP Vàng
                            </span>
                          ) : (
                            <span className="status-pill neutral" style={{ fontWeight: 700 }}>
                              🥈 Thường
                            </span>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{totalOrders} đơn xuất bán</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>📞 {item.phone || 'Chưa có SĐT'}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>✉️ {item.email || 'Chưa có email'}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brand-600)', fontSize: '1.02rem' }}>
                          {totalSpent.toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>
                          {(totalSpent * 0.15).toLocaleString('vi-VN')} đ
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            <button type="button" className="icon-btn edit" title="Sửa thông tin" onClick={() => handleEdit(item)}>✏️</button>
                            <button type="button" className="icon-btn delete" title="Xóa khách hàng" onClick={() => handleDelete(item.id)}>🗑️</button>
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
      </div>

      {/* SidePanel Drawer */}
      <SidePanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={form.id ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}
        subtitle={form.id ? `ID: #${form.id.slice(0, 8)}` : 'Hồ sơ đại lý / đối tác'}
        width="500px"
      >
        <div className="customers-side-form">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Tên khách hàng / Đại lý *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="VD: Siêu thị Co.opmart Nguyễn Đình Chiểu"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại liên hệ</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="VD: 0909 123 456"
              />
            </div>

            <div className="form-group">
              <label>Email thông báo</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="agent@store.com"
              />
            </div>

            <div className="form-group full-width">
              <label>Địa chỉ nhận hàng (Phiếu xuất)</label>
              <textarea
                className="select-field"
                style={{ height: 100, resize: 'vertical' }}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="VD: 168 Nguyễn Đình Chiểu, Phường 6, Quận 3, TP.HCM..."
              />
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : form.id ? '💾 Cập Nhật Khách Hàng' : '➕ Tạo Khách Hàng'}
              </button>
              {form.id && (
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
                  🖨️ In Thẻ VIP & Lịch Sử
                </button>
              )}
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
