export default function Pagination({ meta, onPageChange, loading }) {
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
