import fs from 'fs';
import path from 'path';
import { LCAUEvent, CreateEventInput, UpdateEventInput } from '@/types/event';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

const DEFAULT_EVENTS: LCAUEvent[] = [
  {
    id: 'evt-1',
    name: 'Culture & Connect Night 2026',
    date: '2026-11-28',
    organizingFunction: 'MX',
    location: 'AU Suvarnabhumi Campus, CL Plaza',
    description: 'Cultural bonding and community building event for incoming exchange participants and members.',
    status: 'upcoming',
    createdBy: 'alyssa@aiesec.net',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'evt-2',
    name: 'LCAU Induction Day 26.27',
    date: '2026-12-05',
    organizingFunction: 'PM',
    location: 'John Paul II Hall, AU',
    description: 'Welcoming and onboarding new team members into LCAU.',
    status: 'upcoming',
    createdBy: 'nyunttin@aiesec.net',
    createdAt: '2026-11-05T00:00:00Z',
  },
  {
    id: 'evt-3',
    name: 'General Operations & Meeting',
    date: '2026-12-31',
    organizingFunction: 'All LC',
    location: 'Student Lounge Locker 4A',
    description: 'Day-to-day LC team meetings and general operational use.',
    status: 'ongoing',
    createdBy: 'nyunttin@aiesec.net',
    createdAt: '2026-11-01T00:00:00Z',
  },
];

function readEvents(): LCAUEvent[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EVENTS_FILE)) {
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(DEFAULT_EVENTS, null, 2), 'utf8');
      return DEFAULT_EVENTS;
    }
    const raw = fs.readFileSync(EVENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_EVENTS;
  } catch (err) {
    console.error('Error reading events storage:', err);
    return DEFAULT_EVENTS;
  }
}

function writeEvents(events: LCAUEvent[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing events storage:', err);
  }
}

export function getEvents(): LCAUEvent[] {
  const events = readEvents();
  // Sort: upcoming and ongoing first, ordered by date ascending
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getUpcomingEvents(): LCAUEvent[] {
  const events = readEvents();
  return events
    .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function createEvent(input: CreateEventInput, creatorEmail?: string): LCAUEvent {
  const events = readEvents();
  const newEvent: LCAUEvent = {
    ...input,
    id: `evt-${Date.now()}`,
    status: input.status || 'upcoming',
    createdBy: creatorEmail || 'system',
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  writeEvents(events);
  return newEvent;
}

export function updateEvent(id: string, input: UpdateEventInput): LCAUEvent | null {
  const events = readEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const updated: LCAUEvent = {
    ...events[index],
    ...input,
  };

  events[index] = updated;
  writeEvents(events);
  return updated;
}

export function deleteEvent(id: string): boolean {
  const events = readEvents();
  const initialLen = events.length;
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length !== initialLen) {
    writeEvents(filtered);
    return true;
  }
  return false;
}
