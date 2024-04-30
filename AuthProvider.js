const { PublicClientApplication } = require('@azure/msal-node');
const { shell } = require('electron');
const fs = require('fs');
const path = require('path');

const successAndRedirectTemplate = fs.readFileSync(path.join(__dirname, "successAndRedirect.html"), 'utf8');


class AuthProvider {

    clientApplication;
    msalConfig;
    cache;
    account;
    app;
    mainWindow;
    authorityString = "724d16e5-093c-45bb-b709-b26daf97e3f8";

    constructor(app, mainWindow) {
        this.app = app;
        this.mainWindow = mainWindow;
        this.msalConfig = {
            auth: {
                clientId: '8c6718ba-f60f-4740-9b06-f696eaf3d493',
                authority: `https://login.microsoftonline.com/${this.authorityString}`,
            },

            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                    },
                    piiLoggingEnabled: false,
                    logLevel: "error",
                }
            }
        };
        this.clientApplication = new PublicClientApplication(this.msalConfig);
        this.cache = this.clientApplication.getTokenCache();
    }

    async login() {
        try {
            const openBrowser = async (url) => {
                await shell.openExternal(url);
            }
            const authResult = await this.clientApplication.acquireTokenInteractive({
                openBrowser,
                successTemplate: successAndRedirectTemplate,
                failureTemplate: "You are not signed in, please try again!",
                scopes: ['openid', 'profile', 'User.Read', 'Mail.Send']
            });

            this.account = authResult.account;

        } catch (error) {
            console.log(error);
        }
    }

    async logout() {
        try {
            this.cache.removeAccount(this.account);

            await shell.openExternal(`https://login.microsoftonline.com/${this.authorityString}/oauth2/v2.0/logout?logout_hint=${this.account.idTokenClaims["login_hint"]}`);
            this.account = null;

        } catch (error) {
            console.log(error);
        }
    }

    async getToken(tokenRequest) {
        try {
            const response = await this.clientApplication.acquireTokenSilent(tokenRequest);
            return response;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                const response = await this.clientApplication.acquireTokenPopup(tokenRequest);
                return response;
            } else {
                console.log(error);
            }
        }
    }
}

module.exports = AuthProvider;