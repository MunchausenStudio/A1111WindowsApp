const { ipcRenderer } = require('electron');
const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit');
const path = require('node:path')

// Terminal style customisation
const terminal = new Terminal({
    fontSize: 12,
    fontFamily: '"Cascadia Mono", monospace',
    theme: {
        background: '#012456',  // Set your desired background color
        foreground: '#ffffff',  // Set your desired foreground color
    }
});

const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(document.getElementById('terminal-container'));
terminal.focus();
fitAddon.fit();
window.addEventListener('resize', () => {
    fitAddon.fit();
});

//Right click menu
// Define setupWebViewContextMenu in the global scope
function setupWebViewContextMenu(webview) {
    webview.addEventListener('context-menu', (e) => {
        e.preventDefault();
        ipcRenderer.send('show-context-menu', [
            { label: 'Refresh', icon:  path.join(__dirname, '20w', '4158274081579697363-20.png'), command: 'refresh' },
            { type: 'separator' },
            { label: 'Copy', icon:  path.join(__dirname, '20w', '7325096671582545598-20.png'), command: 'copy' },
            { label: 'Cut', icon:  path.join(__dirname, '20w', '3386031271691391577-20.png'), command: 'cut' },
            { label: 'Paste', icon:  path.join(__dirname, '20w', '11070064116315920404154-20.png'), command: 'paste' }
        ]);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const webview = document.querySelector('webview');
    if (webview) {
        setupWebViewContextMenu(webview);
    }
});
ipcRenderer.on('context-menu-command', (event, command) => {
    switch (command) {
        case 'refresh':
            webview.reload();
            break;
        case 'copy':
            webview.copy();
            break;
        case 'cut':
            webview.cut();
            break;
        case 'paste':
            webview.paste();
            break;
    }
});

// A1111 UI loading

// Handle incoming data from the pseudo-terminal
// Function to remove ANSI escape codes
function stripAnsi(str) {
    return str.replace(/\u001b\[.*?m/g, ''); // This regex matches ANSI escape codes used for coloring/formatting
}

// Trigger for the loading of the A1111 UI
ipcRenderer.on('terminal.incomingData', (event, data) => {
    terminal.write(data);
    //console.log("Data received:", data);  // Confirm data is received
    const cleanedData = stripAnsi(data); // Clean data for URL checking

    if (cleanedData.includes('http://127.0.0.1:7860')) { // Check the cleaned data for the URL
        console.log("URL found, attempting to load webview");
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = '<webview id="webview" src="http://127.0.0.1:7860" style="width:100%; height:100%;"></webview>';
            const webview = document.getElementById('webview');
            setupWebViewContextMenu(webview);
            webview.addEventListener('dom-ready', () => {
                // Additional actions once webview is loaded
            });
        }
    }
});
// Manual UI reload if trigger is bugged (do happen)
ipcRenderer.on('trigger-webview-load', () => {
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = '<webview id="webview" src="http://127.0.0.1:7860" style="width:100%; height:100%;"></webview>';
    }
});
// Send data from the terminal to the pseudo-terminal aka handle keystrokes
terminal.onData(data => {
    ipcRenderer.send('terminal.keystroke', data);
});

ipcRenderer.on('toggle-terminal', () => {
    const terminalContainer = document.getElementById('terminal-container');
    if (terminalContainer.style.display === 'none') {
        terminalContainer.style.display = 'block';  // Show the terminal
    } else {
        terminalContainer.style.display = 'none';   // Hide the terminal
    }
});

// Getting various versions numbers
ipcRenderer.send('send-versions', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
});