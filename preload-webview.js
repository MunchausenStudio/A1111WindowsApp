const {ipcRenderer} = require('electron');
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
