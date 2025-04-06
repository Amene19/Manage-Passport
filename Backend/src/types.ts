export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'worker';
} 