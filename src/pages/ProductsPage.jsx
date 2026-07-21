import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import SidePanel from '../components/common/SidePanel'
import { motion, AnimatePresence } from 'framer-motion'
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
    loadData({ search, page, categoryId: categoryFilter, supplierId: supplierFilter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, categoryFilter, supplierFilter])

  // Update selected product when items change
  useEffect(() => {
    if (selectedProduct) {
      const updated = items.find(i => i.id === selectedProduct.id)
      if (updated) setSelectedProduct(updated)
      else setSelectedProduct(null)
    }
  }, [items])

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
      if (!form.id) setPage(1)
      await loadData({ search, page: form.id ? page : 1, categoryId: categoryFilter, supplierId: supplierFilter })
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
      if (selectedProduct?.id === id) setSelectedProduct(null)
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
        <StatKPI title="Tổng Số Mã SKU" value={summaryStats.totalSku || meta.total || 0} unit="mặt hàng" trend="↑ Đã đồng bộ cloud" status="success" icon="📦" />
        <StatKPI title="Sản Phẩm Tồn Dưới Định Mức" value={summaryStats.lowStockCount || 0} unit="SKU cảnh báo" trend="Cần tạo lệnh nhập kho" status={summaryStats.lowStockCount > 0 ? 'warning' : 'success'} icon="🚨" />
        <StatKPI title="Số Danh Mục Hoạt Động" value={categories.length} unit="nhóm hàng" trend="Phân loại hệ thống" status="info" icon="📁" />
        <StatKPI title="Đối Tác Cung Ứng" value={suppliers.length} unit="nhà cung cấp" trend="Chuỗi cung ứng liên kết" status="info" icon="🏢" />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="md-layout">
        {/* Left Pane (Master) */}
        <div className="md-master-pane">
          <div className="md-master-header">
            <div className="products-search-box">
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

          <div className="md-master-list">
            {loading ? (
              <div className="md-empty">⏳ Đang đồng bộ...</div>
            ) : items.length === 0 ? (
              <div className="md-empty">❌ Không tìm thấy sản phẩm.</div>
            ) : (
              items.map((item) => {
                const isSelected = selectedProduct?.id === item.id;
                const isLowStock = item.currentStock <= item.minStock;
                return (
                  <motion.div 
                    layoutId={`product-card-${item.id}`}
                    key={item.id}
                    className={`md-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedProduct(item)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="md-card-top">
                      <strong className="md-card-title">{item.name}</strong>
                      {isLowStock && <span className="status-pill danger" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Low</span>}
                    </div>
                    <div className="md-card-sku">SKU: {item.sku}</div>
                    <div className="md-card-bottom">
                      <span className="md-card-stock">
                        {item.currentStock} <span style={{fontSize: '0.75rem', fontWeight: 400}}>{item.unit}</span>
                      </span>
                      <span className="status-pill info" style={{ fontSize: '0.7rem' }}>
                        📁 {item.category?.name || 'N/A'}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
          
          <div className="md-master-footer">
            <Pagination meta={meta} onPageChange={setPage} loading={loading} />
          </div>
        </div>

        {/* Right Pane (Detail) */}
        <div className="md-detail-pane">
          <AnimatePresence mode="wait">
            {selectedProduct ? (
              <motion.div
                key={selectedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md-detail-content"
              >
                <div className="md-detail-header">
                  <div>
                    <span className="status-pill info" style={{marginBottom: 8, display: 'inline-block'}}>
                      📁 {selectedProduct.category?.name || 'Chưa phân loại'}
                    </span>
                    <h2>{selectedProduct.name}</h2>
                    <div className="md-detail-subtext">
                      SKU: <span className="highlight-text">{selectedProduct.sku}</span> {selectedProduct.barcode && ` • Barcode: ${selectedProduct.barcode}`}
                    </div>
                  </div>
                  <div className="md-detail-actions">
                    <button type="button" className="btn-secondary" onClick={() => handleEdit(selectedProduct)}>✏️ Sửa</button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(selectedProduct.id)}>🗑️ Xóa</button>
                  </div>
                </div>

                <div className="md-detail-body">
                  <div className="md-stock-hero">
                    <div className="md-stock-val" style={{ color: selectedProduct.currentStock <= selectedProduct.minStock ? '#fb7185' : 'var(--brand-400)' }}>
                      {selectedProduct.currentStock}
                    </div>
                    <div className="md-stock-label">TỒN KHO HIỆN TẠI ({selectedProduct.unit})</div>
                    {selectedProduct.currentStock <= selectedProduct.minStock && (
                      <div className="status-pill danger" style={{marginTop: 8}}>⚠️ Tồn kho dưới định mức ({selectedProduct.minStock})</div>
                    )}
                  </div>

                  <div className="md-info-grid">
                    <div className="md-info-box">
                      <span className="md-info-label">Định mức an toàn</span>
                      <span className="md-info-value">{selectedProduct.minStock} {selectedProduct.unit}</span>
                    </div>
                    <div className="md-info-box">
                      <span className="md-info-label">Nhà cung cấp</span>
                      <span className="md-info-value">{selectedProduct.supplier?.name || 'Không rõ'}</span>
                    </div>
                    <div className="md-info-box">
                      <span className="md-info-label">Giá vốn</span>
                      <span className="md-info-value cost-text">{Number(selectedProduct.costPrice).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="md-info-box">
                      <span className="md-info-label">Giá bán</span>
                      <span className="md-info-value price-text">{Number(selectedProduct.salePrice).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md-detail-empty"
              >
                <div className="empty-icon">📦</div>
                <h3>Chọn một sản phẩm để xem chi tiết</h3>
                <p>Thông tin tồn kho, giá bán và nhà cung cấp sẽ hiển thị tại đây.</p>
              </motion.div>
            )}
          </AnimatePresence>
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
