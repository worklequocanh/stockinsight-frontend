import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../management.css'

const tabs = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'suppliers', label: 'Suppliers' },
]

const emptyCategoryForm = {
  id: '',
  name: '',
  description: '',
}

const emptySupplierForm = {
  id: '',
  name: '',
  phone: '',
  email: '',
  address: '',
}

const emptyProductForm = {
  id: '',
  sku: '',
  barcode: '',
  name: '',
  unit: '',
  minStock: '0',
  costPrice: '',
  salePrice: '',
  currentStock: '0',
  categoryId: '',
  supplierId: '',
}

function buildQuery(params) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

function parseApiError(error, fallback) {
  return error?.response?.data?.message || fallback
}

function TableEmpty({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="table-empty">
        {text}
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('products')

  const [categoryItems, setCategoryItems] = useState([])
  const [categoryMeta, setCategoryMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryPage, setCategoryPage] = useState(1)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categorySaving, setCategorySaving] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)

  const [supplierItems, setSupplierItems] = useState([])
  const [supplierMeta, setSupplierMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [supplierSaving, setSupplierSaving] = useState(false)
  const [supplierError, setSupplierError] = useState('')
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm)

  const [productItems, setProductItems] = useState([])
  const [productMeta, setProductMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productCategoryFilter, setProductCategoryFilter] = useState('')
  const [productSupplierFilter, setProductSupplierFilter] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [productSaving, setProductSaving] = useState(false)
  const [productError, setProductError] = useState('')
  const [productForm, setProductForm] = useState(emptyProductForm)

  async function loadCategories(params = {}) {
    setCategoryLoading(true)
    setCategoryError('')

    try {
      const response = await api.get(`/categories?${buildQuery({ search: params.search ?? categorySearch, page: params.page ?? categoryPage, limit: 10 })}`)
      const payload = response.data?.data || {}
      setCategoryItems(payload.items || [])
      setCategoryMeta(payload.meta || categoryMeta)
    } catch (error) {
      setCategoryError(parseApiError(error, 'Failed to load categories'))
    } finally {
      setCategoryLoading(false)
    }
  }

  async function loadSuppliers(params = {}) {
    setSupplierLoading(true)
    setSupplierError('')

    try {
      const response = await api.get(`/suppliers?${buildQuery({ search: params.search ?? supplierSearch, page: params.page ?? supplierPage, limit: 10 })}`)
      const payload = response.data?.data || {}
      setSupplierItems(payload.items || [])
      setSupplierMeta(payload.meta || supplierMeta)
    } catch (error) {
      setSupplierError(parseApiError(error, 'Failed to load suppliers'))
    } finally {
      setSupplierLoading(false)
    }
  }

  async function loadProducts(params = {}) {
    setProductLoading(true)
    setProductError('')

    try {
      const response = await api.get(
        `/products?${buildQuery({
          search: params.search ?? productSearch,
          page: params.page ?? productPage,
          limit: 10,
          categoryId: params.categoryId ?? productCategoryFilter,
          supplierId: params.supplierId ?? productSupplierFilter,
        })}`,
      )
      const payload = response.data?.data || {}
      setProductItems(payload.items || [])
      setProductMeta(payload.meta || productMeta)
    } catch (error) {
      setProductError(parseApiError(error, 'Failed to load products'))
    } finally {
      setProductLoading(false)
    }
  }

  useEffect(() => {
    loadCategories({ search: categorySearch, page: categoryPage })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySearch, categoryPage])

  useEffect(() => {
    loadSuppliers({ search: supplierSearch, page: supplierPage })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierSearch, supplierPage])

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts({
        search: productSearch,
        page: productPage,
        categoryId: productCategoryFilter,
        supplierId: productSupplierFilter,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, productSearch, productPage, productCategoryFilter, productSupplierFilter])

  async function submitCategory(event) {
    event.preventDefault()
    setCategorySaving(true)
    setCategoryError('')

    const payload = {
      name: categoryForm.name,
      description: categoryForm.description,
    }

    try {
      if (categoryForm.id) {
        await api.put(`/categories/${categoryForm.id}`, payload)
      } else {
        await api.post('/categories', payload)
      }

      setCategoryForm(emptyCategoryForm)
      setCategoryPage(1)
      await loadCategories({ search: categorySearch, page: 1 })
      if (activeTab === 'products') {
        await loadProducts({
          search: productSearch,
          page: productPage,
          categoryId: productCategoryFilter,
          supplierId: productSupplierFilter,
        })
      }
    } catch (error) {
      setCategoryError(parseApiError(error, 'Failed to save category'))
    } finally {
      setCategorySaving(false)
    }
  }

  async function submitSupplier(event) {
    event.preventDefault()
    setSupplierSaving(true)
    setSupplierError('')

    const payload = {
      name: supplierForm.name,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
    }

    try {
      if (supplierForm.id) {
        await api.put(`/suppliers/${supplierForm.id}`, payload)
      } else {
        await api.post('/suppliers', payload)
      }

      setSupplierForm(emptySupplierForm)
      setSupplierPage(1)
      await loadSuppliers({ search: supplierSearch, page: 1 })
      if (activeTab === 'products') {
        await loadProducts({
          search: productSearch,
          page: productPage,
          categoryId: productCategoryFilter,
          supplierId: productSupplierFilter,
        })
      }
    } catch (error) {
      setSupplierError(parseApiError(error, 'Failed to save supplier'))
    } finally {
      setSupplierSaving(false)
    }
  }

  async function submitProduct(event) {
    event.preventDefault()
    setProductSaving(true)
    setProductError('')

    const payload = {
      sku: productForm.sku,
      barcode: productForm.barcode,
      name: productForm.name,
      unit: productForm.unit,
      minStock: productForm.minStock,
      costPrice: productForm.costPrice,
      salePrice: productForm.salePrice,
      currentStock: productForm.currentStock,
      categoryId: productForm.categoryId,
      supplierId: productForm.supplierId,
    }

    try {
      if (productForm.id) {
        await api.put(`/products/${productForm.id}`, payload)
      } else {
        await api.post('/products', payload)
      }

      setProductForm(emptyProductForm)
      setProductPage(1)
      await loadProducts({
        search: productSearch,
        page: 1,
        categoryId: productCategoryFilter,
        supplierId: productSupplierFilter,
      })
    } catch (error) {
      setProductError(parseApiError(error, 'Failed to save product'))
    } finally {
      setProductSaving(false)
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm('Delete this category?')) {
      return
    }

    try {
      await api.delete(`/categories/${id}`)
      if (categoryForm.id === id) {
        setCategoryForm(emptyCategoryForm)
      }
      setCategoryPage(1)
      await loadCategories({ search: categorySearch, page: categoryPage })
      if (activeTab === 'products') {
        await loadProducts({
          search: productSearch,
          page: productPage,
          categoryId: productCategoryFilter,
          supplierId: productSupplierFilter,
        })
      }
    } catch (error) {
      setCategoryError(parseApiError(error, 'Failed to delete category'))
    }
  }

  async function deleteSupplier(id) {
    if (!window.confirm('Delete this supplier?')) {
      return
    }

    try {
      await api.delete(`/suppliers/${id}`)
      if (supplierForm.id === id) {
        setSupplierForm(emptySupplierForm)
      }
      setSupplierPage(1)
      await loadSuppliers({ search: supplierSearch, page: supplierPage })
      if (activeTab === 'products') {
        await loadProducts({
          search: productSearch,
          page: productPage,
          categoryId: productCategoryFilter,
          supplierId: productSupplierFilter,
        })
      }
    } catch (error) {
      setSupplierError(parseApiError(error, 'Failed to delete supplier'))
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) {
      return
    }

    try {
      await api.delete(`/products/${id}`)
      if (productForm.id === id) {
        setProductForm(emptyProductForm)
      }
      setProductPage(1)
      await loadProducts({
        search: productSearch,
        page: productPage,
        categoryId: productCategoryFilter,
        supplierId: productSupplierFilter,
      })
    } catch (error) {
      setProductError(parseApiError(error, 'Failed to delete product'))
    }
  }

  function editCategory(item) {
    setActiveTab('categories')
    setCategoryForm({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
    })
  }

  function editSupplier(item) {
    setActiveTab('suppliers')
    setSupplierForm({
      id: item.id,
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
    })
  }

  function editProduct(item) {
    setActiveTab('products')
    setProductForm({
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
  }

  function renderPagination(meta, onPageChange, loading) {
    return (
      <div className="pagination-bar">
        <button type="button" className="text-button" onClick={() => onPageChange(meta.page - 1)} disabled={loading || meta.page <= 1}>
          Previous
        </button>
        <span>
          Page {meta.page} of {meta.totalPages} | {meta.total} items
        </span>
        <button type="button" className="text-button" onClick={() => onPageChange(meta.page + 1)} disabled={loading || meta.page >= meta.totalPages}>
          Next
        </button>
      </div>
    )
  }

  function renderProductsSection() {
    return (
      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Master data</p>
              <h2>Products</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setProductForm(emptyProductForm)}>
              New product
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search by name, SKU, barcode"
              value={productSearch}
              onChange={(event) => {
                setProductPage(1)
                setProductSearch(event.target.value)
              }}
            />
            <select
              className="field-select"
              value={productCategoryFilter}
              onChange={(event) => {
                setProductPage(1)
                setProductCategoryFilter(event.target.value)
              }}
            >
              <option value="">All categories</option>
              {categoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="field-select"
              value={productSupplierFilter}
              onChange={(event) => {
                setProductPage(1)
                setProductSupplierFilter(event.target.value)
              }}
            >
              <option value="">All suppliers</option>
              {supplierItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {productError ? <p className="error-banner">{productError}</p> : null}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productLoading ? (
                  <TableEmpty colSpan={7} text="Loading products..." />
                ) : productItems.length === 0 ? (
                  <TableEmpty colSpan={7} text="No products found" />
                ) : (
                  productItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.sku}</td>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="muted-line">{item.barcode || 'No barcode'}</div>
                      </td>
                      <td>{item.category?.name || '-'}</td>
                      <td>{item.supplier?.name || '-'}</td>
                      <td>
                        <strong>{item.currentStock}</strong>
                        <div className="muted-line">Min {item.minStock}</div>
                      </td>
                      <td>
                        <div className="muted-line">Cost: {Number(item.costPrice).toLocaleString()}</div>
                        <div className="muted-line">Sale: {Number(item.salePrice).toLocaleString()}</div>
                      </td>
                      <td className="actions-cell">
                        <button type="button" className="text-button" onClick={() => editProduct(item)}>
                          Edit
                        </button>
                        <button type="button" className="text-button danger" onClick={() => deleteProduct(item.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(productMeta, setProductPage, productLoading)}
        </section>

        <aside className="resource-panel form-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">{productForm.id ? 'Edit product' : 'Create product'}</p>
              <h2>{productForm.id ? productForm.sku || 'Product details' : 'New product'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={submitProduct}>
            <div className="two-col">
              <label>
                SKU
                <input className="field-input" value={productForm.sku} onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))} required />
              </label>
              <label>
                Barcode
                <input className="field-input" value={productForm.barcode} onChange={(event) => setProductForm((prev) => ({ ...prev, barcode: event.target.value }))} />
              </label>
            </div>

            <label>
              Name
              <input className="field-input" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </label>

            <div className="two-col">
              <label>
                Unit
                <input className="field-input" value={productForm.unit} onChange={(event) => setProductForm((prev) => ({ ...prev, unit: event.target.value }))} required />
              </label>
              <label>
                Category
                <select className="field-select" value={productForm.categoryId} onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))} required>
                  <option value="">Select category</option>
                  {categoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Supplier
              <select className="field-select" value={productForm.supplierId} onChange={(event) => setProductForm((prev) => ({ ...prev, supplierId: event.target.value }))} required>
                <option value="">Select supplier</option>
                {supplierItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="three-col">
              <label>
                Min stock
                <input type="number" min="0" className="field-input" value={productForm.minStock} onChange={(event) => setProductForm((prev) => ({ ...prev, minStock: event.target.value }))} />
              </label>
              <label>
                Cost price
                <input type="number" min="0" step="0.01" className="field-input" value={productForm.costPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, costPrice: event.target.value }))} required />
              </label>
              <label>
                Sale price
                <input type="number" min="0" step="0.01" className="field-input" value={productForm.salePrice} onChange={(event) => setProductForm((prev) => ({ ...prev, salePrice: event.target.value }))} required />
              </label>
            </div>

            <label>
              Current stock
              <input type="number" min="0" className="field-input" value={productForm.currentStock} onChange={(event) => setProductForm((prev) => ({ ...prev, currentStock: event.target.value }))} />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={productSaving}>
                {productSaving ? 'Saving...' : productForm.id ? 'Update product' : 'Create product'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setProductForm(emptyProductForm)}>
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>
    )
  }

  function renderCategoriesSection() {
    return (
      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Master data</p>
              <h2>Categories</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setCategoryForm(emptyCategoryForm)}>
              New category
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search categories"
              value={categorySearch}
              onChange={(event) => {
                setCategoryPage(1)
                setCategorySearch(event.target.value)
              }}
            />
          </div>

          {categoryError ? <p className="error-banner">{categoryError}</p> : null}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryLoading ? (
                  <TableEmpty colSpan={3} text="Loading categories..." />
                ) : categoryItems.length === 0 ? (
                  <TableEmpty colSpan={3} text="No categories found" />
                ) : (
                  categoryItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.description || '-'}</td>
                      <td className="actions-cell">
                        <button type="button" className="text-button" onClick={() => editCategory(item)}>
                          Edit
                        </button>
                        <button type="button" className="text-button danger" onClick={() => deleteCategory(item.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(categoryMeta, setCategoryPage, categoryLoading)}
        </section>

        <aside className="resource-panel form-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">{categoryForm.id ? 'Edit category' : 'Create category'}</p>
              <h2>{categoryForm.id ? categoryForm.name || 'Category details' : 'New category'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={submitCategory}>
            <label>
              Name
              <input className="field-input" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </label>
            <label>
              Description
              <textarea className="field-textarea" rows="6" value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={categorySaving}>
                {categorySaving ? 'Saving...' : categoryForm.id ? 'Update category' : 'Create category'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setCategoryForm(emptyCategoryForm)}>
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>
    )
  }

  function renderSuppliersSection() {
    return (
      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Master data</p>
              <h2>Suppliers</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setSupplierForm(emptySupplierForm)}>
              New supplier
            </button>
          </div>

          <div className="filter-row">
            <input
              className="field-input"
              placeholder="Search suppliers"
              value={supplierSearch}
              onChange={(event) => {
                setSupplierPage(1)
                setSupplierSearch(event.target.value)
              }}
            />
          </div>

          {supplierError ? <p className="error-banner">{supplierError}</p> : null}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supplierLoading ? (
                  <TableEmpty colSpan={4} text="Loading suppliers..." />
                ) : supplierItems.length === 0 ? (
                  <TableEmpty colSpan={4} text="No suppliers found" />
                ) : (
                  supplierItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>
                        <div className="muted-line">{item.phone || '-'}</div>
                        <div className="muted-line">{item.email || '-'}</div>
                      </td>
                      <td>{item.address || '-'}</td>
                      <td className="actions-cell">
                        <button type="button" className="text-button" onClick={() => editSupplier(item)}>
                          Edit
                        </button>
                        <button type="button" className="text-button danger" onClick={() => deleteSupplier(item.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(supplierMeta, setSupplierPage, supplierLoading)}
        </section>

        <aside className="resource-panel form-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">{supplierForm.id ? 'Edit supplier' : 'Create supplier'}</p>
              <h2>{supplierForm.id ? supplierForm.name || 'Supplier details' : 'New supplier'}</h2>
            </div>
          </div>

          <form className="resource-form" onSubmit={submitSupplier}>
            <label>
              Name
              <input className="field-input" value={supplierForm.name} onChange={(event) => setSupplierForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </label>
            <div className="two-col">
              <label>
                Phone
                <input className="field-input" value={supplierForm.phone} onChange={(event) => setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </label>
              <label>
                Email
                <input type="email" className="field-input" value={supplierForm.email} onChange={(event) => setSupplierForm((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
            </div>
            <label>
              Address
              <textarea className="field-textarea" rows="6" value={supplierForm.address} onChange={(event) => setSupplierForm((prev) => ({ ...prev, address: event.target.value }))} />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={supplierSaving}>
                {supplierSaving ? 'Saving...' : supplierForm.id ? 'Update supplier' : 'Create supplier'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setSupplierForm(emptySupplierForm)}>
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>
    )
  }

  return (
    <main className="management-shell">
      <section className="management-hero">
        <div>
          <p className="eyebrow">Phase 3</p>
          <h1>Quản lý dữ liệu nền</h1>
          <p className="hero-copy">
            CRUD cho categories, suppliers và products với search, filter và phân trang.
          </p>
        </div>

        <div className="session-card">
          <span className="session-label">Signed in as</span>
          <strong>{user?.name}</strong>
          <span className="session-meta">{user?.email}</span>
          <span className="session-meta">{user?.role}</span>
          <button type="button" className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <section className="tabs-shell">
        <div className="tabs-row">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'products' ? renderProductsSection() : null}
          {activeTab === 'categories' ? renderCategoriesSection() : null}
          {activeTab === 'suppliers' ? renderSuppliersSection() : null}
        </div>
      </section>
    </main>
  )
}
