const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('datame', {
  loadVault:            ()  => ipcRenderer.invoke('vault:load'),
  loadConfig:           ()  => ipcRenderer.invoke('config:load'),
  saveConfig:           (d) => ipcRenderer.invoke('config:save', d),
  saveField:            (d) => ipcRenderer.invoke('vault:save-field', d),
  addCustomCategory:    (d) => ipcRenderer.invoke('vault:add-custom-category', d),
  addCustomField:       (d) => ipcRenderer.invoke('vault:add-custom-field', d),
  deleteCustomCategory: (d) => ipcRenderer.invoke('vault:delete-custom-category', d),
  scanFolder:           ()  => ipcRenderer.invoke('vault:scan-folder'),
  aiAnalyze:            (d) => ipcRenderer.invoke('vault:ai-analyze', d),
  aiAutoImport:         (d) => ipcRenderer.invoke('vault:ai-auto-import', d),
  inboxAssign:          (d) => ipcRenderer.invoke('vault:inbox-assign', d),
  inboxDelete:          (d) => ipcRenderer.invoke('vault:inbox-delete', d),
  inboxUnarchive:       (d) => ipcRenderer.invoke('vault:inbox-unarchive', d),
  importChat:           (d) => ipcRenderer.invoke('vault:import-chat', d),
});
