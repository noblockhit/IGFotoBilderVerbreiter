const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("renderer", {
    sendLoginMessage: arg => ipcRenderer.invoke("LOGIN"),
    sendLogoutMessage: arg => ipcRenderer.invoke("LOGOUT"),
    sendSeeProfileMessage: arg => ipcRenderer.invoke("GET_PROFILE"),
    sendEmail: args => ipcRenderer.invoke("SEND_EMAIL", args),
});

