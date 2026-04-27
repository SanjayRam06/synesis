export interface Transaction {
  id?: string;
  userId: string;
  date: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  originalText: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  onboarded?: boolean;
  upiLinked?: boolean;
  linkedVpa?: string;
  darkMode?: boolean;
  emailNotifications?: boolean;
}

export const CATEGORIES = [
  'Online Shopping',
  'Bills & Recharges',
  'Peer-to-Peer',
  'Food & Dining',
  'Travel',
  'Health & Wellness',
  'Entertainment',
  'Investments',
  'Others',
  'Income'
];
