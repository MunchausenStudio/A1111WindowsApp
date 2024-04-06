const {ipcRenderer, shell} = require('electron');
console.log('preload-webview.js is loaded');

// Observing the progress bar in A1111 to display progress in title bar of the app
window.addEventListener('DOMContentLoaded', () => {
    const observeMutations = (targetNode) => {
        const observer = new MutationObserver((mutations) => {
            // After any mutation, check if the .progressDiv is present in the targetNode
            const progressDivPresent = targetNode.querySelector('.progressDiv');

            if (progressDivPresent) {
                const progressNode = progressDivPresent.querySelector('.progress');
                if (progressNode && progressNode.textContent.trim() !== '') {
                    ipcRenderer.send('update-progress', progressNode.textContent);
                }
            } else {
                // If no .progressDiv is found after mutations, revert the title
                console.log('No progressDiv found, reverting to default title');
                ipcRenderer.send('update-progress', 'Stable Diffusion - A1111 Forge');
            }
        });

        const config = { childList: true, subtree: true, attributes: false };
        observer.observe(targetNode, config);
        console.log(`Observing ${targetNode.id} for mutations`);
    };

    // Running a loop to check progress bar div appearance
    const checkAndObserve = (id) => {
        const targetNode = document.getElementById(id);
        if (targetNode) {
            observeMutations(targetNode);
        } else {
            console.log(`${id} not found, retrying...`);
            setTimeout(() => checkAndObserve(id), 500);
        }
    };

    // Start the dynamic checking and observation for both IDs
    checkAndObserve('txt2img_results');
    checkAndObserve('img2img_results');
});
// Handle external links opening (opening them in regular default web browser
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('a[href^="http"]');
        if (target) {
            e.preventDefault(); // Prevent default navigation within the webview
            shell.openExternal(target.href); // Open the link in the default system browser
        }
    }, true); // Use capturing to ensure this runs before any specific link handlers
});
// Handle Windows notification
const OriginalNotification = Notification;

Notification = function(title, options) {
    // Customize the notification title
    const customTitle = `Job done - ${title}`;

    // Proceed to create the notification with customized options
    const notificationInstance = new OriginalNotification(customTitle, options);

    // Preserve the original onclick behavior and add additional handling
    const originalOnClick = notificationInstance.onclick;
    notificationInstance.onclick = function(event) {
        // Call the original onclick function, if it exists
        if (originalOnClick) originalOnClick.apply(this, arguments);
        console.log('Notification clicked');
        // Additional behavior: Focus the Electron app window or perform another action
        ipcRenderer.send('notification-clicked');

        // Optionally, you can focus the Electron window directly here, but it's better
        // to send an IPC message to the main process for actions that affect the main window
    };

    return notificationInstance;
};

Notification.prototype = OriginalNotification.prototype;
Notification.permission = OriginalNotification.permission;
Notification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);