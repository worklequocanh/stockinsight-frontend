import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import TableEmpty from '../components/TableEmpty'
import { useToast } from '../context/ToastContext'
import './ProductsPage.css'

const emptyProductForm = { id: '', sku: '', barcode: '', name: '', unit: '', minStock: '0', costPrice: '', salePrice: '', currentStock: '0', categoryId: '', supplierId: '' }

export default function ProductsPage() {
  const { showToast } = useToast()
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
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])

  const [summaryStats, setSummaryStats] = useState({ totalSku: 0, lowStockCount: 0 })

  useEffect(() => {
    api.get('/categories?limit=100').then(res => setCategories(res.data?.data?.items || []))
    api.get('/suppliers?limit=100').then(res => setSuppliers(res.data?.data?.items || []))
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
    const timer = setTimeout(() => {
      loadData({ search, page, categoryId: categoryFilter, supplierId: supplierFilter })
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, categoryFilter, supplierFilter])

  // Update selected product when items change
  useEffect(() => {
    if (selectedProduct) {
      const updated = items.find(i => i.id === selectedProduct.id)
      if (updated) setSelectedProduct(updated)
      else setSelectedProduct(null)
    }
  }, [items, selectedProduct])

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
        showToast('Đã cập nhật sản phẩm thành công!', 'success')
      } else {
        await api.post('/products', payload)
        showToast('Đã tạo sản phẩm thành công!', 'success')
      }
      setForm(emptyProductForm)
      setIsFormOpen(false)
      if (!form.id) setPage(1)
      await loadData({ search, page: form.id ? page : 1, categoryId: categoryFilter, supplierId: supplierFilter })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi lưu sản phẩm')
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) return
    try {
      await api.delete(`/products/${id}`)
      showToast('Đã xóa sản phẩm thành công!', 'success')
      if (form.id === id) setForm(emptyProductForm)
      if (selectedProduct?.id === id) setSelectedProduct(null)
      setPage(1)
      await loadData({ search, page: 1, categoryId: categoryFilter, supplierId: supplierFilter })
    } catch (err) {
      const msg = parseApiError(err, 'Lỗi khi xóa sản phẩm')
      setError(msg)
      showToast(msg, 'error')
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
      const msg = 'Lỗi xuất file Excel: ' + err.message
      setError(msg)
      showToast(msg, 'error')
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
        <StatKPI title="Tổng Số Mã SKU" value={summaryStats.totalSku || meta.total || 0} unit="mặt hàng" trend="↑ Đã đồng bộ cloud" status="success" icon="📦" />
        <StatKPI title="Sản Phẩm Tồn Dưới Định Mức" value={summaryStats.lowStockCount || 0} unit="SKU cảnh báo" trend="Cần tạo lệnh nhập kho" status={summaryStats.lowStockCount > 0 ? 'warning' : 'success'} icon="🚨" />
        <StatKPI title="Số Danh Mục Hoạt Động" value={categories.length} unit="nhóm hàng" trend="Phân loại hệ thống" status="info" icon="📁" />
        <StatKPI title="Đối Tác Cung Ứng" value={suppliers.length} unit="nhà cung cấp" trend="Chuỗi cung ứng liên kết" status="info" icon="🏢" />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="products-layout-grid">
        <div className="products-table-card">
          <div className="table-toolbar" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            <div className="table-search" style={{ flex: 1 }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                placeholder="Tìm tên sản phẩm, mã SKU..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              />
            </div>
            <div className="products-filters">
              <select className="products-filter-select" value={categoryFilter} onChange={(e) => { setPage(1); setCategoryFilter(e.target.value); }}>
                <option value="">📁 Tất cả danh mục</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="products-filter-select" value={supplierFilter} onChange={(e) => { setPage(1); setSupplierFilter(e.target.value); }}>
                <option value="">🏢 Tất cả Nhà Cung Cấp</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="modern-table-wrapper" style={{ flex: 1 }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Sản phẩm / SKU</th>
                  <th>Danh mục</th>
                  <th>Nhà cung cấp</th>
                  <th>Giá vốn / Giá bán</th>
                  <th>Tồn kho (Định mức)</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableEmpty colSpan={6} text="⏳ Đang tải dữ liệu sản phẩm..." />
                ) : items.length === 0 ? (
                  <TableEmpty colSpan={6} text="❌ Không tìm thấy sản phẩm nào" />
                ) : (
                  items.map((item) => {
                    const isLowStock = item.currentStock <= item.minStock
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {item.sku} {item.barcode && `| Barcode: ${item.barcode}`}</span>
                        </td>
                        <td>{item.category?.name || '-'}</td>
                        <td>{item.supplier?.name || '-'}</td>
                        <td>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Vốn: {Number(item.costPrice).toLocaleString('vi-VN')} đ</div>
                          <div style={{ color: 'var(--brand-500)', fontWeight: 600, fontSize: '0.9rem' }}>Bán: {Number(item.salePrice).toLocaleString('vi-VN')} đ</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isLowStock ? 'var(--danger-color)' : 'var(--text-main)' }}>
                            {item.currentStock}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>/ {item.minStock} {item.unit}</span>
                          {isLowStock && <div style={{ fontSize: '0.7rem', color: 'var(--danger-color)', marginTop: 2 }}>⚠️ Dưới định mức</div>}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center', gap: '8px' }}>
                            <button type="button" className="status-pill info" style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontWeight: 700 }} onClick={() => setSelectedProduct(item)}>
                              👁️ Xem
                            </button>
                            <button type="button" className="icon-btn edit" title="Sửa" onClick={() => handleEdit(item)}>✏️</button>
                            <button type="button" className="icon-btn delete" title="Xóa" onClick={() => handleDelete(item.id)}>🗑️</button>
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

      {/* View Detail Modal */}
      {selectedProduct && (
        <SidePanel
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`📦 Chi Tiết Sản Phẩm`}
          subtitle={selectedProduct.name}
          width="600px"
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="form-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>SKU:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{selectedProduct.sku}</strong>
              </div>
              <div className="form-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Barcode:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{selectedProduct.barcode || 'N/A'}</strong>
              </div>
              <div className="form-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Danh mục:</span>
                <strong style={{ color: 'var(--brand-500)' }}>{selectedProduct.category?.name || 'Chưa phân loại'}</strong>
              </div>
              <div className="form-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Nhà cung cấp:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedProduct.supplier?.name || 'Không rõ'}</strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                💰 Thông tin Giá
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Giá vốn:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{Number(selectedProduct.costPrice).toLocaleString('vi-VN')} đ</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Giá bán:</span>
                  <strong style={{ color: 'var(--brand-500)', fontSize: '1.1rem' }}>{Number(selectedProduct.salePrice).toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                📊 Thông tin Tồn Kho
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Tồn kho hiện tại:</span>
                  <strong style={{ fontSize: '1.2rem', color: selectedProduct.currentStock <= selectedProduct.minStock ? 'var(--danger-color)' : 'var(--success-color)' }}>
                    {selectedProduct.currentStock} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>{selectedProduct.unit}</span>
                  </strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 4 }}>Định mức an toàn:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{selectedProduct.minStock} {selectedProduct.unit}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedProduct(null)}>✕ Đóng</button>
              <button type="button" className="btn-primary" onClick={() => { setSelectedProduct(null); handleEdit(selectedProduct); }}>✏️ Sửa Sản Phẩm</button>
            </div>
          </div>
        </SidePanel>
      )}

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
              <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="VD: Sữa tươi Vinamilk 180ml ít đường" />
            </div>

            <div className="form-group">
              <label>Mã SKU *</label>
              <input className="input-field" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} required placeholder="VD: VNM-MLK-180" />
            </div>

            <div className="form-group">
              <label>Mã vạch (Barcode)</label>
              <input className="input-field" value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} placeholder="VD: 8934567890" />
            </div>

            <div className="form-group">
              <label>Danh mục hàng hóa *</label>
              <select className="select-field" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Nhà cung cấp / Brand *</label>
              <select className="select-field" value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))} required>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Đơn vị tính (Unit) *</label>
              <input className="input-field" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} required placeholder="VD: Thùng, Hộp, Cái..." />
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
              <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>✕ Đóng</button>
            </div>
          </form>
        </div>
      </SidePanel>
    </div>
  )
}
