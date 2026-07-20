import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import './ProductsPage.css'

const emptyProductForm = { id: '', sku: '', barcode: '', name: '', unit: '', minStock: '0', costPrice: '', salePrice: '', currentStock: '0', categoryId: '', supplierId: '' }

export default function ProductsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyProductForm)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])

  // Summary statistics for KPIs
  const [summaryStats, setSummaryStats] = useState({ totalSku: 0, lowStockCount: 0 })

  useEffect(() => {
    api.get('/categories?limit=100').then(res => setCategories(res.data?.data?.items || []))
    api.get('/suppliers?limit=100').then(res => setSuppliers(res.data?.data?.items || []))
    // Fetch quick low stock counts from inventory report
    api.get('/reports/inventory').then(res => {
      const allInv = res.data?.data || []
      const low = allInv.filter(i => i.isLowStock).length
      setSummaryStats(p => ({ ...p, lowStockCount: low }))
    }).catch(() => {})
  }, [])

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/products?${buildQuery({ 
        search: params.search ?? search, 
        page: params.page ?? page, 
        limit: 10,
        categoryId: params.categoryId ?? categoryFilter,
        supplierId: params.supplierId ?? supplierFilter,
      })}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
      setSummaryStats(p => ({ ...p, totalSku: payload.meta?.total || p.totalSku }))
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải danh sách sản phẩm'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ search, page, categoryId: categoryFilter, supplierId: supplierFilter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, categoryFilter, supplierFilter])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        sku: form.sku,
        barcode: form.barcode || undefined,
        name: form.name,
        unit: form.unit,
        minStock: Number(form.minStock),
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        categoryId: form.categoryId,
        supplierId: form.supplierId,
      }
      
      if (form.id) {
        await api.put(`/products/${form.id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setForm(emptyProductForm)
      setIsFormOpen(false)
      setPage(1)
      await loadData({ search, page: 1, categoryId: categoryFilter, supplierId: supplierFilter })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi lưu sản phẩm'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) return
    try {
      await api.delete(`/products/${id}`)
      if (form.id === id) setForm(emptyProductForm)
      setPage(1)
      await loadData({ search, page: 1, categoryId: categoryFilter, supplierId: supplierFilter })
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi xóa sản phẩm'))
    }
  }

  async function handleExportExcel() {
    try {
      const response = await api.get('/reports/export-excel', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Bao_Cao_Ton_Kho_SKU.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Lỗi xuất file Excel: ' + err.message)
    }
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      sku: item.sku || '',
      barcode: item.barcode || '',
      name: item.name || '',
      unit: item.unit || '',
      minStock: String(item.minStock ?? 0),
      costPrice: String(item.costPrice ?? ''),
      salePrice: String(item.salePrice ?? ''),
      currentStock: String(item.currentStock ?? 0),
      categoryId: item.categoryId || '',
      supplierId: item.supplierId || '',
    })
    setIsFormOpen(true)
  }

  return (
    <div className="products-container">
      {/* Hero Header */}
      <div className="products-hero">
        <div className="products-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● SKU MASTER CATALOG</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Định danh hàng hóa & Barcode</span>
          </div>
          <h1>Danh Mục Sản Phẩm (SKU Master)</h1>
          <p>Quản lý tập trung toàn bộ danh sách hàng hóa, mã vạch Barcode, định mức an toàn và giá vốn/giá bán.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn-secondary" onClick={handleExportExcel}>
            📊 Xuất Bảng SKU Excel
          </button>
          <button type="button" className="btn-primary" onClick={() => { setForm(emptyProductForm); setIsFormOpen(true); }}>
            ✨ Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="products-kpi-bar">
        <StatKPI
          title="Tổng Số Mã SKU"
          value={summaryStats.totalSku || meta.total || 0}
          unit="mặt hàng"
          trend="↑ Đã đồng bộ cloud"
          status="success"
          icon="📦"
        />
        <StatKPI
          title="Sản Phẩm Tồn Dưới Định Mức"
          value={summaryStats.lowStockCount || 0}
          unit="SKU cảnh báo"
          trend="Cần tạo lệnh nhập kho"
          status={summaryStats.lowStockCount > 0 ? 'warning' : 'success'}
          icon="🚨"
        />
        <StatKPI
          title="Số Danh Mục Hoạt Động"
          value={categories.length}
          unit="nhóm hàng"
          trend="Phân loại hệ thống"
          status="info"
          icon="📁"
        />
        <StatKPI
          title="Đối Tác Cung Ứng"
          value={suppliers.length}
          unit="nhà cung cấp"
          trend="Chuỗi cung ứng liên kết"
          status="info"
          icon="🏢"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="products-layout-grid">
        {/* Table Container */}
        <div className="products-table-card">
          <div className="products-toolbar">
            <div className="products-search-box">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm tên sản phẩm, mã SKU, barcode..."
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
              />
            </div>

            <div className="products-filters">
              <select
                className="products-filter-select"
                value={categoryFilter}
                onChange={(e) => {
                  setPage(1)
                  setCategoryFilter(e.target.value)
                }}
              >
                <option value="">📁 Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="products-filter-select"
                value={supplierFilter}
                onChange={(e) => {
                  setPage(1)
                  setSupplierFilter(e.target.value)
                }}
              >
                <option value="">🏢 Tất cả Nhà Cung Cấp</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modern-table-wrapper" style={{ flex: 1 }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Sản phẩm & Mã SKU</th>
                  <th>Phân loại / Nhà Cung Cấp</th>
                  <th>Giá Vốn / Giá Bán</th>
                  <th style={{ textAlign: 'center' }}>Tồn Kho Thực Tế</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={5} text="⏳ Đang đồng bộ danh sách sản phẩm từ máy chủ..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={5} text="❌ Chưa có sản phẩm nào khớp với bộ lọc tìm kiếm" />
                ) : (
                  items.map((item) => {
                    const isLowStock = item.currentStock <= item.minStock
                    return (
                      <tr key={item.id} style={{ background: isLowStock ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                        <td>
                          <strong style={{ display: 'block', color: '#fff', fontSize: '0.96rem' }}>{item.name}</strong>
                          <span className="sku-tag">
                            SKU: {item.sku} {item.barcode && `| BC: ${item.barcode}`}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill info" style={{ fontSize: '0.74rem', padding: '3px 10px', marginBottom: 4, display: 'inline-block' }}>
                            📁 {item.category?.name || 'Chưa phân loại'}
                          </span>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            🏢 {item.supplier?.name || 'Đối tác chung'}
                          </div>
                        </td>
                        <td>
                          <span className="cost-pill">Vốn: {Number(item.costPrice).toLocaleString('vi-VN')} đ</span>
                          <span className="price-pill">Bán: {Number(item.salePrice).toLocaleString('vi-VN')} đ</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '1.08rem', fontWeight: 800, color: isLowStock ? '#fb7185' : '#38bdf8' }}>
                              {item.currentStock} {item.unit}
                            </strong>
                            {isLowStock && (
                              <span className="status-pill danger" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>Min</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>Định mức tối thiểu: {item.minStock} {item.unit}</div>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            <button type="button" className="icon-btn edit" title="Chỉnh sửa SKU" onClick={() => handleEdit(item)}>
                              ✏️
                            </button>
                            <button type="button" className="icon-btn delete" title="Xóa SKU" onClick={() => handleDelete(item.id)}>
                              🗑️
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
      </div>

      {/* SidePanel Drawer */}
      <SidePanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={form.id ? 'Cập Nhật SKU' : 'Tạo Mã SKU Mới'}
        subtitle={form.id ? `SKU: ${form.sku}` : 'Thiết lập thông số sản phẩm'}
        width="620px"
      >
        <div className="products-side-form">
          <form className="product-form-grid" onSubmit={handleSubmit}>
            <div className="form-group full-col">
              <label>Tên sản phẩm *</label>
              <input 
                className="input-field" 
                value={form.name} 
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
                required 
                placeholder="VD: Sữa tươi Vinamilk 180ml ít đường" 
              />
            </div>

            <div className="form-group">
              <label>Mã SKU *</label>
              <input 
                className="input-field" 
                value={form.sku} 
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} 
                required 
                placeholder="VD: VNM-MLK-180" 
              />
            </div>

            <div className="form-group">
              <label>Mã vạch (Barcode)</label>
              <input 
                className="input-field" 
                value={form.barcode} 
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} 
                placeholder="VD: 8934567890" 
              />
            </div>

            <div className="form-group">
              <label>Danh mục hàng hóa *</label>
              <select className="select-field" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nhà cung cấp / Brand *</label>
              <select className="select-field" value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))} required>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Đơn vị tính (Unit) *</label>
              <input 
                className="input-field" 
                value={form.unit} 
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} 
                required 
                placeholder="VD: Thùng, Hộp, Cái..." 
              />
            </div>

            <div className="form-group">
              <label>Định mức tối thiểu (Min Stock) *</label>
              <input type="number" min="0" className="input-field" value={form.minStock} onChange={(e) => setForm((p) => ({ ...p, minStock: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Giá vốn nhập (VNĐ) *</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Giá bán ra (VNĐ) *</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.salePrice} onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))} required />
            </div>

            {form.id && (
              <div className="form-group full-col">
                <label>Tồn kho hiện tại (Tự động tính từ phiếu nhập/xuất)</label>
                <input type="number" className="input-field" style={{ opacity: 0.7, background: 'rgba(0,0,0,0.4)' }} value={form.currentStock} disabled />
              </div>
            )}

            <div className="full-col" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? '⏳ Đang lưu trữ...' : form.id ? '💾 Cập Nhật SKU' : '➕ Tạo Sản Phẩm Mới'}
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
