const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("renderer", {
    sendGetCacheMessage: args => ipcRenderer.invoke("GET_CACHE"),
    sendLoginMessage: args => ipcRenderer.invoke("LOGIN", args),
    sendLogoutMessage: arg => ipcRenderer.invoke("LOGOUT"),
    sendSeeProfileMessage: arg => ipcRenderer.invoke("GET_PROFILE"),
    sendEmail: args => ipcRenderer.invoke("SEND_EMAIL", args),
});
