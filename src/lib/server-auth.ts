import { supabase } from './supabase';
import { UserRole } from '@/types/rbac';
import { resolveUserRole } from './holder-storage';
import type { User } from '@supabase/supabase-js';

export interface AuthVerification {
  authorized: boolean;
  status: number;
  error?: string;
  user?: User;
  role?: UserRole;
}

/**
 * Verify that the incoming request is authenticated and has one of the allowed roles.
 */
export async function verifyRole(
  request: Request,
  allowedRoles: UserRole[] = ['holder', 'lcvp']
): Promise<AuthVerification> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized: Missing or invalid token',
    };
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      authorized: false,
      status: 401,
      error: error?.message || 'Unauthorized: Invalid session',
    };
  }

  const role = resolveUserRole(user.email || '', user.user_metadata?.role);

  if (!allowedRoles.includes(role)) {
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Role '${role}' is not authorized to perform this action.`,
      user,
      role,
    };
  }

  return {
    authorized: true,
    status: 200,
    user,
    role,
  };
}

/**
 * Backwards compatibility helper for admin actions (both holder and lcvp have admin access)
 */
export async function verifyAdmin(request: Request): Promise<{ authorized: boolean; error?: string; status?: number; role?: UserRole; user?: User }> {
  const result = await verifyRole(request, ['holder', 'lcvp']);
  return {
    authorized: result.authorized,
    error: result.error,
    status: result.status,
    role: result.role,
    user: result.user,
  };
}
