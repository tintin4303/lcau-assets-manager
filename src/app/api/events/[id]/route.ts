import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { updateEvent, deleteEvent } from '@/lib/event-storage';
import { UpdateEventInput } from '@/types/event';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRole(request, ['holder', 'lcvp']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as UpdateEventInput;
    const updated = updateEvent(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRole(request, ['holder', 'lcvp']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const ok = deleteEvent(id);
    if (!ok) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete event' },
      { status: 500 }
    );
  }
}
