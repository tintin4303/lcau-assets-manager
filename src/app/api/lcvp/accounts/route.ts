import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { getAccounts, createOrUpdateAccount, deleteAccount } from '@/lib/holder-storage';
import { hashPassword } from '@/lib/auth-passwords';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // STRICT LCVP RBAC GATING: Only LCVP can view user accounts directory
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Access to LCVP Account Management requires LCVP role.' },
      { status: auth.status === 401 ? 401 : 403 }
    );
  }

  const accounts = getAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  // STRICT LCVP RBAC GATING: Only LCVP can create or update user accounts
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Only LCVP (Finance & Legality) can provision user accounts.' },
      { status: auth.status === 401 ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, name, role, assignedCategory, status, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (role && !['holder', 'lcvp'].includes(role)) {
      return NextResponse.json({ error: 'Role must be holder or lcvp' }, { status: 400 });
    }

    let hashedPassword: string | undefined = undefined;
    if (password && password.trim().length > 0) {
      hashedPassword = await hashPassword(password.trim());
    } else {
      hashedPassword = await hashPassword('LCAU2026!');
    }

    const saved = createOrUpdateAccount({
      email,
      name,
      password: hashedPassword,
      role: role || 'holder',
      assignedCategory,
      status: status || 'active',
    });

    return NextResponse.json({ success: true, account: saved });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  // STRICT LCVP RBAC GATING: Only LCVP can delete user accounts
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Only LCVP (Finance & Legality) can delete user accounts.' },
      { status: auth.status === 401 ? 401 : 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const ok = deleteAccount(id);
    if (!ok) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete account' },
      { status: 500 }
    );
  }
}
