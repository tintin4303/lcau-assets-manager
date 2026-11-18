export type UserRole = 'requester' | 'holder' | 'lcvp';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  assignedCategories?: string[];
}

export interface CategoryHolderAssignment {
  category: 'Stationary' | 'Decoration' | 'General';
  holderName: string;
  holderEmail: string;
  storageLocation: string;
  lastUpdated: string;
}

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedCategory?: string;
  createdAt: string;
  status: 'active' | 'invited' | 'disabled';
}
