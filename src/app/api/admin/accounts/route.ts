import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { getAccounts, createOrUpdateAccount, deleteAccount } from '@/lib/holder-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Only LCVP can view and manage user accounts
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        error:
          auth.status === 403
            ? 'Access restricted: Only LCVP (Finance & Legality) can manage user accounts.'
            : auth.error,
      },
      { status: auth.status }
    );
  }

  const accounts = getAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        error:
          auth.status === 403
            ? 'Only LCVP (Finance & Legality) can create or update accounts.'
            : auth.error,
      },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const { email, name, role, assignedCategory, status } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (role && !['holder', 'lcvp'].includes(role)) {
      return NextResponse.json({ error: 'Role must be holder or lcvp' }, { status: 400 });
    }

    const saved = createOrUpdateAccount({
      email,
      name,
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
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        error:
          auth.status === 403
            ? 'Only LCVP (Finance & Legality) can delete user accounts.'
            : auth.error,
      },
      { status: auth.status }
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
