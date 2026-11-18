export interface LCAUEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  organizingFunction: string; // e.g. 'MX', 'BD', 'oGX', 'iGV', 'FnL', 'PM', 'Marketing', 'EB'
  location?: string;
  description?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy?: string;
  createdAt: string;
}

export type CreateEventInput = Omit<LCAUEvent, 'id' | 'createdAt'>;
export type UpdateEventInput = Partial<CreateEventInput> & { status?: LCAUEvent['status'] };
