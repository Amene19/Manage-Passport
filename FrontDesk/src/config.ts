/**
 * Application configuration
 * This file contains environment-specific settings for the application
 */

interface Config {
  api: {
    baseUrl: string;
    endpoints: {
      login: string;
      signup: string;
      users: string;
      workers: string;
      passports: string;
      stats: string;
      categories: string;
      requirements: string;
      history: string;
      workerStats: string;
      workerPassports: string;
    };
  };
}

// Development configuration (using local backend)
const devConfig: Config = {
  api: {
    baseUrl: 'https://passport-management-backend.onrender.com',
    endpoints: {
      login: '/api/auth/login',
      signup: '/api/auth/signup',
      users: '/api/users',
      workers: '/api/workers',
      passports: '/api/passports',
      stats: '/api/stats/daily',
      categories: '/api/categories',
      requirements: '/api/requirements',
      history: '/api/stats/history',
      workerStats: '/api/stats/worker',
      workerPassports: '/api/stats/worker/passports',
    },
  },
};

// Production configuration
const prodConfig: Config = {
  api: {
    baseUrl: process.env.API_URL || 'https://passport-management-backend.onrender.com',
    endpoints: {
      login: '/api/auth/login',
      signup: '/api/auth/signup',
      users: '/api/users',
      workers: '/api/workers',
      passports: '/api/passports',
      stats: '/api/stats/daily',
      categories: '/api/categories',
      requirements: '/api/requirements',
      history: '/api/stats/history',
      workerStats: '/api/stats/worker',
      workerPassports: '/api/stats/worker/passports',
    },
  },
};

// Select the configuration based on the environment
const config: Config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

export default config; 