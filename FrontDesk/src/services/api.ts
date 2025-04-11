import axios from 'axios';

// Define base URL from environment or default to localhost
const BASE_URL = process.env.REACT_APP_API_URL || 'https://passport-management-backend.onrender.com';

// Create an axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set longer timeout to avoid quick failures
  timeout: 10000
});

// Add a request interceptor to add auth token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Skip transformation for auth endpoints
    if (response.config.url?.includes('/auth/')) {
      return response;
    }
    
    // Transform the response to provide consistent format
    if (response.data && !response.data.data && !response.data.error) {
      // If the API returns raw data without wrapping it in a 'data' property,
      // transform it to our expected format
      return {
        ...response,
        data: {
          data: response.data,
          success: true
        }
      };
    }
    return response;
  },
  (error) => {
    console.error('API error response:', error);
    
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    }
    
    // Create a standardized error response
    const errorResponse = {
      error: {
        message: error.message || 'Unknown error occurred',
        status: error.response?.status || 500,
        data: error.response?.data || null
      },
      // Make sure there's always some data to work with
      data: []
    };
    
    // Return a rejected promise with our formatted error
    return Promise.reject(errorResponse);
  }
);

// Auth services
export const authService = {
  login: async (username: string, password: string) => {
    try {
      console.log('Attempting login for user:', username);
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response:', response.data);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        console.error('Invalid login response:', response.data);
        throw new Error('Invalid login response: missing token or user data');
      }
      
      // Store the token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any stale data on login error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
  },
  
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
      
      const user = JSON.parse(userStr);
      if (!user || typeof user !== 'object') {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
      
      return user;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      // Clear invalid data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user && user !== 'undefined' && user !== 'null');
  }
};

// Passport services with proper error handling
export const passportService = {
  getPassports: async (params: any = {}) => {
    try {
      const response = await api.get('/passports', { params });
      // Transform the response to match our expected format
      return {
        data: Array.isArray(response.data) ? response.data : [],
        success: true
      };
    } catch (error) {
      console.error('Error fetching passports:', error);
      throw error;
    }
  },
  
  getPassportById: async (id: string) => {
    try {
      const response = await api.get(`/passports/${id}`);
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error(`Error fetching passport ${id}:`, error);
      throw error;
    }
  },
  
  updatePassport: async (id: string, data: any) => {
    try {
      // Format the data before sending
      const formattedData = {
        applicantName: data.applicantName || null,
        applicantId: data.applicantId || null,
        category: data.category || null,
        status: data.status || 'pending',
        missingRequirements: Array.isArray(data.missingRequirements) ? data.missingRequirements : []
      };

      console.log('Sending update request:', { id, data: formattedData });
      const response = await api.put(`/passports/${id}`, formattedData);
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error(`Error updating passport ${id}:`, error);
      throw error;
    }
  },
  
  deletePassport: async (id: string) => {
    try {
      const response = await api.delete(`/passports/${id}`);
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error(`Error deleting passport ${id}:`, error);
      throw error;
    }
  },
  
  getCategories: async () => {
    try {
      return await api.get('/categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  
  getRequirements: async () => {
    try {
      return await api.get('/requirements');
    } catch (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }
  }
};

// Stats services
export const statsService = {
  getDailyStats: (date?: string) => api.get('/stats/daily', { params: { date } }),
  
  getHistory: (date?: string) => api.get('/stats/history', { params: { date } }),
  
  getWorkerStats: (workerId: number) => api.get(`/stats/worker/${workerId}`),
  
  getWorkerPassports: (workerId: number, date?: string) => 
    api.get(`/stats/worker/${workerId}/passports`, { params: { date } })
};

// Worker services
export const workerService = {
  getWorkers: () => api.get('/workers'),
  
  getWorkerById: (id: number) => api.get(`/workers/${id}`),
  
  updateWorker: (id: number, data: any) => api.put(`/workers/${id}`, data),
  
  createWorker: (data: any) => api.post('/workers', data),
  
  deleteWorker: (id: number) => api.delete(`/workers/${id}`)
};

export default api; 
