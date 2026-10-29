// Role-Based Access Control (RBAC) Module Permissions
// Defines module accessibility across system roles: ADMIN, MANAGER, CASHIER

export type ModuleId =
  | 'dashboard'
  | 'pos'
  | 'tables'
  | 'orders'
  | 'menu'
  | 'reports'
  | 'assets'
  | 'audit'
  | 'users'
  | 'settings';

export const ROLE_MODULE_PERMISSIONS: Record<string, ModuleId[]> = {
  // Admin: Full access to all modules and configurations
  ADMIN: [
    'dashboard',
    'pos',
    'tables',
    'orders',
    'menu',
    'reports',
    'assets',
    'audit',
    'users',
    'settings',
  ],
  // Manager: Operational control, menus, reports, inventory & dashboard
  MANAGER: [
    'dashboard',
    'pos',
    'tables',
    'orders',
    'menu',
    'reports',
    'assets',
  ],
  // Cashier: Live POS, table overview, and receipt/order management
  CASHIER: [
    'pos',
    'tables',
    'orders',
  ],
  // Waiter: Ordering, tables, order tracking
  WAITER: [
    'pos',
    'tables',
    'orders',
  ],
};

/**
 * Returns the list of permitted module IDs for the given user role.
 * Defaults to Cashier access if role is unrecognized.
 */
export function getAllowedModules(role?: string): ModuleId[] {
  if (!role) return ROLE_MODULE_PERMISSIONS.CASHIER;
  const normalized = role.toUpperCase().trim();
  if (normalized === 'ADMIN') {
    return ROLE_MODULE_PERMISSIONS.ADMIN;
  }
  return ROLE_MODULE_PERMISSIONS[normalized] || ROLE_MODULE_PERMISSIONS.CASHIER;
}

/**
 * Checks whether a specific module is accessible for the given user role.
 * Admins are granted access to all modules.
 */
export function isModuleAllowed(role: string | undefined, moduleId: string): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase().trim();
  if (normalized === 'ADMIN') return true;
  const allowed = getAllowedModules(normalized);
  return allowed.includes(moduleId as ModuleId);
}

/**
 * Returns the recommended initial landing page for a given role.
 */
export function getDefaultLandingPage(role?: string): ModuleId {
  const allowed = getAllowedModules(role);
  if (allowed.includes('pos')) return 'pos';
  return allowed[0] || 'pos';
}
