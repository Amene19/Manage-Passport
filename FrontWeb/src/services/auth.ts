import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    // For demo purposes, simulate login
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      const user = {
        id: '1',
        username: 'admin',
        role: 'admin',
      };
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid credentials');
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('user');
  },
};

export default authService; 