// This polyfill is for the renderer process to ensure 'process' is available

// Create a global process object if it doesn't exist
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = {
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    // Add other properties as needed
    platform: navigator.platform.toLowerCase().includes('win') ? 'win32' : 
              navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'linux',
    version: '', // Will be filled by Electron
    // Add any other properties your code might be using
    nextTick: (callback: Function) => {
      setTimeout(callback, 0);
    }
  };
}

export {}; 