import { NextRequest, NextResponse } from 'next/server';
import { updateAsset, deleteAsset } from '@/lib/google-sheets';
import { verifyAdmin } from '@/lib/server-auth';
import { AssetCategory, UpdateAssetInput } from '@/types/asset';

type RouteContext = {
  params: Promise<{
    category: string;
    row: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { category, row } = await context.params;
    const rowIndex = parseInt(row, 10);

    if (isNaN(rowIndex) || rowIndex < 5) {
      return NextResponse.json({ error: 'Invalid row index.' }, { status: 400 });
    }

    if (!['Stationary', 'Decoration', 'General'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    const body = (await request.json()) as UpdateAssetInput;

    if (body.status && body.status !== 'IN' && body.status !== 'OUT') {
      return NextResponse.json({ error: 'Status must be IN or OUT.' }, { status: 400 });
    }

    await updateAsset(category as AssetCategory, rowIndex, body);
    return NextResponse.json({ success: true, message: 'Asset updated successfully.' });
  } catch (err: unknown) {
    console.error('Error updating asset:', err);
    const message = err instanceof Error ? err.message : 'Failed to update asset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { category, row } = await context.params;
    const rowIndex = parseInt(row, 10);

    if (isNaN(rowIndex) || rowIndex < 5) {
      return NextResponse.json({ error: 'Invalid row index.' }, { status: 400 });
    }

    if (!['Stationary', 'Decoration', 'General'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    await deleteAsset(category as AssetCategory, rowIndex);
    return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (err: unknown) {
    console.error('Error deleting asset:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete asset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
