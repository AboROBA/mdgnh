const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess = null;
let mainWindow = null;

function startServer() {
  console.log('[Electron] Spawning Node.js/Express MySQL Cloud server...');
  const isProd = app.isPackaged;

  if (isProd) {
    // تشغيل السيرفر المجمع في مجلد dist
    const serverPath = path.join(__dirname, 'dist', 'server.cjs');
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit'
    });
  } else {
    // تشغيل السيرفر في وضع التطوير المحلي
    const serverPath = path.join(__dirname, 'server.ts');
    const tsxCli = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    
    serverProcess = fork(tsxCli, [serverPath], {
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit'
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

  // محاولة التحميل فوراً
  mainWindow.loadURL('http://localhost:3000');

  // في حال فشل التحميل (بسبب تأخر في اتصال قاعدة البيانات السحابية مثلاً)، تتم إعادة المحاولة كل ثانية
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log(`[Electron] Port 3000 not ready yet or loading failed. Retrying in 1s... (Error: ${errorDescription})`);
    if (validatedURL.startsWith('http://localhost:3000')) {
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL('http://localhost:3000');
        }
      }, 1000);
    }
  });

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
