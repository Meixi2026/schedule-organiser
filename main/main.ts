import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
} from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { checkReminders, startReminderLoop } from './reminderService';
import { parseWithAI, generateCompanion, generateDDLPlan } from './aiService';
import type { AppData, ScheduleItem } from '../src/types';

const store = new Store<AppData>({
  defaults: {
    schedules: [],
    isHidden: false,
  },
});

let mainWindow: BrowserWindow | null = null;
let reminderWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isHidden = false;
let isQuitting = false;

const isDev = !app.isPackaged;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (isHidden) showWindow();
      else mainWindow.focus();
    }
  });
}

function getResourcePath(...segments: string[]): string {
  return path.join(app.getAppPath(), ...segments);
}

function getIconPath(): string {
  return getResourcePath('assets', 'tray-icon.png');
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 360,
    minHeight: 500,
    show: !isHidden,
    frame: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.platform === 'darwin') {
    win.setWindowButtonVisibility(false);
  }

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(getResourcePath('dist', 'index.html'));
  }

  win.on('close', (e) => {
    if (isQuitting) return;
    if (isDev) {
      isQuitting = true;
      app.quit();
      return;
    }
    if (process.platform === 'darwin') {
      e.preventDefault();
      hideWindow();
    }
  });

  return win;
}

function createReminderWindow(text: string): void {
  if (reminderWindow) {
    reminderWindow.close();
  }

  const display = screen.getPrimaryDisplay();
  const { width: screenW } = display.workAreaSize;

  reminderWindow = new BrowserWindow({
    width: 320,
    height: 80,
    x: screenW - 340,
    y: 24,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    border-radius: 14px;
    padding: 16px 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    border: 1px solid rgba(255,255,255,0.6);
    -webkit-app-region: no-drag;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  p { font-size: 14px; color: #1d1d1f; line-height: 1.5; }
</style></head>
<body><p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
<script>
  setTimeout(() => window.close(), 8000);
</script></body></html>`;

  reminderWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  reminderWindow.once('ready-to-show', () => reminderWindow?.show());
  reminderWindow.on('closed', () => { reminderWindow = null; });
}

function showWindow(): void {
  isHidden = false;
  store.set('isHidden', false);
  mainWindow?.show();
  mainWindow?.focus();
  mainWindow?.webContents.send('visibility-changed', false);
}

function hideWindow(): void {
  isHidden = true;
  store.set('isHidden', true);
  mainWindow?.hide();
  mainWindow?.webContents.send('visibility-changed', true);
}

function toggleVisibility(): boolean {
  if (isHidden) showWindow();
  else hideWindow();
  return isHidden;
}

function createTray(): void {
  const icon = nativeImage.createFromPath(getIconPath());
  const trayIcon = icon.isEmpty()
    ? nativeImage.createEmpty()
    : icon.resize({ width: 18, height: 18 });

  tray = new Tray(trayIcon);
  tray.setToolTip('日程管理');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => showWindow(),
    },
    {
      label: '隐藏窗口',
      click: () => hideWindow(),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleVisibility());
}

function setupIPC(): void {
  ipcMain.handle('get-data', () => store.store);

  ipcMain.handle('save-data', (_e, partial: Partial<AppData>) => {
    const current = store.store;
    const updated = { ...current, ...partial };
    store.set(updated);
    return updated;
  });

  ipcMain.handle('toggle-visibility', () => toggleVisibility());
  ipcMain.handle('get-visibility', () => isHidden);

  ipcMain.handle('parse-with-ai', async (_e, input: string, apiKey: string) => {
    return parseWithAI(input, apiKey);
  });

  ipcMain.handle('generate-companion', async (_e, schedules: ScheduleItem[], apiKey: string) => {
    return generateCompanion(schedules, apiKey);
  });

  ipcMain.handle('generate-ddl-plan', async (_e, input: string, apiKey: string) => {
    return generateDDLPlan(input, apiKey);
  });

  ipcMain.on('show-reminder', (_e, text: string) => {
    createReminderWindow(text);
  });

  ipcMain.on('window-close', () => {
    if (isDev) {
      isQuitting = true;
      app.quit();
      return;
    }
    hideWindow();
  });
  ipcMain.on('window-quit', () => {
    isQuitting = true;
    app.quit();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

if (gotSingleInstanceLock) app.whenReady().then(() => {
  app.setName('日程');
  if (process.platform === 'darwin') {
    app.dock?.setIcon(nativeImage.createFromPath(getIconPath()));
  }
  isHidden = store.get('isHidden', false);
  mainWindow = createMainWindow();
  createTray();
  setupIPC();

  startReminderLoop(
    () => store.get('schedules', []),
    (text) => {
      createReminderWindow(text);
      mainWindow?.webContents.send('reminder-triggered', text);
    },
    () => isHidden,
  );

  app.on('activate', () => {
    if (!mainWindow) mainWindow = createMainWindow();
    else showWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

export { store, uuidv4 };
