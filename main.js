const { app, BrowserWindow, protocol, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let serverProcess = null;

// Config file path for server mode
const configDir = path.join(app.getPath('appData'), 'CaseFlowShared');
const configFile = path.join(configDir, 'config.json');

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const readConfig = () => {
  if (!fs.existsSync(configFile)) {
    return { serverMode: 'host' }; // default to host
  }
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  } catch {
    return { serverMode: 'host' };
  }
};

const writeConfig = (config) => {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
};

// Start the server
function startServer() {
  if (serverProcess) return;
  
  // Check if this machine should run the server
  const config = readConfig();
  
  if (config.serverMode === 'client') {
    console.log('Client mode: Server not started on this device');
    return;
  }
  
  const serverPath = path.join(__dirname, isDev ? 'server.js' : 'server.js');
  serverProcess = spawn('node', [serverPath], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`);
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    serverProcess = null;
  });
}

// Use a shared user data path so admin-generated keys persist across both apps.
const sharedDataPath = path.join(app.getPath('appData'), 'CaseFlowShared');
if (!fs.existsSync(sharedDataPath)) {
  fs.mkdirSync(sharedDataPath, { recursive: true });
}
const accessKeysPath = path.join(sharedDataPath, 'access-keys.json');

const readAccessKeysFromStore = () => {
  if (!fs.existsSync(accessKeysPath)) return [];
  try {
    const data = fs.readFileSync(accessKeysPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeAccessKeysToStore = (keys) => {
  fs.writeFileSync(accessKeysPath, JSON.stringify(keys, null, 2));
};

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function registerAppProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    try {
      const url = new URL(request.url);
      const decodedPath = decodeURI(url.pathname);
      const nextIndex = decodedPath.indexOf('/_next/');
      if (nextIndex !== -1) {
        const relative = decodedPath.slice(nextIndex);
        callback({ path: path.normalize(path.join(__dirname, 'out', relative)) });
        return;
      }
      if (decodedPath.endsWith('/404.html') || decodedPath.endsWith('/index.html') || decodedPath.endsWith('/index.txt')) {
        callback({ path: path.normalize(path.join(__dirname, 'out', path.basename(decodedPath))) });
        return;
      }
      callback({ path: path.normalize(path.join(__dirname, 'out', decodedPath)) });
    } catch (error) {
      callback({ error });
    }
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/favicon.ico'), // Add an icon if you have one
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://localhost/index.html');
  }
}

app.whenReady().then(() => {
  startServer();
  
  if (!isDev) {
    registerAppProtocol();
  }

  ipcMain.handle('read-access-keys', () => {
    return readAccessKeysFromStore();
  });

  ipcMain.handle('write-access-keys', (event, keys) => {
    writeAccessKeysToStore(keys);
  });

  ipcMain.handle('set-server-mode', (event, mode) => {
    writeConfig({ serverMode: mode });
    return { success: true };
  });

  ipcMain.handle('get-server-mode', () => {
    return readConfig().serverMode;
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});