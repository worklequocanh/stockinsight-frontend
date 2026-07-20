import React from 'react'

const STATUS_MAP = {
  // Receipt Statuses
  APPROVED: { label: 'Đã duyệt', variant: 'success', icon: '✓' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success', icon: '✓' },
  ACTIVE: { label: 'Hoạt động', variant: 'success', icon: '●' },
  PENDING: { label: 'Chờ duyệt', variant: 'warning', icon: '⏳' },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'warning', icon: '↻' },
  DRAFT: { label: 'Bản nháp', variant: 'info', icon: '✎' },
  REJECTED: { label: 'Từ chối', variant: 'danger', icon: '✕' },
  CANCELED: { label: 'Đã hủy', variant: 'danger', icon: '✕' },
  INACTIVE: { label: 'Khóa', variant: 'danger', icon: '●' },

  // Export Types
  SALE: { label: 'Xuất bán', variant: 'info', icon: '📦' },
  INTERNAL: { label: 'Sử dụng nội bộ', variant: 'purple', icon: '🏢' },
  DAMAGED: { label: 'Hàng hư hỏng / Hủy', variant: 'danger', icon: '💥' },
  TRANSFER: { label: 'Điều chuyển kho', variant: 'warning', icon: '⇄' },
}

export default function StatusBadge({ status, customLabel, variant, icon }) {
  const mapped = STATUS_MAP[status] || {
    label: customLabel || status || 'N/A',
    variant: variant || 'info',
    icon: icon || '•'
  }

  const badgeClass = `status-pill ${mapped.variant}`

  return (
    <span className={badgeClass} style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '6px', 
      padding: '5px 12px', 
      borderRadius: '999px', 
      fontSize: '0.8rem', 
      fontWeight: 600 
    }}>
      {mapped.icon && <span>{mapped.icon}</span>}
      <span>{customLabel || mapped.label}</span>
    </span>
  )
}
