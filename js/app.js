/**
 * Main Application Module
 * BTM Utility application initialization and lifecycle management
 */

import { config, validateConfig } from './config.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, isMobile, supportsFeature, playSuccessBeep, playNotificationBeep } from './utils.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';

// Application state management
class AppState {
    constructor() {
        this.state = {
            isInitialized: false,
            isOnline: navigator.onLine,
            currentSection: 'collections',
            isLoading: false,
            error: null,
            notifications: [],
            settings: {},
            lastSync: null,
            version: config.app.version,
        };
        this.listeners = new Map();
    }

    // Get state
    get(key = null) {
        if (key === null) return { ...this.state };
        return this.state[key];
    }

    // Set state
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notifyListeners(key, value, oldValue);
    }

    // Update state
    update(updates) {
        Object.keys(updates).forEach(key => {
            this.set(key, updates[key]);
        });
    }

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    // Notify listeners
    notifyListeners(key, newValue, oldValue) {
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }
    }
}

// Application class
class BTMUtility {
    constructor() {
        this.state = new AppState();
        this.modules = new Map();
        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    // Initialize application
    async init() {
        try {
            logger.info('Initializing BTM Utility...');
            
            // Validate configuration
            if (!validateConfig()) {
                throw new Error('Invalid configuration');
            }

            // Show loading screen
            this.showLoadingScreen();

            // Initialize core modules
            await this.initializeModules();

            // Load settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Check online status
            this.updateOnlineStatus();

            // Hide loading screen
            this.hideLoadingScreen();

            // Mark as initialized
            this.state.set('isInitialized', true);
            this.isInitialized = true;

            logger.info('BTM Utility initialized successfully');
            playSuccessBeep();
            
            // Trigger initialization event
            this.triggerEvent('app:initialized');

        } catch (error) {
            logger.error('Failed to initialize BTM Utility', null, error);
            this.handleError(error);
        }
    }

    // Initialize core modules
    async initializeModules() {
        const modules = [
            { name: 'ui', path: './modules/ui.js' },
            { name: 'api', path: './modules/api.js' },
            { name: 'notifications', path: './modules/notifications.js' },
            { name: 'sync', path: './modules/sync.js' },
        ];

        for (const module of modules) {
            try {
                const moduleInstance = await this.loadModule(module.path);
                this.modules.set(module.name, moduleInstance);
                
                if (moduleInstance && typeof moduleInstance.init === 'function') {
                    await moduleInstance.init(this);
                }
            } catch (error) {
                logger.warn(`Failed to load module ${module.name}`, null, error);
            }
        }
    }

    // Load module dynamically
    async loadModule(path) {
        try {
            const module = await import(path);
            return module.default || module;
        } catch (error) {
            console.error(`Failed to load module from ${path}:`, error);
            return null;
        }
    }

    // Load application settings
    async loadSettings() {
        try {
            const settings = storageUtils.settings.load({
                theme: 'default',
                language: 'en',
                notifications: true,
                autoSync: true,
                offlineMode: true,
                debugMode: config.app.debug,
            });

            this.state.set('settings', settings);
            
            // Apply settings
            this.applySettings(settings);
        } catch (error) {
            logger.error('Failed to load settings', null, error);
        }
    }

    // Apply settings
    applySettings(settings) {
        // Apply theme
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }

        // Apply language
        if (settings.language) {
            document.documentElement.lang = settings.language;
        }

        // Apply debug mode
        if (settings.debugMode) {
            window.debugMode = true;
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.triggerEvent('app:background');
            } else {
                this.triggerEvent('app:foreground');
            }
        });

        // Before unload
        window.addEventListener('beforeunload', (event) => {
            this.triggerEvent('app:beforeunload');
        });

        // Error handling
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
    }

    // Update online status
    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        this.state.set('isOnline', isOnline);
        
        // Show/hide offline indicator
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            if (isOnline) {
                offlineIndicator.classList.remove('show');
            } else {
                offlineIndicator.classList.add('show');
            }
        }

        // Trigger event
        this.triggerEvent('app:onlineStatusChanged', { isOnline });
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500); // Small delay for smooth transition
        }
    }

    // Navigate to section
    navigateToSection(sectionName) {
        try {
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update navigation
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.classList.remove('active');
            });

            const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
            }

            // Update state
            this.state.set('currentSection', sectionName);

            // Trigger event
            this.triggerEvent('app:navigationChanged', { section: sectionName });

        } catch (error) {
            logger.error('Navigation error', null, error);
        }
    }

    // Get module
    getModule(name) {
        return this.modules.get(name);
    }

    // Register event listener
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.eventListeners.get(event);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    // Trigger event
    triggerEvent(event, data = null) {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
    }

    // Handle errors
    handleError(error) {
        logger.error('Application error', null, error);
        
        this.state.set('error', {
            message: error.message || 'An unknown error occurred',
            timestamp: Date.now(),
            stack: error.stack,
        });

        // Use error handler for user-friendly error display
        errorHandler.handleError(error, {
            type: 'client',
            severity: 'medium',
            context: 'application',
        });

        // Trigger error event
        this.triggerEvent('app:error', error);
    }

    // Get application info
    getInfo() {
        return {
            name: config.app.name,
            version: config.app.version,
            environment: config.app.environment,
            isInitialized: this.isInitialized,
            isOnline: this.state.get('isOnline'),
            currentSection: this.state.get('currentSection'),
            settings: this.state.get('settings'),
            lastSync: this.state.get('lastSync'),
            modules: Array.from(this.modules.keys()),
            storageUsage: storageUtils.usage(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            features: {
                localStorage: supportsFeature('localStorage'),
                serviceWorker: supportsFeature('serviceWorker'),
                pushNotifications: supportsFeature('pushNotifications'),
                camera: supportsFeature('camera'),
                webGL: supportsFeature('webGL'),
            },
        };
    }

    // Cleanup application
    cleanup() {
        try {
            // Trigger cleanup event
            this.triggerEvent('app:cleanup');

            // Cleanup modules
            this.modules.forEach(module => {
                if (module && typeof module.cleanup === 'function') {
                    module.cleanup();
                }
            });

            // Clear event listeners
            this.eventListeners.clear();

            logger.info('BTM Utility cleanup completed');
        } catch (error) {
            logger.error('Cleanup error', null, error);
        }
    }
}

// Create global application instance
const app = new BTMUtility();

// Export application instance and utilities
export { app, AppState };

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export default application
export default app; 