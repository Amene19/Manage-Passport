import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels = ['app-ready', 'passport-save', 'passport-delete'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['app-ready-reply', 'passport-saved', 'passport-deleted'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (_, ...args) => func(...args));
      }
    },
    // Expose a way to call the API directly
    callApi: async (endpoint: string, method: string, data?: any) => {
      try {
        const baseUrl = 'https://passport-management-backend.onrender.com';
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
        
        // Create options based on HTTP method
        let options: RequestInit = {
          method,
          headers
        };
        
        // Only add body for non-GET/HEAD requests
        if (method !== 'GET' && method !== 'HEAD' && data) {
          options.body = JSON.stringify(data);
        }
        
        // Ensure endpoint starts with /api
        let apiEndpoint = endpoint;
        if (!endpoint.startsWith('/api')) {
          apiEndpoint = `/api${endpoint}`;
        }
        
        // For GET requests with data, append as query parameters
        let url = `${baseUrl}${apiEndpoint}`;
        if ((method === 'GET' || method === 'HEAD') && data) {
          const queryParams = new URLSearchParams();
          for (const key in data) {
            queryParams.append(key, data[key]);
          }
          url += `?${queryParams.toString()}`;
        }
        
        console.log(`Making ${method} request to: ${url}`);
        
        // Use AbortController to implement timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 200000); // 200 second timeout
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          return await response.json();
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out after 200 seconds');
          }
          throw fetchError;
        }
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    }
  }
);

// Expose a limited subset of process.env to the renderer
contextBridge.exposeInMainWorld('process', {
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production'
  },
  platform: process.platform
}); 