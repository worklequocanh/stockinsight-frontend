export const STATUS_MAP = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối'
};

export const ROLE_MAP = {
  ADMIN: 'Quản trị viên',
  WAREHOUSE_MANAGER: 'Quản lý kho',
  EMPLOYEE: 'Nhân viên'
};

export const EXPORT_TYPE_MAP = {
  SALE: 'Bán hàng',
  INTERNAL: 'Nội bộ',
  DAMAGED: 'Hư hỏng',
  TRANSFER: 'Điều chuyển'
};

export const CHECK_STATUS_MAP = {
  DRAFT: 'Nháp',
  IN_PROGRESS: 'Đang kiểm',
  COMPLETED: 'Đã chốt',
  CANCELED: 'Đã hủy'
};

export const RETURN_STATUS_MAP = {
  PENDING: 'Chờ xử lý',
  INSPECTED: 'Đã kiểm tra',
  RETURNED_TO_STOCK: 'Đã nhập lại kho',
  DISCARDED: 'Đã tiêu hủy'
};

export function translateStatus(status) {
  return STATUS_MAP[status] || status;
}

export function translateRole(role) {
  return ROLE_MAP[role] || role;
}

export function translateExportType(type) {
  return EXPORT_TYPE_MAP[type] || type;
}

export function translateCheckStatus(status) {
  return CHECK_STATUS_MAP[status] || status;
}

export function translateReturnStatus(status) {
  return RETURN_STATUS_MAP[status] || status;
}
