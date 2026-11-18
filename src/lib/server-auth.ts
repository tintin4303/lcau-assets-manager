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
 * Supports both Supabase JWT sessions and custom bcrypt authentication tokens.
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

  let userEmail: string | undefined = undefined;
  let userMetadataRole: string | undefined = undefined;
  let resolvedUser: User | undefined = undefined;

  // 1. Try Supabase session verification
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (user) {
    userEmail = user.email;
    userMetadataRole = user.user_metadata?.role;
    resolvedUser = user;
  } else if (token.startsWith('custom:')) {
    // 2. Try custom bcrypt auth token
    try {
      const raw = Buffer.from(token.replace('custom:', ''), 'base64').toString('utf8');
      const payload = JSON.parse(raw);
      if (payload && payload.email) {
        userEmail = payload.email;
        userMetadataRole = payload.role;
        resolvedUser = {
          id: payload.id,
          email: payload.email,
          user_metadata: { role: payload.role, name: payload.name },
        } as unknown as User;
      }
    } catch {
      // Invalid custom token format
    }
  }

  if (!resolvedUser || !userEmail) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized: Invalid or expired session',
    };
  }

  const role = resolveUserRole(userEmail, userMetadataRole);

  if (!allowedRoles.includes(role)) {
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Role '${role}' is not authorized to perform this action.`,
      user: resolvedUser,
      role,
    };
  }

  return {
    authorized: true,
    status: 200,
    user: resolvedUser,
    role,
  };
}

/**
 * Backwards compatibility helper for admin actions
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
