/**
 * Application State Management
 * Centralized state management for the BTM Utility application
 */

/**
 * AppState class for managing application state
 * @class
 */
export class AppState {
    /**
     * Create a new AppState instance
     */
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
            version: null, // Will be set from config
        };
        this.listeners = new Map();
    }

    /**
     * Get state value
     * @param {string|null} key - State key to get, or null for entire state
     * @returns {*} State value
     */
    get(key = null) {
        if (key === null) return { ...this.state };
        return this.state[key];
    }

    /**
     * Set state value
     * @param {string} key - State key to set
     * @param {*} value - New value
     */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notifyListeners(key, value, oldValue);
    }

    /**
     * Update multiple state values
     * @param {Object} updates - Object with key/value pairs to update
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            this.set(key, updates[key]);
        });
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to subscribe to
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
     * Notify listeners of state changes
     * @param {string} key - State key that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     * @private
     */
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