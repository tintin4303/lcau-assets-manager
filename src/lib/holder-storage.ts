import fs from 'fs';
import path from 'path';
import { CategoryHolderAssignment, AccountRecord, UserRole } from '@/types/rbac';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'rbac-data.json');

interface RBACData {
  assignments: Record<string, CategoryHolderAssignment>;
  accounts: AccountRecord[];
}

const DEFAULT_DATA: RBACData = {
  assignments: {
    Stationary: {
      category: 'Stationary',
      holderName: 'Tim (Master Tin)',
      holderEmail: 'nyunttin@aiesec.net',
      storageLocation: 'Student Lounge Locker 4A',
      lastUpdated: new Date().toISOString(),
    },
    Decoration: {
      category: 'Decoration',
      holderName: 'Alyssa Intawong',
      holderEmail: 'alyssa.intawong@aiesec.net',
      storageLocation: 'Student Lounge Cabinet 2',
      lastUpdated: new Date().toISOString(),
    },
    General: {
      category: 'General',
      holderName: 'Tim (Master Tin)',
      holderEmail: 'nyunttin@aiesec.net',
      storageLocation: 'Student Lounge Locker 4A',
      lastUpdated: new Date().toISOString(),
    },
  },
  accounts: [
    {
      id: 'acc-1',
      email: 'nyunttin@aiesec.net',
      name: 'Tim (Master Tin)',
      role: 'holder',
      assignedCategory: 'Stationary & General',
      createdAt: '2026-09-01T00:00:00Z',
      status: 'active',
    },
    {
      id: 'acc-2',
      email: 'alyssa.intawong@aiesec.net',
      name: 'Alyssa Intawong',
      role: 'lcvp',
      createdAt: '2026-09-01T00:00:00Z',
      status: 'active',
    },
  ],
};

function readData(): RBACData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading RBAC storage:', err);
    return DEFAULT_DATA;
  }
}

function writeData(data: RBACData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing RBAC storage:', err);
  }
}

export function getHolderAssignments(): CategoryHolderAssignment[] {
  const data = readData();
  return Object.values(data.assignments);
}

export function updateHolderAssignment(assignment: Partial<CategoryHolderAssignment> & { category: string }): CategoryHolderAssignment {
  const data = readData();
  const cat = assignment.category;
  const existing = data.assignments[cat] || {
    category: cat as 'Stationary' | 'Decoration' | 'General',
    holderName: '',
    holderEmail: '',
    storageLocation: '',
    lastUpdated: new Date().toISOString(),
  };

  const updated: CategoryHolderAssignment = {
    ...existing,
    ...assignment,
    category: cat as 'Stationary' | 'Decoration' | 'General',
    lastUpdated: new Date().toISOString(),
  };

  data.assignments[cat] = updated;
  writeData(data);
  return updated;
}

export function getAccounts(): AccountRecord[] {
  const data = readData();
  return data.accounts;
}

export function createOrUpdateAccount(account: Partial<AccountRecord> & { email: string }): AccountRecord {
  const data = readData();
  const existingIndex = data.accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());

  if (existingIndex >= 0) {
    const updated = {
      ...data.accounts[existingIndex],
      ...account,
    };
    data.accounts[existingIndex] = updated;
    writeData(data);
    return updated;
  } else {
    const newAccount: AccountRecord = {
      id: `acc-${Date.now()}`,
      email: account.email.toLowerCase(),
      name: account.name || account.email.split('@')[0],
      role: account.role || 'holder',
      assignedCategory: account.assignedCategory || '',
      createdAt: new Date().toISOString(),
      status: account.status || 'invited',
    };
    data.accounts.push(newAccount);
    writeData(data);
    return newAccount;
  }
}

export function deleteAccount(id: string): boolean {
  const data = readData();
  const initialLength = data.accounts.length;
  data.accounts = data.accounts.filter((a) => a.id !== id);
  if (data.accounts.length !== initialLength) {
    writeData(data);
    return true;
  }
  return false;
}

export function resolveUserRole(email: string, userMetadataRole?: string): UserRole {
  if (userMetadataRole === 'lcvp') return 'lcvp';
  if (userMetadataRole === 'holder') return 'holder';

  // Check stored accounts
  const data = readData();
  const match = data.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (match) return match.role;

  // Check LCVP configuration environment
  const lcvpEmails = (process.env.LCVP_EMAILS || 'alyssa.intawong@aiesec.net,lcvp.finance@aiesec.net').toLowerCase().split(',');
  if (lcvpEmails.includes(email.toLowerCase())) return 'lcvp';

  // Default authenticated role is holder
  return 'holder';
}
