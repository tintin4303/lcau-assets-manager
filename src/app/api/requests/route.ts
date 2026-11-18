import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { fetchAllAssets, updateAsset } from '@/lib/google-sheets';
import { updateHistoryStatus } from '@/lib/event-history-storage';
import { AssetCategory } from '@/types/asset';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Allow holder and lcvp to query requests
  const auth = await verifyRole(request, ['holder', 'lcvp']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const assets = await fetchAllAssets();

    // Filter down to assets that have an active request or are currently checked out
    const requests = assets
      .filter((a) => {
        const hasReq = (a.reqQty && a.reqQty > 0) || (a.reqBy && a.reqBy.trim().length > 0);
        const isOut = a.status === 'OUT';
        return hasReq || isOut;
      })
      .map((a) => {
        // Classify request status
        let requestStatus: 'pending_handover' | 'checked_out' | 'unknown' = 'unknown';
        if (a.status === 'OUT') {
          requestStatus = 'checked_out';
        } else if (a.reqQty && a.reqQty > 0) {
          requestStatus = 'pending_handover';
        }

        return {
          ...a,
          requestStatus,
        };
      });

    return NextResponse.json({
      requests,
      userRole: auth.role,
      userEmail: auth.user?.email,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // STRICT RBAC RULE: Physical handover/return MUST be executed by Asset Holders only!
  const auth = await verifyRole(request, ['holder']);
  if (!auth.authorized) {
    if (auth.status === 403 && auth.role === 'lcvp') {
      return NextResponse.json(
        {
          error:
            'LCVP Audit Restriction: Physical handovers and returns must be executed by Asset Holders who physically hold the items.',
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { category, rowIndex, action } = body as {
      category: AssetCategory;
      rowIndex: number;
      action: 'handover' | 'return';
    };

    if (!category || !rowIndex || !action) {
      return NextResponse.json(
        { error: 'Category, rowIndex, and action (handover | return) are required' },
        { status: 400 }
      );
    }

    if (action === 'handover') {
      // Mark OUT: Physical item given to requester
      await updateAsset(category, rowIndex, {
        status: 'OUT',
      });
      updateHistoryStatus(category, rowIndex, 'loaned');
      return NextResponse.json({
        success: true,
        message: 'Item handed over and marked as OUT.',
      });
    } else if (action === 'return') {
      // Mark IN: Physical item received back into storage, clear requester fields
      await updateAsset(category, rowIndex, {
        status: 'IN',
        reqBy: '',
        reqQty: 0,
      });
      updateHistoryStatus(category, rowIndex, 'returned');
      return NextResponse.json({
        success: true,
        message: 'Item marked as returned (IN).',
      });
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process request action' },
      { status: 500 }
    );
  }
}
