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

  let userEmail: string | undefined = undefined;
  let userMetadataRole: string | undefined = undefined;
  let userName: string | undefined = undefined;
  let userId: string | undefined = undefined;

  // 1. Try Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (user) {
    userId = user.id;
    userEmail = user.email;
    userName = user.user_metadata?.name || user.email?.split('@')[0];
    userMetadataRole = user.user_metadata?.role;
  } else if (token.startsWith('custom:')) {
    // 2. Try custom token
    try {
      const raw = Buffer.from(token.replace('custom:', ''), 'base64').toString('utf8');
      const payload = JSON.parse(raw);
      if (payload && payload.email) {
        userId = payload.id;
        userEmail = payload.email;
        userName = payload.name;
        userMetadataRole = payload.role;
      }
    } catch {
      // Invalid
    }
  }

  if (!userEmail) {
    return NextResponse.json({
      authenticated: false,
      role: 'requester',
      user: null,
    });
  }

  const role = resolveUserRole(userEmail, userMetadataRole);

  return NextResponse.json({
    authenticated: true,
    role,
    user: {
      id: userId || 'user',
      email: userEmail,
      name: userName || userEmail.split('@')[0],
      role,
    },
  });
}
