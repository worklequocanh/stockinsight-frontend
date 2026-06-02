export default function Pagination({ meta, onPageChange, loading }) {
  return (
    <div className="pagination-bar">
      <button type="button" className="text-button" onClick={() => onPageChange(meta.page - 1)} disabled={loading || meta.page <= 1}>
        Trước
      </button>
      <span>
        Trang {meta.page} / {meta.totalPages} | {meta.total} mục
      </span>
      <button type="button" className="text-button" onClick={() => onPageChange(meta.page + 1)} disabled={loading || meta.page >= meta.totalPages}>
        Tiếp
      </button>
    </div>
  )
}
