const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readAccessKeys: () => ipcRenderer.invoke('read-access-keys'),
  writeAccessKeys: (keys) => ipcRenderer.invoke('write-access-keys', keys),
  setServerMode: (mode) => ipcRenderer.invoke('set-server-mode', mode),
  getServerMode: () => ipcRenderer.invoke('get-server-mode'),
  invokeIPC: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
})
