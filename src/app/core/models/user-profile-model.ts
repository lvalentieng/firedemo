export interface Account {
  uid: string;
  email: string;
  displayName: string;
  role: 'pending' | 'user' | 'admin';
  createdAt: Date;
}