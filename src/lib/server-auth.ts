import { supabase } from './supabase';

export async function verifyAdmin(request: Request): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized: Missing or invalid token' };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { authorized: false, error: error?.message || 'Unauthorized: Invalid session' };
  }

  return { authorized: true };
}
