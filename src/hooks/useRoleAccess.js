import { useAuth } from '../context/AuthContext'

/**
 * Custom hook to centralize role-based access control logic.
 * Usage: const { canApprove, canManageCatalog, isEmployee, isAdmin } = useRoleAccess()
 */
export function useRoleAccess() {
  const { user } = useAuth()
  const role = user?.role

  return {
    role,
    isAdmin: role === 'ADMIN',
    isWarehouseManager: role === 'WAREHOUSE_MANAGER',
    isEmployee: role === 'EMPLOYEE',

    // Approve/Reject receipts (Import, Export)
    canApprove: role === 'ADMIN' || role === 'WAREHOUSE_MANAGER',

    // CRUD on catalog data (Products, Categories, Suppliers, Customers, Locations)
    canManageCatalog: role === 'ADMIN' || role === 'WAREHOUSE_MANAGER',

    // Access advanced warehouse ops (Transfers, Inventory Checks, Returns)
    canAccessWarehouseOps: role === 'ADMIN' || role === 'WAREHOUSE_MANAGER',

    // Access reports
    canViewReports: role === 'ADMIN' || role === 'WAREHOUSE_MANAGER',

    // Manage users — Admin only
    canManageUsers: role === 'ADMIN',

    // View audit logs — Admin only
    canViewAuditLogs: role === 'ADMIN',

    // Create receipts (Import / Export) — all roles
    canCreateReceipt: role === 'ADMIN' || role === 'WAREHOUSE_MANAGER' || role === 'EMPLOYEE',
  }
}
