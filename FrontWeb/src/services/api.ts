import axios from 'axios';
import { Category } from '../components/CategorySelector';

const API_URL = 'https://passport-management-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/api/auth/login')) {
      // Clear token and redirect only if it's not a login request
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export type ScanType = 'Inscan' | 'Outscan';
export type PassportStatus = 'Pending' | 'Processing' | 'ReadyForOutscan' | 'Completed';

export interface PassportData {
  passportId: string;
  scanType: ScanType;
  categories: number[];
  missingRequirement?: string;
}

export interface PassportResponse extends PassportData {
  status: PassportStatus;
  processedBy: string;
  processedAt: string;
}

export interface StatsData {
  totalPassports: number;
  inscannedPassports: number;
  outscannedPassports: number;
  pendingOutscan: number;
  categoryA: number;
  categoryB: number;
  categoryC: number;
  categoryD: number;
  missingDocuments: number;
  invalidDocuments: number;
  additionalInfoRequired: number;
  workerStats: {
    [workerId: string]: {
      name: string;
      inscanned: number;
      outscanned: number;
      pending: number;
    };
  };
}

export interface HistoryEntry extends PassportResponse {
  processedAt: string;
  scanStatus: string;
  categoryNames: string[];
}

export interface WorkerInfo {
  id: string;
  name: string;
  role: 'worker' | 'admin';
}

export const authService = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Also store user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const passportService = {
  getAll: async () => {
    const response = await api.get('/api/passports');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/passports/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/passports', data);
    return response.data;
  },
  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/passports/${id}/status`, { status });
    return response.data;
  },
  scanPassport: async (scanType: ScanType) => {
    const response = await api.post('/api/passports/scan', { scanType });
    return response.data;
  },
  submitPassport: async (data: PassportData) => {
    const response = await api.post('/api/passports/submit', data);
    return response.data;
  },
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/api/categories');
    return response.data;
  },
  getDailyStats: async (): Promise<StatsData> => {
    const response = await api.get('/api/stats/daily');
    return response.data;
  },
  getHistoryByDate: async (date: string): Promise<HistoryEntry[]> => {
    const response = await api.get('/api/stats/history', { params: { date } });
    return response.data;
  },
  getCurrentWorker: async (): Promise<WorkerInfo> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/api/categories');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/categories', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export const statsService = {
  getDailyStats: async (date?: string) => {
    const response = await api.get('/api/stats/daily', { params: { date } });
    return response.data;
  },
  getHistory: async (date?: string) => {
    const response = await api.get('/api/stats/history', { params: { date } });
    return response.data;
  },
};

export default passportService; 
