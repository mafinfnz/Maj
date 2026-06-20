const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let currentHotkey = 'F9';

function registerShortcut(key) {
  globalShortcut.unregisterAll();
  try {
    const ret = globalShortcut.register(key, () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    if (!ret) console.log(`Registration of ${key} failed`);
    else currentHotkey = key;
  } catch (e) {
    console.error(`Failed to register shortcut: ${key}`, e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Allow clicking through transparent areas if needed,
  // but usually for an overlay we want it to capture input when visible.
  // We can toggle setIgnoreMouseEvents(true/false) if the user wants "click-through"

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', () => {
  createWindow();
  registerShortcut(currentHotkey);

  ipcMain.on('update-hotkey', (event, newKey) => {
    // Electron expects modifiers like 'CommandOrControl', 'Alt', 'Shift'
    // Our frontend sends 'Control', 'Alt', 'Shift', 'Command'
    // 'Control' is accepted by Electron, but 'CommandOrControl' is better for cross-platform.
    // However, the user specifically wants these combinations.
    console.log(`Updating global hotkey to: ${newKey}`);
    registerShortcut(newKey);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
