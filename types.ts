
export type UserRole = 'Président' | 'Trésorier' | 'Membre';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Member extends User {
  phone?: string;
  identifier?: string; // matricule
  filiere?: string;
  niveau?: string;
  status: UserStatus;
}

export type TransactionType = 'entree' | 'sortie';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  label: string;
  description?: string;
  date: string;
  memberId: string;
  memberName: string; // Denormalized for display convenience in this mock
  status: TransactionStatus;
  receiptUrl?: string;
}

export interface ReimbursementRequest {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  date: string;
  receiptUrl?: string;
}

export interface CommunityMessage {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  date: string;
  attachmentUrl?: string;
}

export interface AppSettings {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface ChartData {
  name: string;
  value: number;
}