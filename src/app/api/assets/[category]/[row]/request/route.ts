import { NextRequest, NextResponse } from 'next/server';
import { updateAsset } from '@/lib/google-sheets';
import { AssetCategory } from '@/types/asset';

type RouteContext = {
  params: Promise<{
    category: string;
    row: string;
  }>;
};

/**
 * Public (no auth) endpoint for members to request an asset.
 * Writes Req By, Req Qty to the row and sets Status to OUT.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { category, row } = await context.params;
    const rowIndex = parseInt(row, 10);

    if (isNaN(rowIndex) || rowIndex < 5) {
      return NextResponse.json({ error: 'Invalid row index.' }, { status: 400 });
    }

    if (!['Stationary', 'Decoration', 'General'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    const body = await request.json();
    const { reqBy, reqQty } = body;

    if (!reqBy || typeof reqBy !== 'string' || reqBy.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please enter your name and function (e.g. Perry/MX/Culture Night).' },
        { status: 400 }
      );
    }

    const qty = parseInt(reqQty, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Requested quantity must be a positive number.' },
        { status: 400 }
      );
    }

    await updateAsset(category as AssetCategory, rowIndex, {
      status: 'OUT',
      reqBy: reqBy.trim(),
      reqQty: qty,
    });

    return NextResponse.json({ success: true, message: 'Asset requested successfully.' });
  } catch (err: unknown) {
    console.error('Error processing asset request:', err);
    const message = err instanceof Error ? err.message : 'Failed to submit request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
