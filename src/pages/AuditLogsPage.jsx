import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'

export default function AuditLogsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadData(params = {}) {
    setLoading(true)
    setError('')
    try {
      const queryParams = {
        search: params.search ?? search,
        page: params.page ?? page,
        limit: 20,
      }
      if (params.actionFilter ?? actionFilter) queryParams.action = params.actionFilter ?? actionFilter
      if (params.resourceFilter ?? resourceFilter) queryParams.resource = params.resourceFilter ?? resourceFilter

      const response = await api.get(`/audit-logs?${buildQuery(queryParams)}`)
      const payload = response.data?.data || {}
      setItems(payload.items || [])
      setMeta(payload.meta || meta)
    } catch (err) {
      setError(parseApiError(err, 'Lỗi khi tải nhật ký hệ thống'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ search, page, actionFilter, resourceFilter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, actionFilter, resourceFilter])

  function formatDetails(details) {
    if (!details) return '-'
    try {
      const obj = typeof details === 'string' ? JSON.parse(details) : details
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ')
    } catch {
      return String(details)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Nhật ký hệ thống</h1>
        <p className="hero-copy">Theo dõi mọi thay đổi dữ liệu quan trọng (chỉ Quản trị viên)</p>
      </div>

      {error && <p className="error-banner" style={{ marginBottom: '1rem' }}>{error}</p>}

      <section className="resource-panel" style={{ maxWidth: '100%' }}>
        <div className="resource-header">
          <div>
            <p className="section-label">Bảo mật</p>
            <h2>Lịch sử hoạt động</h2>
          </div>
        </div>

        <div className="filter-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            className="field-input"
            style={{ flex: '1 1 200px' }}
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
          <select
            className="field-select"
            style={{ flex: '0 0 200px' }}
            value={actionFilter}
            onChange={(e) => { setPage(1); setActionFilter(e.target.value) }}
          >
            <option value="">Tất cả hành động</option>
            <option value="APPROVE_IMPORT">Duyệt nhập kho</option>
            <option value="APPROVE_EXPORT">Duyệt xuất kho</option>
            <option value="COMPLETE_INVENTORY_CHECK">Chốt kiểm kê</option>
            <option value="UPDATE_RETURN_STATUS">Cập nhật trả hàng</option>
          </select>
          <select
            className="field-select"
            style={{ flex: '0 0 200px' }}
            value={resourceFilter}
            onChange={(e) => { setPage(1); setResourceFilter(e.target.value) }}
          >
            <option value="">Tất cả tài nguyên</option>
            <option value="ImportReceipt">Phiếu nhập</option>
            <option value="ExportReceipt">Phiếu xuất</option>
            <option value="InventoryCheck">Kiểm kê</option>
            <option value="ReturnReceipt">Trả hàng</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Hành động</th>
                <th>Tài nguyên</th>
                <th>ID đối tượng</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmpty colSpan={5} text="Đang tải dữ liệu..." />
              ) : items.length === 0 ? (
                <TableEmpty colSpan={5} text="Không tìm thấy bản ghi nhật ký nào" />
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Thời gian">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td data-label="Hành động">
                      <span className="badge badge--pending">{item.action}</span>
                    </td>
                    <td data-label="Tài nguyên">{item.resource}</td>
                    <td data-label="ID đối tượng">
                      <code style={{ fontSize: '0.8rem' }}>{item.resourceId ? item.resourceId.slice(0, 8) + '...' : '-'}</code>
                    </td>
                    <td data-label="Chi tiết">
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDetails(item.details)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={setPage} loading={loading} />
      </section>
    </div>
  )
}
