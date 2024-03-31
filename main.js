/* TODO : - Add a google prompt window with the added word "Stable Diffusion" automatically added after the text entered into the input
          - Fix the FitTerminal that isn't fitted upon opening of the window
		  - Add status info in title bar to check progress
 */

const {app, BrowserWindow, Menu, shell, dialog, ipcMain} = require('electron')
const pty = require('node-pty');
const os = require('os');
const path = require('node:path')

let mainWindow; // Declare mainWindow globally
let terminalWindow = null;  // Global reference to the terminal window
let terminalDataBuffer = ''; // Store terminal for back and forth windows exchange
let versionInfo = {}; // Store all versions infos
let SDA1111BasePath = 'C:\\Users\\Munchausen\\Documents\\A1111';

ipcMain.on('send-versions', (event, versions) => {
    versionInfo = versions;
});

// Initiate context menu
ipcMain.on('show-context-menu', (event, menuTemplate) => {
    const menu = Menu.buildFromTemplate(
        menuTemplate.map(item => {
            if (item.command) {
                const originalItem = { ...item };
                originalItem.click = () => {
                    event.sender.send(`context-menu-command`, item.command);
                };
                return originalItem;
            }
            return item;
        })
    );
    menu.popup(BrowserWindow.fromWebContents(event.sender));
});

// Main Menu bar content
const menuTemplate = [
    {
        label: 'Open',
        submenu: [
            {
                label: 'Open A1111 Folder',
                icon: path.join(__dirname, '20w', '290088311558096434-20.png'),
                click: () => {
                    shell.openPath(SDA1111BasePath);
                }
            },
            {
                label: 'Open Models Folder',
                icon: path.join(__dirname, '20w', '290088311558096434-20.png'),
                click: () => {
                    shell.openPath(SDA1111BasePath + '\\stable-diffusion-webui\\models\\Stable-diffusion');
                }
            },
            {
                label: 'Open LoRa Folder',
                icon: path.join(__dirname, '20w', '290088311558096434-20.png'),
                click: () => {
                    shell.openPath(SDA1111BasePath + '\\stable-diffusion-webui\\models\\Lora');
                }
            },
            {
                label: 'Open Embeddings Folder',
                icon: path.join(__dirname, '20w', '290088311558096434-20.png'),
                click: () => {
                    shell.openPath(SDA1111BasePath + '\\stable-diffusion-webui\\embeddings');
                }
            }
        ]
    },
    {
        label: 'Tools',
        submenu: [
            {
                label: 'Stable Diffusion Terminal',
                icon:  path.join(__dirname, '20w', '19608875881557740376-20.png'),
                click: () => {
                    toggleTerminalWindow();
                }
            },
            {
                label: 'Dev console',
                icon:  path.join(__dirname, '20w', '65498794-85.png'),
                click: () => {
                    BrowserWindow.getFocusedWindow().toggleDevTools();
                }
            },
            {
                label: 'Reload UI',
                icon:  path.join(__dirname, '20w', '4158274081579697363-20.png'),
                click: () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        win.webContents.send('trigger-webview-load');
                    }
                }
            }
        ]
    },
    {
        label: 'Ressources',
        submenu: [
            {
                label: 'CivitAI Models',
                icon:  path.join(__dirname, '20w', '5000x5000_faviconC.png'),
                click: () => {
                    const exampleUrl = 'https://civitai.com/models/';
                    shell.openExternal(exampleUrl);
                }
            },
            {
                label: 'OpenPose Online',
                icon:  path.join(__dirname, '20w', '1910157971684945872-20.png'),
                click: () => {
                    const newWindow = new BrowserWindow({
                        width: 1024,
                        height: 768,
                        autoHideMenuBar: true,
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true
                        },
                        icon:  path.join(__dirname, '20w', '1910157971684945872-20.png')
                    });
                    newWindow.loadURL('https://openposeai.com');
                }
            }
        ]
    },
    {
        label: '?',
        submenu: [
            {
                label: 'About',
                icon:  path.join(__dirname, '20w', '11016449961582988850-20.png'),
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'App infos',
                        message: `Electron based GUI for A1111 by Munchausen Studio \nNode version: ${versionInfo.node}, Chrome version: ${versionInfo.chrome}, Electron version: ${versionInfo.electron}`,
                        buttons: ['OK']
                    });
                }
            }
        ]
    }

];
// Terminal Window
const toggleTerminalWindow = () => {
    if (terminalWindow) {
        terminalWindow.close();  // Close the window if it's open
        terminalWindow = null;
    } else {
        terminalWindow = new BrowserWindow({
            width: 800,
            height: 555,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            title: "Terminal Stable Diffusion",
            icon:  path.join(__dirname, '20w', '19608875881557740376-20.png')
        });
        terminalWindow.loadURL(path.join(__dirname, 'index.html?terminal=true'));
        terminalWindow.on('closed', () => terminalWindow = null);
        // Carbon copy of existing content of the terminal
        terminalWindow.webContents.on('did-finish-load', () => {
            terminalWindow.webContents.send('terminal.incomingData', terminalDataBuffer);
        });
    }
};
// Main Window
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            enableRemoteModule: true,
        },
        title: "Stable Diffusion - A1111 Forge",
        icon:  path.join(__dirname, '20w', '196056941-aace0837-473a-4aa5-9067-505b17797aa1.png')
    })

    // Set the menu after creating the browser window
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Load main index file
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => mainWindow = null);

    // Create the pseudo-terminal
    const batchFilePath = SDA1111BasePath + '\\Forge\\stable-diffusion-webui-forge\\webui-user.bat'; // Specific Batch start file path
    const ptyProcess = pty.spawn('powershell.exe', ['-NoExit', '-Command', batchFilePath], {
        name: 'xterm-color',
        cols: 120,
        rows: 80,
        cwd: SDA1111BasePath + '\\Forge\\stable-diffusion-webui-forge',
        env: process.env
    });

    // Send data to and from the pseudo-terminal
    ptyProcess.on('data', function (data) {
        terminalDataBuffer += data; // Store data in buffer
        if (terminalWindow) {
            terminalWindow.webContents.send('terminal.incomingData', terminalDataBuffer);
        } else {
            mainWindow.webContents.send('terminal.incomingData', data);
        }
    });

    // This listens for the 'terminal.keystroke' messages from the renderer
    ipcMain.on('terminal.keystroke', (event, data) => {
        ptyProcess.write(data);
    });

    global.ptyProcess = ptyProcess; // Make it accessible for renderer process
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})