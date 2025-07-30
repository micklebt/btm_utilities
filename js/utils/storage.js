/**
 * Storage Module
 * Utilities for working with browser storage
 */

import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Storage utilities
 */
class StorageUtils {
    /**
     * Create a new StorageUtils instance
     */
    constructor() {
        this.prefix = config.storage.prefix;
        this.version = config.storage.version;
    }
    
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} [defaultValue] - Default value if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const prefixedKey = this._getPrefixedKey(key);
            const item = localStorage.getItem(prefixedKey);
            
            if (item === null) {
                return defaultValue;
            }
            
            return JSON.parse(item);
        } catch (error) {
            logger.error(`Error getting item from storage: ${key}`, error);
            return defaultValue;
        }
    }
    
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} True if successful
     */
    set(key, value) {
        try {
            const prefixedKey = this._getPrefixedKey(key);
            localStorage.setItem(prefixedKey, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error(`Error setting item in storage: ${key}`, error);
            return false;
        }
    }
    
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if successful
     */
    remove(key) {
        try {
            const prefixedKey = this._getPrefixedKey(key);
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            logger.error(`Error removing item from storage: ${key}`, error);
            return false;
        }
    }
    
    /**
     * Check if item exists in localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if exists
     */
    has(key) {
        try {
            const prefixedKey = this._getPrefixedKey(key);
            return localStorage.getItem(prefixedKey) !== null;
        } catch (error) {
            logger.error(`Error checking if item exists in storage: ${key}`, error);
            return false;
        }
    }
    
    /**
     * Clear all app-specific items from localStorage
     * @returns {boolean} True if successful
     */
    clear() {
        try {
            const keys = this._getAllKeys();
            
            for (const key of keys) {
                localStorage.removeItem(key);
            }
            
            return true;
        } catch (error) {
            logger.error('Error clearing storage', error);
            return false;
        }
    }
    
    /**
     * Get all storage keys for this app
     * @returns {string[]} Array of keys
     * @private
     */
    _getAllKeys() {
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        
        return keys;
    }
    
    /**
     * Get prefixed key
     * @param {string} key - Original key
     * @returns {string} Prefixed key
     * @private
     */
    _getPrefixedKey(key) {
        return `${this.prefix}${key}_v${this.version}`;
    }
    
    /**
     * Get storage size in bytes
     * @returns {number} Size in bytes
     */
    getSize() {
        let size = 0;
        const keys = this._getAllKeys();
        
        for (const key of keys) {
            const item = localStorage.getItem(key) || '';
            size += key.length + item.length;
        }
        
        return size;
    }
    
    /**
     * Export all storage data
     * @returns {Object} Storage data
     */
    exportData() {
        const data = {};
        const keys = this._getAllKeys();
        
        for (const prefixedKey of keys) {
            const key = prefixedKey.substring(this.prefix.length, prefixedKey.lastIndexOf('_v'));
            const item = localStorage.getItem(prefixedKey);
            
            if (item !== null) {
                try {
                    data[key] = JSON.parse(item);
                } catch (error) {
                    data[key] = item;
                }
            }
        }
        
        return data;
    }
    
    /**
     * Import storage data
     * @param {Object} data - Storage data
     * @returns {boolean} True if successful
     */
    importData(data) {
        try {
            for (const [key, value] of Object.entries(data)) {
                this.set(key, value);
            }
            
            return true;
        } catch (error) {
            logger.error('Error importing storage data', error);
            return false;
        }
    }
}

// Export singleton instance
export const storageUtils = new StorageUtils(); 