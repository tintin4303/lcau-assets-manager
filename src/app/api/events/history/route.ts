import { NextResponse } from 'next/server';
import { getAllHistory, getHistoryByEvent, getMostRequestedSummary } from '@/lib/event-history-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get('event');
  const summaryOnly = searchParams.get('summary') === 'true';

  if (summaryOnly) {
    const summary = getMostRequestedSummary(15);
    return NextResponse.json({ summary });
  }

  if (eventName) {
    const records = getHistoryByEvent(eventName);
    return NextResponse.json({ records });
  }

  const allRecords = getAllHistory();
  const summary = getMostRequestedSummary(10);

  return NextResponse.json({
    records: allRecords,
    summary,
  });
}
