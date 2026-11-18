import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { getHolderAssignments, updateHolderAssignment } from '@/lib/holder-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyRole(request, ['holder', 'lcvp']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const assignments = getHolderAssignments();
  return NextResponse.json({ assignments, userRole: auth.role });
}

export async function PUT(request: Request) {
  // Only LCVP can modify category holder assignments
  const auth = await verifyRole(request, ['lcvp']);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        error:
          auth.status === 403
            ? 'Only LCVP (Finance & Legality) can reassign asset holders.'
            : auth.error,
      },
      { status: auth.status }
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
