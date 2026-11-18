import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveUserRole } from '@/lib/holder-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({
      authenticated: false,
      role: 'requester',
      user: null,
    });
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({
      authenticated: false,
      role: 'requester',
      user: null,
    });
  }

  const role = resolveUserRole(user.email || '', user.user_metadata?.role);

  return NextResponse.json({
    authenticated: true,
    role,
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      role,
    },
  });
}
