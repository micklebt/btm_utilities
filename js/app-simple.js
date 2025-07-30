/**
 * Simplified App Initialization for Debugging
 */

console.log('Simple app initialization starting...');

// Basic app class without complex dependencies
class SimpleApp {
    constructor() {
        this.isInitialized = false;
        console.log('SimpleApp constructor called');
    }

    async init() {
        try {
            console.log('SimpleApp: Starting initialization...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Simulate some initialization time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Hide loading screen and show main app
            this.hideLoadingScreen();
            this.showMainApp();
            
            this.isInitialized = true;
            console.log('SimpleApp: Initialization complete!');
            
        } catch (error) {
            console.error('SimpleApp: Initialization failed!', error);
            this.handleError(error);
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            console.log('Loading screen shown');
        } else {
            console.error('Loading screen element not found');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                console.log('Loading screen hidden');
            }, 500);
        }
    }

    showMainApp() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.classList.remove('hidden');
            console.log('Main app shown');
        } else {
            console.error('App container element not found');
        }
    }

    handleError(error) {
        console.error('SimpleApp error:', error);
        // Show error in console for debugging
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 10px; z-index: 9999;';
        errorDiv.textContent = `Error: ${error.message}`;
        document.body.appendChild(errorDiv);
    }
}

// Create and initialize simple app
const simpleApp = new SimpleApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    console.log('Document still loading, adding DOMContentLoaded listener...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired, initializing simple app...');
        simpleApp.init();
    });
} else {
    console.log('Document already loaded, initializing simple app immediately...');
    simpleApp.init();
}

// Make available globally for debugging
window.simpleApp = simpleApp;

console.log('Simple app script loaded');