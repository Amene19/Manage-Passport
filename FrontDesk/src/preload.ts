import { contextBridge, ipcRenderer } from 'electron';
import config from './config';

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
        const baseUrl = config.api.baseUrl;
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
        
        // For GET requests with data, append as query parameters
        let url = `${baseUrl}${endpoint}`;
        if ((method === 'GET' || method === 'HEAD') && data) {
          const queryParams = new URLSearchParams();
          for (const key in data) {
            queryParams.append(key, data[key]);
          }
          url += `?${queryParams.toString()}`;
        }
        
        console.log(`Making ${method} request to: ${url}`);
        const response = await fetch(url, options);
        return await response.json();
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