/**
 * Core Application Module
 * BTM Utility application initialization and lifecycle management
 */

import { AppState } from './state.js';
import { config } from '../utils/config.js';
import { errorHandler } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';

/**
 * Main application class for BTM Utility
 * @class
 */
export class BTMApp {
    /**
     * Create a new BTMApp instance
     */
    constructor() {
        this.state = new AppState();
        this.modules = new Map();
        this.eventListeners = new Map();
        
        // Set version from config
        this.state.set('version', config.app.version);
        
        logger.info('BTM Utility initializing...', { version: config.app.version });
    }
    
    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async init() {
        try {
            logger.info('Starting application initialization');
            this.state.set('isLoading', true);
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Load settings
            await this.loadSettings();
            
            // Initialize modules
            await this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading screen and show main app
            this.hideLoadingScreen();
            this.showMainApp();
            
            // Set initialization flag
            this.state.set('isInitialized', true);
            this.state.set('isLoading', false);
            
            logger.info('Application initialization complete');
        } catch (error) {
            this.handleError(error);
            this.state.set('isLoading', false);
        }
    }
    
    /**
     * Initialize application modules
     * @returns {Promise<void>}
     * @private
     */
    async initializeModules() {
        // This will be implemented in a separate module loader
        logger.info('Initializing modules');
    }
    
    /**
     * Load application settings
     * @returns {Promise<void>}
     * @private
     */
    async loadSettings() {
        // This will be implemented in a settings service
        logger.info('Loading settings');
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        // This will be implemented in separate modules
        logger.info('Setting up event listeners');
    }
    
    /**
     * Show loading screen
     * @private
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }
    
    /**
     * Hide loading screen
     * @private
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
    
    /**
     * Show main app
     * @private
     */
    showMainApp() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.classList.remove('hidden');
        }
    }
    
    /**
     * Handle application errors
     * @param {Error} error - Error to handle
     * @private
     */
    handleError(error) {
        logger.error('Application error:', error);
        errorHandler.handleError(error);
        this.state.set('error', error.message);
    }
    
    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
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
    
    /**
     * Trigger event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    triggerEvent(event, data = null) {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error('Event listener error:', error);
                }
            });
        }
    }
    
    /**
     * Clean up application resources
     */
    cleanup() {
        logger.info('Cleaning up application resources');
        // This will be implemented to clean up resources
    }
} 