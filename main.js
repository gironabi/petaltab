const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('eye-dropper-not-supported');

let win;
let savedBounds = null;
let collapsedArea = null;

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 520,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.on('resize', (event, width, height) => {
  if (event.sender !== win.webContents || collapsedArea) return;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;

  win.setBounds({
    ...win.getBounds(),
    width: Math.max(260, Math.round(width)),
    height: Math.max(300, Math.round(height)),
  });
});

ipcMain.on('collapse', (event) => {
  if (event.sender !== win.webContents || collapsedArea) return;

  savedBounds = win.getBounds();
  const area = screen.getDisplayMatching(savedBounds).workArea;
  const centerX = savedBounds.x + savedBounds.width / 2;
  const left = centerX < area.x + area.width / 2;
  const size = 64;
  collapsedArea = area;

  win.setBounds({
    x: left ? area.x - 20 : area.x + area.width - 44,
    y: Math.max(area.y, Math.min(savedBounds.y, area.y + area.height - size)),
    width: size,
    height: size,
  });

  win.webContents.send('collapsed', left ? 'left' : 'right');
});

ipcMain.on('move-tab', (event, deltaY) => {
  if (event.sender !== win.webContents || !collapsedArea || !Number.isFinite(deltaY)) return;

  const bounds = win.getBounds();
  const bottom = collapsedArea.y + collapsedArea.height - bounds.height;
  const y = Math.max(collapsedArea.y, Math.min(bottom, bounds.y + Math.round(deltaY)));

  if (y !== bounds.y) win.setBounds({ ...bounds, y });
});

ipcMain.on('expand', (event) => {
  if (event.sender !== win.webContents || !collapsedArea) return;

  win.setBounds(savedBounds);
  collapsedArea = null;
  savedBounds = null;
});

ipcMain.on('set-pinned', (event, pinned) => {
  if (event.sender === win?.webContents && typeof pinned === 'boolean') {
    win.setAlwaysOnTop(pinned);
  }
});

ipcMain.on('close', () => app.quit());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());