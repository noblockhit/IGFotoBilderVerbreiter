const path = require('path');
const { app, ipcMain, protocol, BrowserWindow } = require('electron');
const AuthProvider = require('./AuthProvider');
const express = require('express');
const fs = require('fs');

let store;
(async () => {
    const { default: Store } = await import('electron-store');
    store = new Store();

    store.set('userSettings.theme', 'light');
    console.log('User theme:', store.get('userSettings.theme'));
})();

let closeBrowserWindow = false;
let mainWindow;
let authProvider = null;
let globalAccessToken = null;

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('electron-fiddle', process.execPath, [path.resolve(process.argv[1])])
    }
} else {
    app.setAsDefaultProtocolClient('electron-fiddle')
}


function sleep(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        minWidth: 700,
        minHeight: 450,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        // autoHideMenuBar: true,
    });
    mainWindow.loadFile('index.html');
    authProvider = new AuthProvider(app, mainWindow);
};

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    const eventapp = express();

    // Enable CORS for all origins (use with caution in production)
    eventapp.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow cookies
        next();
    });

    // Sample route
    eventapp.get('/', (req, res) => {
        if (closeBrowserWindow) {
            res.send('CloseBrowserWindow');
            closeBrowserWindow = false;
        } else {
            res.send('KeepBrowserWindowOpen');
        }
    });

    // Start the server
    eventapp.listen(18769, () => { });

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
        closeBrowserWindow = true;
        mainWindow.show();
    })

    app.whenReady().then(() => {
        createWindow()
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle("GET_CACHE", async (event, args) => {
    const cachedTenantId = store.get('tenantId');
    const cachedClientId = store.get('clientId');
    return { tenantId: cachedTenantId, clientId: cachedClientId };
})


ipcMain.handle("LOGIN", async (event, args) => {
    await authProvider.login(args.tenantId, args.clientId);
    const tokenResponse = await authProvider.getToken({
        scopes: ['openid', 'profile', 'User.Read', 'Mail.Send'],
        account: authProvider.account
    });
    globalAccessToken = tokenResponse.accessToken;
    store.set('tenantId', args.tenantId);
    store.set('clientId', args.clientId);
    return authProvider.account;
})

ipcMain.handle("LOGOUT", async () => {
    await authProvider.logout();
})


ipcMain.handle("SEND_EMAIL", async (event, args) => {
    // emailAddr, subject, textContent, imageName = null, imageAttachmentBytes = null
    // add an image attachment to the email
    const email = {
        message: {
            subject: args.subject,

            body: {
                contentType: "Text",
                content: args.textContent
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: args.emailAddr
                    }
                }
            ],
        }
    };

    if (args.imageAttachmentBytes) {
        email.message.attachments = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                name: args.imageName,
                contentBytes: args.imageAttachmentBytes
            }
        ];
    }

    try {
        const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${globalAccessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(email)
        });
        return ['Email sent:', email, response.status, response.statusText];
        
    } catch (error) {
        console.log(error);
        return ['Error sending email:', error];
    }
});

ipcMain.handle("GET_DEFAULT_CODE", async (event, args) => {
    return fs.readFileSync(path.join(__dirname, 'defaultCode.js'), 'utf8');
});