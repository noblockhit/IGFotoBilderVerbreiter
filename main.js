const path = require('path');
const { app, ipcMain, BrowserWindow } = require('electron');
const AuthProvider = require('./AuthProvider');

let mainWindow;
const authProvider = new AuthProvider();
let globalAccessToken = null;

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
        autoHideMenuBar: true,
    });
    mainWindow.loadFile('index.html');
};

app.on('ready', () => {
    createWindow();
});

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


ipcMain.handle("LOGIN", async (event, arg) => {
    await authProvider.login();
    const tokenResponse = await authProvider.getToken({
        scopes: ['openid', 'profile', 'User.Read', 'Mail.Send'],
        account: authProvider.account
    });
    globalAccessToken = tokenResponse.accessToken;
    console.log('Access token:', globalAccessToken);
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
            ]
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
        console.log(response);
        return ['Email sent:', email, response.status, response.statusText];
    } catch (error) {
        return ['Error sending email:', error];
    }
});
