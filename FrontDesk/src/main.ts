import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as os from 'os';

// Check for squirrel events on Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Comment out the electron-reload code that's causing the error
// if (process.env.NODE_ENV === 'development') {
//   require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
//   });
// }

let mainWindow: Electron.BrowserWindow | null;
let backendProcess: any = null;
let frontWebProcess: any = null;

// Function to get the local IP address
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

// Function to start the FrontWeb application
function startFrontWebApp() {
  console.log('Starting FrontWeb application...');
  
  // Get the path to the FrontWeb directory
  let frontWebPath = path.join(__dirname, '..', '..', 'FrontWeb');
  
  // Check if we're in a packaged app (production mode)
  if (app.isPackaged) {
    // In packaged app, the FrontWeb is in extraResources
    frontWebPath = path.join(process.resourcesPath, 'FrontWeb');
    console.log('Running in production mode, using FrontWeb path:', frontWebPath);
  } else {
    console.log('Running in development mode, using FrontWeb path:', frontWebPath);
  }
  
  // Check if the FrontWeb directory exists
  if (!fs.existsSync(frontWebPath)) {
    console.error(`ERROR: FrontWeb directory not found at ${frontWebPath}`);
    return;
  }
  
  // Get the local IP address
  const localIp = getLocalIpAddress();
  
  // Start the FrontWeb app using npm run dev
  frontWebProcess = spawn('npm', ['run', 'dev'], { 
    cwd: frontWebPath,
    shell: true,
    stdio: 'pipe',
    env: {
      ...process.env,
      // Set VITE_HOST to ensure it binds to all interfaces
      VITE_HOST: '0.0.0.0',
      VITE_PORT: '3000'
    }
  });
  
  // Log FrontWeb output
  frontWebProcess.stdout.on('data', (data: Buffer) => {
    console.log(`FrontWeb stdout: ${data.toString()}`);
  });
  
  frontWebProcess.stderr.on('data', (data: Buffer) => {
    const error = data.toString();
    console.error(`FrontWeb stderr: ${error}`);
    
    // Check for common errors
    if (error.includes('EADDRINUSE')) {
      console.log('Port 3000 already in use. FrontWeb or another service might be already running.');
      
      // Show dialog to user
      if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'FrontWeb App Issue',
          message: 'The FrontWeb application could not start because port 3000 is already in use.',
          detail: 'This could mean that:\n1. The FrontWeb app is already running\n2. Another application is using port 3000\n\nWorkers can access the web interface at http://' + localIp + ':3000',
          buttons: ['OK']
        });
      }
      
      // Check if we need to terminate the process
      if (frontWebProcess) {
        console.log('Terminating failed FrontWeb process...');
        frontWebProcess.kill();
        frontWebProcess = null;
      }
    }
  });
  
  frontWebProcess.on('close', (code: number) => {
    console.log(`FrontWeb process exited with code ${code}`);
    frontWebProcess = null;
  });
  
  // Show notification about the web interface
  console.log(`FrontWeb interface will be available at: http://${localIp}:3000`);
  
  // Show message to the user after a short delay
  setTimeout(() => {
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Web Interface Available',
        message: 'Web Interface Ready for Workers',
        detail: `Workers on the same network can access the web interface at:\n\nhttp://${localIp}:3000\n\nShare this address with your team.`,
        buttons: ['OK']
      });
    }
  }, 10000); // Show after 10 seconds to give time for the app to start
}

// Function to start the dummy server as fallback
function startDummyServer() {
  console.log('Starting dummy server as fallback...');
  
  let appDir = path.join(__dirname, '..');
  let dummyServerPath = path.join(appDir, 'dummy-server.js');
  
  // Check if we're in a packaged app (production mode)
  if (app.isPackaged) {
    // In packaged app, the dummy-server.js is included in the app resources
    appDir = path.dirname(app.getAppPath());
    dummyServerPath = path.join(appDir, 'dummy-server.js');
    console.log('Running in production mode, using dummy server at:', dummyServerPath);
  } else {
    console.log('Running in development mode, using dummy server at:', dummyServerPath);
  }
  
  if (!fs.existsSync(dummyServerPath)) {
    console.error(`ERROR: Dummy server not found at ${dummyServerPath}`);
    return;
  }
  
  backendProcess = spawn('node', [dummyServerPath], {
    cwd: appDir,
    shell: true,
    stdio: 'pipe'
  });
  
  backendProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Dummy server stdout: ${data.toString()}`);
  });
  
  backendProcess.stderr.on('data', (data: Buffer) => {
    console.error(`Dummy server stderr: ${data.toString()}`);
  });
  
  backendProcess.on('close', (code: number) => {
    console.log(`Dummy server process exited with code ${code}`);
    backendProcess = null;
  });
  
  console.log('Waiting for dummy server to initialize...');
}

// Function to start the backend server
function startBackendServer() {
  console.log('Starting backend server...');
  
  // Get the path to the Backend directory
  // In development mode, it's at the same level as FrontDesk
  // In production mode, it's in the extraResources directory
  let backendPath = path.join(__dirname, '..', '..', 'Backend');
  
  // Check if we're in a packaged app (production mode)
  if (app.isPackaged) {
    // In packaged app, the Backend is in extraResources
    backendPath = path.join(process.resourcesPath, 'Backend');
    console.log('Running in production mode, using Backend path:', backendPath);
  } else {
    console.log('Running in development mode, using Backend path:', backendPath);
  }
  
  // Check if the Backend directory exists
  if (!fs.existsSync(backendPath)) {
    console.error(`ERROR: Backend directory not found at ${backendPath}`);
    console.log('Falling back to dummy server...');
    startDummyServer();
    return;
  }
  
  // Start the backend server using npm start
  backendProcess = spawn('npm', ['run', 'dev'], { 
    cwd: backendPath,
    shell: true,
    stdio: 'pipe'  // Capture stdout and stderr
  });
  
  // Flag to check if backend failed to start
  let backendFailed = false;
  
  // Log backend output
  backendProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Backend stdout: ${data.toString()}`);
  });
  
  backendProcess.stderr.on('data', (data: Buffer) => {
    const error = data.toString();
    console.error(`Backend stderr: ${error}`);
    
    // Check for common errors
    if (error.includes('EADDRINUSE')) {
      backendFailed = true;
      console.log('Port already in use. The backend server or another service might be already running.');
      
      // Show dialog to user
      if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Backend Server Issue',
          message: 'The backend server could not start because port 3001 is already in use.',
          detail: 'This could mean that:\n1. The backend server is already running\n2. Another application is using port 3001\n\nThe application will continue with existing backend or fallback to the dummy server.',
          buttons: ['OK']
        });
      }
      
      // Check if we need to start the dummy server
      if (backendProcess) {
        console.log('Terminating failed backend process...');
        backendProcess.kill();
        backendProcess = null;
      }
      
      // We don't need to start dummy server if real backend is already running
      // If you want to force dummy server, uncomment the line below
      // startDummyServer();
    }
  });
  
  backendProcess.on('close', (code: number) => {
    console.log(`Backend process exited with code ${code}`);
    
    // If backend failed and we haven't already started dummy server
    if (code !== 0 && !backendFailed) {
      console.log('Backend server failed to start. Falling back to dummy server...');
      startDummyServer();
    }
    
    backendProcess = null;
  });
  
  // Give the backend some time to start up
  console.log('Waiting for backend server to initialize...');
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Determine the correct path to index.html
  const indexPath = path.join(__dirname, 'index.html');
  
  console.log('App path:', __dirname);
  console.log('Loading from:', indexPath);
  
  // Verify if the file exists
  if (!fs.existsSync(indexPath)) {
    console.error(`ERROR: index.html not found at ${indexPath}`);
    app.quit();
    return;
  }

  // Load the index.html file from the correct path
  if (mainWindow) {
    // Use loadFile instead of loadURL
    mainWindow.loadFile(indexPath)
      .then(() => {
        console.log('Window loaded successfully');
        // Open DevTools to debug rendering issues
        if (mainWindow) {
          mainWindow.webContents.openDevTools();
        }
      })
      .catch(err => {
        console.error('Failed to load window:', err);
      });

    // Listen for window events
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Window finished loading');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
}

// Create window when Electron is ready
app.whenReady().then(() => {
  // Create the window first so we can show dialogs if needed
  createWindow();
  
  // Start the backend server
  startBackendServer();
  
  // Start the FrontWeb application
  startFrontWebApp();
  
  app.on('activate', () => {
    // On macOS, re-create the window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, applications stay active until the user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up all processes when the app is about to quit
app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Terminating backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (frontWebProcess) {
    console.log('Terminating FrontWeb application...');
    frontWebProcess.kill();
    frontWebProcess = null;
  }
});

// IPC handlers for communication with the renderer process
ipcMain.on('app-ready', (event) => {
  console.log('Received app-ready from renderer');
  event.reply('app-ready-reply', 'Electron app is ready');
}); 