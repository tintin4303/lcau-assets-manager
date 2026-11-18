import fs from 'fs';
import path from 'path';
import { EventRequestRecord, EventEquipmentSummary } from '@/types/history';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'event-history.json');

const DEFAULT_HISTORY: EventRequestRecord[] = [
  {
    id: 'hist-1',
    eventName: 'LCAU National Leadership Summit',
    requesterName: 'Alyssa',
    requesterFunction: 'EB',
    assetId: 'S004',
    assetName: 'Extension Power Strip 5m',
    category: 'Stationary',
    rowIndex: 8,
    quantity: 3,
    status: 'returned',
    requestedAt: '2026-10-10T10:00:00Z',
    handedOverAt: '2026-10-12T09:00:00Z',
    returnedAt: '2026-10-15T18:00:00Z',
  },
  {
    id: 'hist-2',
    eventName: 'LCAU National Leadership Summit',
    requesterName: 'Alyssa',
    requesterFunction: 'EB',
    assetId: 'S012',
    assetName: 'Whiteboard Marker Set (Assorted)',
    category: 'Stationary',
    rowIndex: 16,
    quantity: 5,
    status: 'returned',
    requestedAt: '2026-10-10T10:00:00Z',
    handedOverAt: '2026-10-12T09:00:00Z',
    returnedAt: '2026-10-15T18:00:00Z',
  },
  {
    id: 'hist-3',
    eventName: 'Global Village Cultural Fair',
    requesterName: 'Perry',
    requesterFunction: 'MX',
    assetId: 'D003',
    assetName: 'Warm White String Lights (10m)',
    category: 'Decoration',
    rowIndex: 7,
    quantity: 4,
    status: 'returned',
    requestedAt: '2026-10-24T14:30:00Z',
    handedOverAt: '2026-10-26T11:00:00Z',
    returnedAt: '2026-10-28T21:00:00Z',
  },
  {
    id: 'hist-4',
    eventName: 'Global Village Cultural Fair',
    requesterName: 'Perry',
    requesterFunction: 'MX',
    assetId: 'D015',
    assetName: 'Fabric Tablecloth Blue',
    category: 'Decoration',
    rowIndex: 19,
    quantity: 6,
    status: 'returned',
    requestedAt: '2026-10-24T14:30:00Z',
    handedOverAt: '2026-10-26T11:00:00Z',
    returnedAt: '2026-10-28T21:00:00Z',
  },
  {
    id: 'hist-5',
    eventName: 'Culture & Connect Night 2026',
    requesterName: 'Perry',
    requesterFunction: 'MX',
    assetId: 'S001',
    assetName: 'Scissors Stainless Steel',
    category: 'Stationary',
    rowIndex: 5,
    quantity: 2,
    status: 'loaned',
    requestedAt: '2026-11-15T08:00:00Z',
    handedOverAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'hist-6',
    eventName: 'Culture & Connect Night 2026',
    requesterName: 'Perry',
    requesterFunction: 'MX',
    assetId: 'S009',
    assetName: 'Permanent Marker Black',
    category: 'Stationary',
    rowIndex: 13,
    quantity: 3,
    status: 'pending',
    requestedAt: '2026-11-15T08:00:00Z',
  },
];

function readHistory(): EventRequestRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(DEFAULT_HISTORY, null, 2), 'utf8');
      return DEFAULT_HISTORY;
    }
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_HISTORY;
  } catch (err) {
    console.error('Error reading event history storage:', err);
    return DEFAULT_HISTORY;
  }
}

function writeHistory(records: EventRequestRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing event history storage:', err);
  }
}

export function getAllHistory(): EventRequestRecord[] {
  return readHistory();
}

export function getHistoryByEvent(eventName: string): EventRequestRecord[] {
  const records = readHistory();
  const search = eventName.toLowerCase().trim();
  return records.filter((r) => r.eventName.toLowerCase().includes(search) || search.includes(r.eventName.toLowerCase()));
}

export function logBatchRequests(
  reqByRaw: string,
  items: Array<{ category: string; rowIndex: number; reqQty: number; assetId?: string; name?: string }>
): void {
  const records = readHistory();

  // Parse "Name / Function / Event"
  const parts = reqByRaw.split('/').map((s) => s.trim());
  const requesterName = parts[0] || 'Member';
  const requesterFunction = parts[1] || 'General';
  const eventName = parts[2] || 'Operational Request';

  const now = new Date().toISOString();

  items.forEach((item) => {
    const newRecord: EventRequestRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventName,
      requesterName,
      requesterFunction,
      assetId: item.assetId || `ROW-${item.rowIndex}`,
      assetName: item.name || `Asset in ${item.category}`,
      category: item.category,
      rowIndex: item.rowIndex,
      quantity: item.reqQty,
      status: 'pending',
      requestedAt: now,
    };
    records.push(newRecord);
  });

  writeHistory(records);
}

export function updateHistoryStatus(
  category: string,
  rowIndex: number,
  newStatus: 'loaned' | 'returned'
): void {
  const records = readHistory();
  const now = new Date().toISOString();

  // Find the most recent active record for this category & row
  for (let i = records.length - 1; i >= 0; i--) {
    const rec = records[i];
    if (rec.category === category && rec.rowIndex === rowIndex) {
      if (newStatus === 'loaned' && rec.status === 'pending') {
        rec.status = 'loaned';
        rec.handedOverAt = now;
        break;
      } else if (newStatus === 'returned' && (rec.status === 'loaned' || rec.status === 'pending')) {
        rec.status = 'returned';
        rec.returnedAt = now;
        break;
      }
    }
  }

  writeHistory(records);
}

/**
 * Aggregates most requested items (ready for recommender system)
 */
export function getMostRequestedSummary(limit = 10): EventEquipmentSummary[] {
  const records = readHistory();
  const map = new Map<string, EventEquipmentSummary>();

  for (const r of records) {
    const key = r.assetName.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.totalQuantity += r.quantity;
      existing.requestCount += 1;
    } else {
      map.set(key, {
        assetName: r.assetName,
        assetId: r.assetId,
        category: r.category,
        totalQuantity: r.quantity,
        requestCount: 1,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}
