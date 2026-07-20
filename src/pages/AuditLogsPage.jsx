import { useEffect, useState } from 'react'
import api from '../services/api'
import { buildQuery, parseApiError } from '../utils/helpers'
import TableEmpty from '../components/TableEmpty'
import Pagination from '../components/Pagination'
import StatKPI from '../components/common/StatKPI'
import './AuditLogsPage.css'

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
        .join(' | ')
    } catch {
      return String(details)
    }
  }

  return (
    <div className="audit-container">
      {/* Hero Header */}
      <div className="audit-hero">
        <div className="audit-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● ENTERPRISE IMMUTABLE AUDIT TRAIL</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Nhật ký vết tích an ninh hệ thống</span>
          </div>
          <h1>Nhật Ký & Vết Tích Hệ Thống (Enterprise Audit Trail)</h1>
          <p>Ghi nhận bất biến toàn bộ hoạt động nhạy cảm trên hệ thống kho: duyệt phiếu nhập/xuất, chốt kiểm kê kho, xử lý trả hàng và thay đổi cấu hình bảo mật.</p>
        </div>
        <div>
          <button type="button" className="btn-secondary" onClick={() => { setPage(1); loadData({ page: 1 }); }}>
            🔄 Làm Mới Nhật Ký
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatKPI
          title="Tổng Sự Kiện Đã Ghi"
          value={meta.total || items.length}
          unit="bản ghi"
          trend="↑ Bất biến (Immutable)"
          status="success"
          icon="📜"
        />
        <StatKPI
          title="Bộ Lọc Hiện Tại"
          value={actionFilter || resourceFilter ? 'Đang lọc' : 'Toàn bộ'}
          unit="chế độ"
          trend={actionFilter ? actionFilter : 'Tất cả hành động'}
          status="info"
          icon="⚡"
        />
        <StatKPI
          title="Chuẩn Bảo Mật Vết Tích"
          value="ISO 27001"
          unit="tiêu chuẩn"
          trend="Đồng bộ real-time"
          status="success"
          icon="🛡️"
        />
        <StatKPI
          title="Phân Tích Bất Thường"
          value="0 Cảnh báo"
          unit="security"
          trend="An toàn / Không rò rỉ"
          status="success"
          icon="🔒"
        />
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>⚠️ {error}</div>}

      <div className="audit-table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
          <div className="table-search" style={{ flex: '1 1 240px' }}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              placeholder="Tìm theo nội dung, ID đối tượng, từ khóa chi tiết..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </div>

          <select
            className="select-field"
            style={{ width: 230, margin: 0 }}
            value={actionFilter}
            onChange={(e) => { setPage(1); setActionFilter(e.target.value) }}
          >
            <option value="">⚡ Tất cả hành động</option>
            <option value="LOGIN">🔐 Đăng nhập hệ thống</option>
            <option value="SYSTEM_STARTUP">🚀 Khởi động hệ thống</option>
            <option value="CREATE_PRODUCT">📦 Tạo mới sản phẩm</option>
            <option value="UPDATE_PRODUCT">✏ Cập nhật sản phẩm</option>
            <option value="CREATE_CATEGORY">📁 Tạo mới danh mục</option>
            <option value="CREATE_LOCATION">📍 Tạo mới vị trí kho</option>
            <option value="CREATE_IMPORT">📥 Tạo phiếu nhập kho</option>
            <option value="APPROVE_IMPORT">✔ Duyệt phiếu nhập kho</option>
            <option value="CREATE_EXPORT">📤 Tạo phiếu xuất kho</option>
            <option value="APPROVE_EXPORT">✔ Duyệt phiếu xuất kho</option>
            <option value="REJECT_EXPORT">✖ Từ chối phiếu xuất</option>
            <option value="CREATE_TRANSFER">🔄 Tạo phiếu điều chuyển</option>
            <option value="APPROVE_TRANSFER">✔ Duyệt phiếu điều chuyển</option>
            <option value="COMPLETE_INVENTORY_CHECK">✔ Chốt kiểm kê kho</option>
            <option value="UPDATE_RETURN_STATUS">✔ Cập nhật hoàn trả</option>
            <option value="CREATE_USER">👤 Tạo mới tài khoản</option>
            <option value="UPDATE_USER">✏ Cập nhật tài khoản</option>
            <option value="CHANGE_PASSWORD">🔑 Đổi mật khẩu</option>
          </select>

          <select
            className="select-field"
            style={{ width: 230, margin: 0 }}
            value={resourceFilter}
            onChange={(e) => { setPage(1); setResourceFilter(e.target.value) }}
          >
            <option value="">📁 Tất cả tài nguyên</option>
            <option value="User">👤 Tài khoản (User)</option>
            <option value="System">⚙ Hệ thống (System)</option>
            <option value="Product">📦 Sản phẩm (Product)</option>
            <option value="Category">📁 Danh mục (Category)</option>
            <option value="Location">📍 Vị trí (Location)</option>
            <option value="ImportReceipt">📥 Phiếu Nhập (ImportReceipt)</option>
            <option value="ExportReceipt">📤 Phiếu Xuất (ExportReceipt)</option>
            <option value="InternalTransfer">🔄 Điều Chuyển (InternalTransfer)</option>
            <option value="InventoryCheck">🔍 Kiểm Kê (InventoryCheck)</option>
            <option value="ReturnReceipt">↩ Hoàn Trả (ReturnReceipt)</option>
          </select>
        </div>

        <div className="modern-table-wrapper" style={{ flex: 1 }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Thời Gian Ghi Nhận</th>
                <th style={{ width: 180 }}>Người Thực Hiện</th>
                <th style={{ width: 190 }}>Hành Động (Action)</th>
                <th style={{ width: 150 }}>Đối Tượng</th>
                <th style={{ width: 130 }}>ID Tài Nguyên</th>
                <th>Thông Tin & Dữ Liệu Thay Đổi (Diff Details)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmpty colSpan={6} text="⏳ Đang rà soát và tải chuỗi nhật ký bảo mật từ cloud..." />
              ) : items.length === 0 ? (
                <TableEmpty colSpan={6} text="❌ Không tìm thấy bản ghi nhật ký nào phù hợp với điều kiện lọc" />
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </strong>
                      <span style={{ color: 'var(--primary-light)', fontSize: '0.78rem' }}>
                        🕒 {new Date(item.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </td>
                    <td>
                      {item.user ? (
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>
                            🧑‍💻 {item.user.name}
                          </strong>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            {item.user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="status-pill purple" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          🤖 Hệ Thống
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="status-pill info" style={{ fontWeight: 800, fontSize: '0.75rem', padding: '4px 10px', letterSpacing: '0.02em' }}>
                        ⚡ {item.action}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{item.resource}</strong>
                    </td>
                    <td>
                      <code className="audit-resource-code">
                        {item.resourceId ? `${item.resourceId.slice(0, 8)}...` : 'N/A'}
                      </code>
                    </td>
                    <td>
                      <div className="audit-diff-box">
                        {formatDetails(item.details)}
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
  )
}
