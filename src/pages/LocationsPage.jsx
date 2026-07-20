import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import './LocationsPage.css'

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
  const [isFormOpen, setIsFormOpen] = useState(false)

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
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu vị trí lưu kho'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí lưu kho này?')) return
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
    setIsFormOpen(true)
  }

  return (
    <div className="locations-container">
      {/* Hero Header */}
      <div className="locations-hero">
        <div className="locations-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● WAREHOUSE GRID LOCATIONS</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Định vị tọa độ & cấu trúc dãy kệ</span>
          </div>
          <h1>Quản Lý Vị Trí Lưu Kho (Warehouse Locations)</h1>
          <p>Thiết lập danh mục các khu vực, dãy kệ (A1, B2, C3...) để định hướng lô hàng chính xác khi nhập kho, nâng cao hiệu suất lấy hàng theo định vị 3D.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => { setForm(emptyForm); setIsFormOpen(true); }}>
            ✨ Thêm Vị Trí Kệ Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Số Vị Trí Kệ"
          value={meta.total || items.length}
          unit="tọa độ kệ"
          trend="↑ Đồng bộ với Sơ đồ 3D"
          status="success"
          icon="📍"
        />
        <StatKPI
          title="Khả Năng Định Vị"
          value="Chuẩn xác"
          unit="grid"
          trend="Tối ưu Picking & Putaway"
          status="info"
          icon="🗺️"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="locations-layout-grid">
        {/* Table Container */}
        <div className="locations-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm mã kệ, tên khu vực lưu kho..."
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
                  <th>Mã định vị (Location Code)</th>
                  <th>Tên khu vực / Kệ hàng</th>
                  <th>Đặc tính & Điều kiện bảo quản</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={4} text="⏳ Đang tải sơ đồ định vị vị trí kho..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={4} text="❌ Chưa tìm thấy vị trí lưu kho nào phù hợp" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div className="location-icon-box">
                            📍
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: '#fff', fontSize: '1.02rem', letterSpacing: '0.04em', fontFamily: "'Outfit', monospace" }}>
                              {item.code}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#34d399' }}>ID: #{item.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#e2e8f0', fontSize: '0.96rem' }}>{item.name}</strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 300 }}>
                        {item.description || <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>Kệ tiêu chuẩn đa năng</span>}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button type="button" className="icon-btn edit" title="Sửa tọa độ" onClick={() => handleEdit(item)}>✏️</button>
                          <button type="button" className="icon-btn delete" title="Xóa tọa độ" onClick={() => handleDelete(item.id)}>🗑️</button>
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
        title={form.id ? 'Cập Nhật Vị Trí Kệ' : 'Thêm Vị Trí Kệ Mới'}
        subtitle={form.id ? `MÃ: ${form.code}` : 'Định vị tọa độ kho'}
        width="480px"
      >
        <div className="locations-side-form">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Mã vị trí (Location Code) *</label>
              <input
                className="input-field"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                required
                placeholder="VD: A1-02-C3 hoặc KHO-LANH-01"
              />
            </div>

            <div className="form-group full-width">
              <label>Tên khu vực / dãy kệ *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="VD: Kệ lạnh Tầng 2 - Khu B"
              />
            </div>

            <div className="form-group full-width">
              <label>Mô tả & điều kiện bảo quản</label>
              <textarea
                className="select-field"
                style={{ height: 110, resize: 'vertical' }}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="VD: Nhiệt độ < 15 độ C, độ ẩm 50%, dành cho hàng sữa và chế phẩm sữa..."
              />
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : form.id ? '💾 Cập Nhật Vị Trí' : '➕ Tạo Vị Trí Kệ'}
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
