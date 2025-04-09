import os from 'os';

export const getLocalIPAddress = (): string => {
  const interfaces = os.networkInterfaces();
  
  // Check all network interfaces
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    // Find the first non-internal IPv4 address
    for (const ifaceInfo of iface) {
      if (ifaceInfo.family === 'IPv4' && !ifaceInfo.internal) {
        return ifaceInfo.address;
      }
    }
  }

  // Fallback to localhost if no IP found
  return '127.0.0.1';
};

export const getApiUrl = (): string => {
  const ip = getLocalIPAddress();
  return `http://${ip}:3001/api`;
}; 