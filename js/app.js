/**
 * Main Application Module
 * BTM Utility application initialization and lifecycle management
 */

import { config, validateConfig } from './config.js?v=1.0.2';
import { storageUtils } from './storage.js?v=1.0.2';
import { generateId, formatDate, isMobile, supportsFeature, playSuccessBeep, playNotificationBeep } from './utils.js?v=1.0.2';
import { logger } from './logger.js?v=1.0.2';
import { errorHandler } from './error-handler.js?v=1.0.2';
import { secureStorageUtils } from './secure-storage.js?v=1.0.2';
import { configManager } from './config-manager.js?v=1.0.2';
import { environmentManager } from './environment-manager.js?v=1.0.2';
import { apiKeyManager } from './api-key-manager.js?v=1.0.2';

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
            console.log('BTM Utility: Starting initialization...');
            logger.info('Initializing BTM Utility...');
            
            // Validate configuration
            console.log('BTM Utility: Validating configuration...');
            if (!validateConfig()) {
                throw new Error('Invalid configuration');
            }

            // Show loading screen
            console.log('BTM Utility: Showing loading screen...');
            this.showLoadingScreen();

            // Initialize core modules
            console.log('BTM Utility: Initializing modules...');
            await this.initializeModules();

            // Load settings
            console.log('BTM Utility: Loading settings...');
            await this.loadSettings();

            // Set up event listeners
            console.log('BTM Utility: Setting up event listeners...');
            this.setupEventListeners();

            // Check online status
            console.log('BTM Utility: Checking online status...');
            this.updateOnlineStatus();

            // Hide loading screen and show main app
            console.log('BTM Utility: Hiding loading screen and showing main app...');
            this.hideLoadingScreen();
            this.showMainApp();

            // Mark as initialized
            this.state.set('isInitialized', true);
            this.isInitialized = true;

            console.log('BTM Utility: Initialization complete!');
            logger.info('BTM Utility initialized successfully');
            playSuccessBeep();
            
            // Trigger initialization event
            this.triggerEvent('app:initialized');

        } catch (error) {
            console.error('BTM Utility: Initialization failed!', error);
            logger.error('Failed to initialize BTM Utility', null, error);
            this.handleError(error);
        }
    }

    // Initialize core modules
    async initializeModules() {
        try {
            logger.info('Initializing core modules');
            
            // Initialize environment manager
            await environmentManager.init();
            this.modules.set('environment', environmentManager);
            
            // Initialize API key manager
            await apiKeyManager.init();
            this.modules.set('apiKeys', apiKeyManager);
            
            // Initialize config manager
            await configManager.init();
            this.modules.set('config', configManager);
            
            logger.info('Core modules initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize modules', null, error);
            throw error;
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
            // Use default settings for now
            const defaultSettings = {
                theme: 'default',
                language: 'en',
                notifications: true,
                autoSync: true,
                offlineMode: true,
                debugMode: false,
            };
            
            this.state.set('settings', defaultSettings);
            this.applySettings(defaultSettings);
            
            logger.info('Default settings applied successfully');
        } catch (error) {
            logger.warn('Failed to load settings, using defaults', null, error);
            
            // Use default settings
            const defaultSettings = {
                theme: 'default',
                language: 'en',
                notifications: true,
                autoSync: true,
                offlineMode: true,
                debugMode: false,
            };
            
            this.state.set('settings', defaultSettings);
            this.applySettings(defaultSettings);
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

        // Navigation
        this.setupNavigationListeners();
        
        // Form interactions
        this.setupFormListeners();
    }

    // Set up navigation listeners
    setupNavigationListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });
    }

    // Set up form listeners
    setupFormListeners() {
        // Money collection form
        const submitCollectionBtn = document.getElementById('submit-collection');
        if (submitCollectionBtn) {
            submitCollectionBtn.addEventListener('click', () => {
                this.handleCollectionSubmit();
            });
        }

        // Add task button
        const addTaskBtn = document.getElementById('add-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.handleAddTask();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-button');
        console.log('Settings button element:', settingsBtn);
        console.log('Settings button HTML:', settingsBtn ? settingsBtn.outerHTML : 'NOT FOUND');
        if (settingsBtn) {
            console.log('Adding click listener to settings button');
            settingsBtn.addEventListener('click', (e) => {
                console.log('Settings button clicked!', e.target);
                e.preventDefault();
                e.stopPropagation();
                this.showSettings();
            });
        } else {
            console.error('Settings button not found!');
        }

        // Close settings button
        const closeSettingsBtn = document.getElementById('close-settings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettings();
            });
        }
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

    // Show main application
    showMainApp() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.classList.remove('hidden');
        }
    }

    // Handle collection submit
    handleCollectionSubmit() {
        const locationSelect = document.getElementById('location-select');
        const machineSelect = document.getElementById('machine-select');
        const counterValue = document.getElementById('counter-value');
        const notes = document.getElementById('collection-notes');
        const coinsToOffice = document.getElementById('coins-to-office');

        if (!locationSelect.value || !machineSelect.value || !counterValue.value) {
            alert('Please fill in all required fields');
            return;
        }

        const collection = {
            location: locationSelect.value,
            machine: machineSelect.value,
            counterValue: parseInt(counterValue.value),
            notes: notes.value,
            coinsToOffice: coinsToOffice.checked,
            timestamp: new Date().toISOString()
        };

        logger.info('Collection submitted', collection);
        alert('Collection submitted successfully!');
        
        // Clear form
        locationSelect.value = '';
        machineSelect.value = '';
        counterValue.value = '';
        notes.value = '';
        coinsToOffice.checked = false;
    }

    // Handle add task
    handleAddTask() {
        const taskText = prompt('Enter task description:');
        if (taskText) {
            const task = {
                id: generateId('task'),
                text: taskText,
                completed: false,
                timestamp: new Date().toISOString()
            };
            
            logger.info('Task added', task);
            alert('Task added successfully!');
        }
    }

    // Show settings
    showSettings() {
        console.log('showSettings() called');
        const settingsModal = document.getElementById('settings-modal');
        console.log('Settings modal element:', settingsModal);
        if (settingsModal) {
            console.log('Showing settings modal');
            console.log('Modal classes before:', settingsModal.className);
            settingsModal.classList.add('show');
            console.log('Modal classes after showing:', settingsModal.className);
            console.log('Modal computed style display:', window.getComputedStyle(settingsModal).display);
            console.log('Modal computed style visibility:', window.getComputedStyle(settingsModal).visibility);
            console.log('Modal computed style opacity:', window.getComputedStyle(settingsModal).opacity);
        } else {
            console.error('Settings modal element not found!');
        }
    }

    // Hide settings
    hideSettings() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.classList.remove('show');
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

console.log('BTM Utility: App instance created, checking document ready state...');
console.log('Document ready state:', document.readyState);

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    console.log('BTM Utility: Document still loading, adding DOMContentLoaded listener...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('BTM Utility: DOMContentLoaded fired, initializing app...');
        app.init();
    });
} else {
    console.log('BTM Utility: Document already loaded, initializing app immediately...');
    app.init();
}

// Export default application
export default app; 