
export interface User {
  id: string;
  name?: string;
  role?: string;
  location?: string;
  joinDate?: string;
  email?: string;
}

export interface Notification {
  id: string;
  title?: string;
  message: string;
  createdAt?: string;
  timestamp?: string;
  read: boolean;
  userId?: string;
}
