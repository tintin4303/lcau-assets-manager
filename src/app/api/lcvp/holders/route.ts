import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { getHolderAssignments, updateHolderAssignment } from '@/lib/holder-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // STRICT LCVP RBAC GATING: Only LCVP can access this endpoint
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Access to LCVP Holder Management requires LCVP role.' },
      { status: auth.status === 401 ? 401 : 403 }
    );
  }

  const assignments = getHolderAssignments();
  return NextResponse.json({ assignments, userRole: auth.role });
}

export async function PUT(request: Request) {
  // STRICT LCVP RBAC GATING: Only LCVP can reassign asset holders
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Only LCVP (Finance & Legality) can reassign asset holders.' },
      { status: auth.status === 401 ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const { category, holderName, holderEmail, storageLocation } = body;

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const updated = updateHolderAssignment({
      category,
      holderName,
      holderEmail,
      storageLocation,
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update holder assignment' },
      { status: 500 }
    );
  }
}
