const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess = null;
let mainWindow = null;

function startServer() {
  console.log('[Electron] Spawning Node.js/Express SQLite server...');
  const isProd = app.isPackaged;

  if (isProd) {
    // تشغيل السيرفر المجمع في مجلد dist
    const serverPath = path.join(__dirname, 'dist', 'server.cjs');
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } else {
    // تشغيل السيرفر في وضع التطوير المحلي
    const serverPath = path.join(__dirname, 'server.ts');
    const tsxCli = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    
    serverProcess = fork(tsxCli, [serverPath], {
      env: { ...process.env, NODE_ENV: 'development' }
    });
  }

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Electron] Backend server exited with code: ${code}, signal: ${signal}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    title: "نظام الدواجن الرقمية - تطبيق سطح المكتب المستقل",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // منح السيرفر ثانيتين للتمهيد والاتصال بقاعدة بيانات SQLite ثم التحميل
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 2000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed. Terminating backend server...');
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
