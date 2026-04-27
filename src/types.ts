export type TransactionType = 'debit' | 'credit';

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  category: string;
  date: string;
  originalText?: string;
  createdAt: string;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  limit: number;
  month: string;
  year: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  onboarded?: boolean;
  upiLinked?: boolean;
  linkedVpa?: string;
}

export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Investment',
  'Income',
  'Others'
];
