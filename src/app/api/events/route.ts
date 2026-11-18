import { NextResponse } from 'next/server';
import { verifyRole } from '@/lib/server-auth';
import { getEvents, getUpcomingEvents, createEvent } from '@/lib/event-storage';
import { CreateEventInput } from '@/types/event';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');

  // If requesting upcoming events (e.g. for request dropdown), allow public access
  if (filter === 'upcoming') {
    const upcoming = getUpcomingEvents();
    return NextResponse.json({ events: upcoming });
  }

  // Otherwise return all events (if authenticated as holder or lcvp, full list; if unauth, return upcoming)
  const auth = await verifyRole(request, ['holder', 'lcvp']);
  if (!auth.authorized) {
    const upcoming = getUpcomingEvents();
    return NextResponse.json({ events: upcoming });
  }

  const events = getEvents();
  return NextResponse.json({ events, userRole: auth.role });
}

export async function POST(request: Request) {
  // Both Asset Holder and LCVP can create events
  const auth = await verifyRole(request, ['holder', 'lcvp']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, date, organizingFunction, location, description, status } = body as CreateEventInput;

    if (!name || !date) {
      return NextResponse.json(
        { error: 'Event name and date are required.' },
        { status: 400 }
      );
    }

    const created = createEvent(
      {
        name: name.trim(),
        date: date.trim(),
        organizingFunction: organizingFunction ? organizingFunction.trim() : 'All LC',
        location: location ? location.trim() : '',
        description: description ? description.trim() : '',
        status: status || 'upcoming',
      },
      auth.user?.email
    );

    return NextResponse.json({ success: true, event: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create event' },
      { status: 500 }
    );
  }
}
