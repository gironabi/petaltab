const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  resize: (width, height) => ipcRenderer.send('resize', width, height),
  collapse: () => ipcRenderer.send('collapse'),
  moveTab: (deltaY) => ipcRenderer.send('move-tab', deltaY),
  expand: () => ipcRenderer.send('expand'),
  setPinned: (pinned) => ipcRenderer.send('set-pinned', pinned),
  close: () => ipcRenderer.send('close'),
  onCollapsed: (callback) => {
    ipcRenderer.on('collapsed', (_event, side) => callback(side));
  },
});