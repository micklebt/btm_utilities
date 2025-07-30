/**
 * Settings Service
 * Manages application settings
 */

import { logger } from '../utils/logger.js';
import { storageUtils } from '../utils/storage.js';
import { config } from '../utils/config.js';

/**
 * Default settings
 * @type {Object}
 */
const DEFAULT_SETTINGS = {
    theme: 'dark',
    notifications: {
        enabled: true,
        sound: true,
    },
    display: {
        fontSize: 'medium',
        highContrast: false,
    },
    performance: {
        animations: true,
        reducedMotion: false,
    },
    privacy: {
        saveHistory: true,
        analytics: false,
    },
    developer: {
        debug: false,
        verboseLogging: false,
    },
};

/**
 * Settings service class
 * @class
 */
class SettingsService {
    /**
     * Create a new SettingsService instance
     */
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.listeners = new Map();
    }
    
    /**
     * Initialize settings
     * @returns {Promise<Object>} Settings object
     */
    async init() {
        logger.info('Initializing settings service');
        
        try {
            // Load settings from storage
            await this.loadSettings();
            
            // Apply settings
            this.applySettings();
            
            return this.settings;
        } catch (error) {
            logger.error('Failed to initialize settings', error);
            throw error;
        }
    }
    
    /**
     * Load settings from storage
     * @returns {Promise<Object>} Settings object
     */
    async loadSettings() {
        try {
            // Get settings from storage
            const storedSettings = storageUtils.get('settings', {});
            
            // Merge with default settings
            this.settings = {
                ...DEFAULT_SETTINGS,
                ...storedSettings,
                // Ensure version is up to date
                version: config.app.version,
            };
            
            logger.debug('Settings loaded', this.settings);
            
            return this.settings;
        } catch (error) {
            logger.error('Failed to load settings', error);
            throw error;
        }
    }
    
    /**
     * Save settings to storage
     * @returns {Promise<boolean>} Success flag
     */
    async saveSettings() {
        try {
            // Save settings to storage
            storageUtils.set('settings', this.settings);
            
            logger.debug('Settings saved');
            
            return true;
        } catch (error) {
            logger.error('Failed to save settings', error);
            throw error;
        }
    }
    
    /**
     * Apply settings to the application
     */
    applySettings() {
        try {
            // Apply theme
            this.applyTheme(this.settings.theme);
            
            // Apply font size
            this.applyFontSize(this.settings.display.fontSize);
            
            // Apply high contrast
            this.applyHighContrast(this.settings.display.highContrast);
            
            // Apply reduced motion
            this.applyReducedMotion(this.settings.performance.reducedMotion);
            
            // Apply debug mode
            this.applyDebugMode(this.settings.developer.debug);
            
            logger.debug('Settings applied');
        } catch (error) {
            logger.error('Failed to apply settings', error);
        }
    }
    
    /**
     * Get all settings
     * @returns {Object} Settings object
     */
    getAll() {
        return { ...this.settings };
    }
    
    /**
     * Get a specific setting
     * @param {string} key - Setting key (dot notation supported)
     * @param {*} defaultValue - Default value
     * @returns {*} Setting value
     */
    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.settings;
        
        for (const k of keys) {
            if (value === undefined || value === null || typeof value !== 'object') {
                return defaultValue;
            }
            
            value = value[k];
        }
        
        return value !== undefined ? value : defaultValue;
    }
    
    /**
     * Update a specific setting
     * @param {string} key - Setting key (dot notation supported)
     * @param {*} value - Setting value
     * @returns {Promise<boolean>} Success flag
     */
    async update(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let target = this.settings;
        
        // Navigate to the correct object
        for (const k of keys) {
            if (target[k] === undefined || target[k] === null || typeof target[k] !== 'object') {
                target[k] = {};
            }
            
            target = target[k];
        }
        
        // Update the value
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        // Save settings
        await this.saveSettings();
        
        // Apply settings
        this.applySettings();
        
        // Notify listeners
        this.notifyListeners(key, value, oldValue);
        
        return true;
    }
    
    /**
     * Reset settings to defaults
     * @returns {Promise<boolean>} Success flag
     */
    async reset() {
        // Store old settings for notification
        const oldSettings = { ...this.settings };
        
        // Reset to defaults
        this.settings = { ...DEFAULT_SETTINGS };
        
        // Save settings
        await this.saveSettings();
        
        // Apply settings
        this.applySettings();
        
        // Notify listeners
        this.notifyListeners('*', this.settings, oldSettings);
        
        return true;
    }
    
    /**
     * Subscribe to setting changes
     * @param {string} key - Setting key (dot notation supported, '*' for all)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
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
    
    /**
     * Notify listeners of setting changes
     * @param {string} key - Setting key
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     * @private
     */
    notifyListeners(key, newValue, oldValue) {
        // Notify specific listeners
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    logger.error('Error in settings listener', error);
                }
            });
        }
        
        // Notify global listeners
        const globalCallbacks = this.listeners.get('*');
        if (globalCallbacks) {
            globalCallbacks.forEach(callback => {
                try {
                    callback(this.settings, key, newValue, oldValue);
                } catch (error) {
                    logger.error('Error in global settings listener', error);
                }
            });
        }
    }
    
    /**
     * Apply theme setting
     * @param {string} theme - Theme name
     * @private
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    /**
     * Apply font size setting
     * @param {string} fontSize - Font size
     * @private
     */
    applyFontSize(fontSize) {
        document.documentElement.setAttribute('data-font-size', fontSize);
    }
    
    /**
     * Apply high contrast setting
     * @param {boolean} highContrast - High contrast flag
     * @private
     */
    applyHighContrast(highContrast) {
        document.documentElement.setAttribute('data-high-contrast', highContrast);
    }
    
    /**
     * Apply reduced motion setting
     * @param {boolean} reducedMotion - Reduced motion flag
     * @private
     */
    applyReducedMotion(reducedMotion) {
        document.documentElement.setAttribute('data-reduced-motion', reducedMotion);
    }
    
    /**
     * Apply debug mode setting
     * @param {boolean} debug - Debug mode flag
     * @private
     */
    applyDebugMode(debug) {
        document.documentElement.setAttribute('data-debug', debug);
    }
}

// Export singleton instance
export const settingsService = new SettingsService(); 