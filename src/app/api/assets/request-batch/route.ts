import { NextRequest, NextResponse } from 'next/server';
import { batchRequestAssets, BatchRequestItem } from '@/lib/google-sheets';
import { logBatchRequests } from '@/lib/event-history-storage';
import { AssetCategory } from '@/types/asset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reqBy, items } = body;

    if (!reqBy || typeof reqBy !== 'string' || reqBy.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please enter your name and function (e.g. Perry / MX / Culture Night).' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one item to request.' },
        { status: 400 }
      );
    }

    const validatedItems: BatchRequestItem[] = [];
    for (const item of items) {
      const rowIndex = parseInt(item.rowIndex, 10);
      const reqQty = parseInt(item.reqQty, 10);

      if (isNaN(rowIndex) || rowIndex < 5) {
        return NextResponse.json({ error: `Invalid row index: ${item.rowIndex}` }, { status: 400 });
      }

      if (!['Stationary', 'Decoration', 'General'].includes(item.category)) {
        return NextResponse.json({ error: `Invalid category: ${item.category}` }, { status: 400 });
      }

      if (isNaN(reqQty) || reqQty <= 0) {
        return NextResponse.json({ error: `Quantity must be positive for all items.` }, { status: 400 });
      }

      validatedItems.push({
        category: item.category as AssetCategory,
        rowIndex,
        reqQty,
      });
    }

    await batchRequestAssets(reqBy.trim(), validatedItems);

    // Record in Event Equipment History
    logBatchRequests(reqBy.trim(), items);

    return NextResponse.json({
      success: true,
      message: `Successfully submitted request for ${validatedItems.length} items.`,
    });
  } catch (err: unknown) {
    console.error('Error processing batch request:', err);
    const message = err instanceof Error ? err.message : 'Failed to submit batch request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
