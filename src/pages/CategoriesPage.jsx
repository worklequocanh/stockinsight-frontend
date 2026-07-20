import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import './CategoriesPage.css'

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
      setError(parseApiError(err, 'Lỗi khi tải danh sách danh mục'))
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
      setError(parseApiError(err, 'Lỗi khi lưu danh mục'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
    try {
      await api.delete(`/categories/${id}`)
      if (form.id === id) setForm(emptyCategoryForm)
      setPage(1)
      await loadData({ search, page: 1 })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xóa danh mục'))
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
    <div className="categories-container">
      {/* Hero Header */}
      <div className="categories-hero">
        <div className="categories-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● PRODUCT CLASSIFICATION</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Phân khu & Chuẩn hóa SKU</span>
          </div>
          <h1>Danh Mục Hàng Hóa (Product Categories)</h1>
          <p>Phân nhóm nhóm ngành hàng để tối ưu hóa việc định vị kệ, tra cứu báo cáo tồn kho và kiểm soát SKU.</p>
        </div>
        <div>
          <button type="button" className="btn-primary" onClick={() => setForm(emptyCategoryForm)}>
            ✨ Thêm Nhóm Danh Mục Mới
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Danh Mục Hiện Có"
          value={meta.total || items.length}
          unit="nhóm hàng"
          trend="↑ Đã đồng bộ cấu trúc"
          status="success"
          icon="📁"
        />
        <StatKPI
          title="Trạng Thái Quản Lý"
          value="Sẵn Sàng"
          unit="hệ thống"
          trend="Tối ưu định vị SKU"
          status="info"
          icon="⚡"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="categories-layout-grid">
        {/* Table Container */}
        <div className="categories-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm kiếm tên danh mục..."
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
                  <th>Tên Nhóm / Danh Mục</th>
                  <th>Mô Tả & Ghi Chú</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={3} text="⏳ Đang tải dữ liệu danh mục từ cloud..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={3} text="❌ Chưa có danh mục nào được tìm thấy" />
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div className="category-icon-box">
                            📁
                          </div>
                          <div>
                            <strong style={{ color: '#fff', fontSize: '1rem', display: 'block' }}>{item.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>ID: #{item.id}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 400 }}>
                        {item.description || <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>Không có mô tả chi tiết</span>}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button type="button" className="icon-btn edit" title="Sửa danh mục" onClick={() => handleEdit(item)}>✏️</button>
                          <button type="button" className="icon-btn delete" title="Xóa danh mục" onClick={() => handleDelete(item.id)}>🗑️</button>
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

        {/* Side Form Card */}
        <div className="categories-side-form">
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16, marginBottom: 20 }}>
            <span className="status-pill info" style={{ marginBottom: 6 }}>
              {form.id ? '✏️ SỬA DANH MỤC' : '✨ THÊM DANH MỤC MỚI'}
            </span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#fff' }}>
              {form.id ? form.name : 'Tạo nhóm ngành hàng'}
            </h2>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Tên danh mục *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="VD: Đồ uống, Thực phẩm khô, Gia vị..."
              />
            </div>

            <div className="form-group full-width">
              <label>Mô tả chi tiết</label>
              <textarea
                className="select-field"
                style={{ height: 110, resize: 'vertical' }}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ghi chú về đặc tính bảo quản hoặc phân khu kệ..."
              />
            </div>

            <div className="form-group full-width" style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? '⏳ Đang xử lý...' : form.id ? '💾 Cập Nhật Danh Mục' : '➕ Tạo Danh Mục'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setForm(emptyCategoryForm)}>
                🔄 Làm Mới
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
