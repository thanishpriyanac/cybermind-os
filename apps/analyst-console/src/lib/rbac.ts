import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'ADMIN' | 'ANALYST' | 'GUEST';

export type FeaturePermission =
  | 'dashboard'
  | 'cve'
  | 'firewall'
  | 'qbr'
  | 'ai_chat'
  | 'user_management'
  | 'model_management'
  | 'api_keys'
  | 'system_settings'
  | 'audit_logs'
  | 'config_upload'
  | 'cve_sync';

export type PermissionAction = 'read' | 'write' | 'delete' | 'admin';

const PERMISSION_MATRIX: Record<FeaturePermission, Record<UserRole, { read: boolean; write: boolean; delete: boolean; admin: boolean }>> = {
  dashboard: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: false, delete: false, admin: false },
    GUEST: { read: true, write: false, delete: false, admin: false },
  },
  cve: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: true, delete: false, admin: false },
    GUEST: { read: true, write: false, delete: false, admin: false },
  },
  firewall: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: true, delete: false, admin: false },
    GUEST: { read: true, write: false, delete: false, admin: false }, // restricted read
  },
  qbr: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: true, delete: false, admin: false },
    GUEST: { read: true, write: false, delete: false, admin: false },
  },
  ai_chat: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: true, delete: false, admin: false },
    GUEST: { read: true, write: true, delete: false, admin: false },
  },
  user_management: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: false, write: false, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
  model_management: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: false, write: false, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
  api_keys: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: false, write: false, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
  system_settings: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: false, write: false, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
  audit_logs: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: false, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
  config_upload: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: true, write: true, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
  cve_sync: {
    ADMIN: { read: true, write: true, delete: true, admin: true },
    ANALYST: { read: false, write: false, delete: false, admin: false },
    GUEST: { read: false, write: false, delete: false, admin: false },
  },
};

export function hasPermission(role: UserRole, feature: FeaturePermission, action: PermissionAction = 'read'): boolean {
  const perm = PERMISSION_MATRIX[feature]?.[role];
  if (!perm) return false;
  return !!perm[action];
}

export function getUserRoleFromRequest(req: NextRequest): UserRole {
  const roleHeader = req.headers.get('x-user-role') || req.headers.get('X-User-Role');
  if (roleHeader) {
    const uRole = roleHeader.toUpperCase();
    if (uRole === 'ADMIN' || uRole === 'SUPER_ADMIN') return 'ADMIN';
    if (uRole === 'ANALYST' || uRole === 'SOC_ANALYST') return 'ANALYST';
    if (uRole === 'GUEST' || uRole === 'VIEWER') return 'GUEST';
  }

  const cookieRole = req.cookies.get('user_role')?.value;
  if (cookieRole) {
    const cRole = cookieRole.toUpperCase();
    if (cRole === 'ADMIN' || cRole === 'SUPER_ADMIN') return 'ADMIN';
    if (cRole === 'ANALYST' || cRole === 'SOC_ANALYST') return 'ANALYST';
    if (cRole === 'GUEST' || cRole === 'VIEWER') return 'GUEST';
  }

  // Default fallback role for authenticated API context
  return 'ANALYST';
}

export function enforceApiPermission(req: NextRequest, feature: FeaturePermission, action: PermissionAction = 'read') {
  const role = getUserRoleFromRequest(req);
  if (!hasPermission(role, feature, action)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Role '${role}' is not authorized to perform '${action}' on '${feature}'`,
        requiredRole: 'ADMIN',
      },
      { status: 403 }
    );
  }
  return null;
}
