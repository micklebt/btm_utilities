/**
 * Storage Module
 * Local storage management with encryption and fallback support
 */

import { config } from './config.js?v=1.0.2';
import { generateId, deepClone, isEmpty } from './utils.js?v=1.0.2';

// Simple encryption/decryption (for production, use a proper encryption library)
class SimpleCrypto {
    constructor(key) {
        this.key = key;
    }

    encrypt(text) {
        try {
            const textToChars = text => text.split('').map(c => c.charCodeAt(0));
            const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
            const applySaltToChar = code => textToChars(this.key).reduce((a, b) => a ^ b, code);

            return text
                .split('')
                .map(textToChars)
                .map(applySaltToChar)
                .map(byteHex)
                .join('');
        } catch (error) {
            console.error('Encryption failed:', error);
            return text; // Return plain text if encryption fails
        }
    }

    decrypt(encoded) {
        try {
            const textToChars = text => text.split('').map(c => c.charCodeAt(0));
            const applySaltToChar = code => textToChars(this.key).reduce((a, b) => a ^ b, code);

            return encoded
                .match(/.{1,2}/g)
                .map(hex => parseInt(hex, 16))
                .map(applySaltToChar)
                .map(charCode => String.fromCharCode(charCode))
                .join('');
        } catch (error) {
            console.error('Decryption failed:', error);
            return encoded; // Return encoded text if decryption fails
        }
    }
}

// Storage class with encryption support
class Storage {
    constructor() {
        this.crypto = new SimpleCrypto(config.security.encryptionKey);
        this.supported = this.checkSupport();
        this.fallback = null;
        this.initFallback();
    }

    // Check if storage is supported
    checkSupport() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not supported, using fallback');
            return false;
        }
    }

    // Initialize fallback storage (in-memory)
    initFallback() {
        if (!this.supported) {
            this.fallback = new Map();
        }
    }

    // Set item with optional encryption
    setItem(key, value, encrypt = false) {
        try {
            const serializedValue = JSON.stringify(value);
            const finalValue = encrypt ? this.crypto.encrypt(serializedValue) : serializedValue;
            
            if (this.supported) {
                localStorage.setItem(key, finalValue);
            } else if (this.fallback) {
                this.fallback.set(key, finalValue);
            }
            
            return true;
        } catch (error) {
            console.error(`Failed to set storage item ${key}:`, error);
            return false;
        }
    }

    // Get item with optional decryption
    getItem(key, decrypt = false, defaultValue = null) {
        try {
            let value;
            
            if (this.supported) {
                value = localStorage.getItem(key);
            } else if (this.fallback) {
                value = this.fallback.get(key);
            }

            if (value === null || value === undefined) {
                return defaultValue;
            }

            const finalValue = decrypt ? this.crypto.decrypt(value) : value;
            return JSON.parse(finalValue);
        } catch (error) {
            console.error(`Failed to get storage item ${key}:`, error);
            return defaultValue;
        }
    }

    // Remove item
    removeItem(key) {
        try {
            if (this.supported) {
                localStorage.removeItem(key);
            } else if (this.fallback) {
                this.fallback.delete(key);
            }
            return true;
        } catch (error) {
            console.error(`Failed to remove storage item ${key}:`, error);
            return false;
        }
    }

    // Clear all items
    clear() {
        try {
            if (this.supported) {
                localStorage.clear();
            } else if (this.fallback) {
                this.fallback.clear();
            }
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    // Get all keys
    keys() {
        try {
            if (this.supported) {
                return Object.keys(localStorage);
            } else if (this.fallback) {
                return Array.from(this.fallback.keys());
            }
            return [];
        } catch (error) {
            console.error('Failed to get storage keys:', error);
            return [];
        }
    }

    // Check if key exists
    hasKey(key) {
        try {
            if (this.supported) {
                return localStorage.getItem(key) !== null;
            } else if (this.fallback) {
                return this.fallback.has(key);
            }
            return false;
        } catch (error) {
            console.error(`Failed to check storage key ${key}:`, error);
            return false;
        }
    }

    // Get storage size
    getSize() {
        try {
            if (this.supported) {
                return localStorage.length;
            } else if (this.fallback) {
                return this.fallback.size;
            }
            return 0;
        } catch (error) {
            console.error('Failed to get storage size:', error);
            return 0;
        }
    }

    // Get storage usage (approximate)
    getUsage() {
        try {
            if (this.supported) {
                let total = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        total += localStorage[key].length + key.length;
                    }
                }
                return total;
            }
            return 0;
        } catch (error) {
            console.error('Failed to get storage usage:', error);
            return 0;
        }
    }
}

// Create storage instances
const storage = new Storage();
const sessionStorage = new Storage();

// Data management functions
export class DataManager {
    constructor(storageKey, encrypt = false) {
        this.storageKey = storageKey;
        this.encrypt = encrypt;
        this.cache = null;
        this.cacheTimestamp = null;
    }

    // Save data
    save(data) {
        try {
            const dataToSave = {
                data: deepClone(data),
                timestamp: Date.now(),
                version: config.app.version,
            };

            const success = storage.setItem(this.storageKey, dataToSave, this.encrypt);
            
            if (success) {
                this.cache = dataToSave;
                this.cacheTimestamp = Date.now();
            }

            return success;
        } catch (error) {
            console.error(`Failed to save data for ${this.storageKey}:`, error);
            return false;
        }
    }

    // Load data
    load(defaultValue = null) {
        try {
            // Check cache first
            if (this.cache && this.cacheTimestamp && (Date.now() - this.cacheTimestamp) < 5000) {
                return deepClone(this.cache.data);
            }

            const saved = storage.getItem(this.storageKey, this.encrypt, null);
            
            if (saved && saved.data) {
                this.cache = saved;
                this.cacheTimestamp = Date.now();
                return deepClone(saved.data);
            }

            return defaultValue;
        } catch (error) {
            console.error(`Failed to load data for ${this.storageKey}:`, error);
            return defaultValue;
        }
    }

    // Update data
    update(updater) {
        try {
            const currentData = this.load();
            const updatedData = typeof updater === 'function' ? updater(currentData) : updater;
            return this.save(updatedData);
        } catch (error) {
            console.error(`Failed to update data for ${this.storageKey}:`, error);
            return false;
        }
    }

    // Delete data
    delete() {
        try {
            const success = storage.removeItem(this.storageKey);
            if (success) {
                this.cache = null;
                this.cacheTimestamp = null;
            }
            return success;
        } catch (error) {
            console.error(`Failed to delete data for ${this.storageKey}:`, error);
            return false;
        }
    }

    // Check if data exists
    exists() {
        return storage.hasKey(this.storageKey);
    }

    // Get last modified timestamp
    getLastModified() {
        try {
            const saved = storage.getItem(this.storageKey, this.encrypt, null);
            return saved && saved.timestamp ? saved.timestamp : null;
        } catch (error) {
            console.error(`Failed to get last modified for ${this.storageKey}:`, error);
            return null;
        }
    }
}

// Create data managers for different data types
export const collectionsManager = new DataManager(config.storage.collections, true);
export const contactsManager = new DataManager(config.storage.contacts, true);
export const todosManager = new DataManager(config.storage.todos, false);
export const settingsManager = new DataManager(config.storage.settings, true);
export const credentialsManager = new DataManager(config.storage.apiCredentials, true);
export const notificationsManager = new DataManager('btm_notifications', false);

// Session storage for temporary data
export const sessionManager = new DataManager('btm_session', false);

// Migration utilities
export class StorageMigration {
    static async migrateData(oldKey, newKey, transform = null) {
        try {
            const oldData = storage.getItem(oldKey, false, null);
            if (oldData) {
                let newData = oldData;
                if (transform && typeof transform === 'function') {
                    newData = transform(oldData);
                }
                
                const success = storage.setItem(newKey, newData, false);
                if (success) {
                    storage.removeItem(oldKey);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Migration failed:', error);
            return false;
        }
    }

    static async cleanupOldData(keysToRemove) {
        try {
            keysToRemove.forEach(key => {
                storage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Cleanup failed:', error);
            return false;
        }
    }
}

// Export storage utilities
export const storageUtils = {
    // Basic storage operations
    set: (key, value, encrypt = false) => storage.setItem(key, value, encrypt),
    get: (key, decrypt = false, defaultValue = null) => storage.getItem(key, decrypt, defaultValue),
    remove: (key) => storage.removeItem(key),
    clear: () => storage.clear(),
    keys: () => storage.keys(),
    has: (key) => storage.hasKey(key),
    size: () => storage.getSize(),
    usage: () => storage.getUsage(),

    // Session storage operations
    setSession: (key, value) => sessionStorage.setItem(key, value, false),
    getSession: (key, defaultValue = null) => sessionStorage.getItem(key, false, defaultValue),
    removeSession: (key) => sessionStorage.removeItem(key),
    clearSession: () => sessionStorage.clear(),

    // Data managers
    collections: collectionsManager,
    contacts: contactsManager,
    todos: todosManager,
    settings: settingsManager,
    credentials: credentialsManager,
    notifications: notificationsManager,
    session: sessionManager,

    // Migration
    migration: StorageMigration,
};

// Export default storage
export default storageUtils; 