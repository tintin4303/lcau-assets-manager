import { NextRequest, NextResponse } from 'next/server';
import { fetchAllAssets, createAsset } from '@/lib/google-sheets';
import { verifyAdmin } from '@/lib/server-auth';
import { CreateAssetInput } from '@/types/asset';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const assets = await fetchAllAssets();
    return NextResponse.json(
      { assets },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Error fetching assets:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch assets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateAssetInput;

    if (!body.id || !body.name || !body.category) {
      return NextResponse.json(
        { error: 'Asset ID, Name, and Category are required.' },
        { status: 400 }
      );
    }

    if (!['Stationary', 'Decoration', 'General'].includes(body.category)) {
      return NextResponse.json(
        { error: 'Category must be Stationary, Decoration, or General.' },
        { status: 400 }
      );
    }

    if (body.status !== 'IN' && body.status !== 'OUT') {
      body.status = 'IN';
    }

    await createAsset(body);
    return NextResponse.json({ success: true, message: 'Asset created successfully.' });
  } catch (err: unknown) {
    console.error('Error creating asset:', err);
    const message = err instanceof Error ? err.message : 'Failed to create asset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
