/**
 * Main Entry Point
 * Initializes the BTM Utility application
 */

import { BTMApp } from './core/app.js';
import { ModuleLoader } from './core/module-loader.js';
import { logger } from './utils/logger.js';
import { config, validateConfig } from './utils/config.js';

// Initialize module loader
const moduleLoader = new ModuleLoader();

// Initialize application
const app = new BTMApp();

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

/**
 * Start the application
 */
async function startApp() {
    try {
        logger.info('Starting BTM Utility application', { version: config.app.version });
        
        // Validate configuration
        if (!validateConfig(config)) {
            throw new Error('Invalid configuration');
        }
        
        // Register service worker if available
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                logger.info('Service worker registered', { scope: registration.scope });
            } catch (error) {
                logger.warn('Service worker registration failed', error);
            }
        }
        
        // Initialize the application
        await app.init();
        
        // Log successful startup
        logger.info('BTM Utility application started successfully');
    } catch (error) {
        logger.error('Failed to start application', error);
        
        // Show error message to user
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const loadingContent = loadingScreen.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div class="error-icon">⚠️</div>
                    <h2>Application Error</h2>
                    <p>Failed to start the application. Please try refreshing the page.</p>
                    <p class="error-details">${error.message}</p>
                    <button id="retry-button" class="retry-button">Retry</button>
                `;
                
                const retryButton = document.getElementById('retry-button');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        window.location.reload();
                    });
                }
            }
        }
    }
}

// Export app instance for debugging
window.btmApp = app; 