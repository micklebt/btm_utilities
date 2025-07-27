/**
 * API Key Validation and Rotation System
 * Manages API keys, validates them, and handles automatic rotation for security
 */

import { logger } from './logger.js?v=1.0.2';
import { secureStorageUtils } from './secure-storage.js?v=1.0.2';
import { environmentManager } from './environment-manager.js?v=1.0.2';

class APIKeyManager {
    constructor() {
        this.keys = new Map();
        this.rotationSchedule = new Map();
        this.validationCache = new Map();
        this.isInitialized = false;
        this.rotationInterval = null;
    }

    // Initialize API key manager
    async init() {
        try {
            logger.info('Initializing API Key Manager');
            
            // Load existing keys from secure storage
            await this.loadKeys();
            
            // Set up rotation monitoring
            this.setupRotationMonitoring();
            
            // Validate all keys
            await this.validateAllKeys();
            
            this.isInitialized = true;
            logger.info('API Key Manager initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize API Key Manager', null, error);
            throw error;
        }
    }

    // Load API keys from secure storage
    async loadKeys() {
        try {
            const storedKeys = await secureStorageUtils.get('api_keys');
            if (storedKeys) {
                this.keys = new Map(Object.entries(storedKeys));
                logger.info(`Loaded ${this.keys.size} API keys from storage`);
            }
        } catch (error) {
            logger.error('Failed to load API keys', null, error);
            this.keys = new Map();
        }
    }

    // Save API keys to secure storage
    async saveKeys() {
        try {
            const keysObject = Object.fromEntries(this.keys);
            await secureStorageUtils.set('api_keys', keysObject);
            logger.info('API keys saved to secure storage');
        } catch (error) {
            logger.error('Failed to save API keys', null, error);
            throw error;
        }
    }

    // Add or update an API key
    async addKey(service, key, options = {}) {
        const keyInfo = {
            key: key,
            service: service,
            createdAt: Date.now(),
            lastUsed: null,
            lastValidated: null,
            isValid: null,
            rotationDate: options.rotationDate || this.calculateRotationDate(),
            maxAge: options.maxAge || 90 * 24 * 60 * 60 * 1000, // 90 days default
            permissions: options.permissions || ['read', 'write'],
            description: options.description || '',
            environment: environmentManager.getEnvironment(),
            metadata: options.metadata || {}
        };

        this.keys.set(service, keyInfo);
        this.rotationSchedule.set(service, keyInfo.rotationDate);
        
        await this.saveKeys();
        logger.info(`API key added for service: ${service}`);
        
        return keyInfo;
    }

    // Get API key for a service
    async getKey(service) {
        const keyInfo = this.keys.get(service);
        if (!keyInfo) {
            throw new Error(`No API key found for service: ${service}`);
        }

        // Update last used timestamp
        keyInfo.lastUsed = Date.now();
        await this.saveKeys();

        return keyInfo.key;
    }

    // Get key information
    getKeyInfo(service) {
        return this.keys.get(service);
    }

    // Remove API key
    async removeKey(service) {
        const removed = this.keys.delete(service);
        this.rotationSchedule.delete(service);
        this.validationCache.delete(service);
        
        if (removed) {
            await this.saveKeys();
            logger.info(`API key removed for service: ${service}`);
        }
        
        return removed;
    }

    // Validate API key
    async validateKey(service, forceValidation = false) {
        const keyInfo = this.keys.get(service);
        if (!keyInfo) {
            throw new Error(`No API key found for service: ${service}`);
        }

        // Check cache first (unless forced)
        if (!forceValidation && this.validationCache.has(service)) {
            const cached = this.validationCache.get(service);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
                return cached.isValid;
            }
        }

        try {
            const isValid = await this.performValidation(service, keyInfo.key);
            
            // Update key info
            keyInfo.lastValidated = Date.now();
            keyInfo.isValid = isValid;
            await this.saveKeys();

            // Update cache
            this.validationCache.set(service, {
                isValid: isValid,
                timestamp: Date.now()
            });

            logger.info(`API key validation for ${service}: ${isValid ? 'VALID' : 'INVALID'}`);
            return isValid;
        } catch (error) {
            logger.error(`Failed to validate API key for ${service}`, null, error);
            return false;
        }
    }

    // Perform actual validation based on service type
    async performValidation(service, key) {
        switch (service.toLowerCase()) {
            case 'twilio':
                return await this.validateTwilioKey(key);
            case 'vapi':
                return await this.validateVapiKey(key);
            case 'google':
                return await this.validateGoogleKey(key);
            case 'make':
                return await this.validateMakeKey(key);
            default:
                return await this.validateGenericKey(service, key);
        }
    }

    // Validate Twilio API key
    async validateTwilioKey(key) {
        try {
            const response = await fetch('https://api.twilio.com/2010-04-01/Accounts.json', {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa(key)}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.status === 200;
        } catch (error) {
            logger.error('Twilio key validation failed', null, error);
            return false;
        }
    }

    // Validate VAPI key
    async validateVapiKey(key) {
        try {
            const response = await fetch('https://api.vapi.ai/assistant', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.status === 200;
        } catch (error) {
            logger.error('VAPI key validation failed', null, error);
            return false;
        }
    }

    // Validate Google API key
    async validateGoogleKey(key) {
        try {
            const response = await fetch(`https://www.googleapis.com/discovery/v1/apis?key=${key}`);
            return response.status === 200;
        } catch (error) {
            logger.error('Google key validation failed', null, error);
            return false;
        }
    }

    // Validate Make.com webhook key
    async validateMakeKey(key) {
        try {
            // Make.com webhooks are validated by testing the endpoint
            const response = await fetch(key, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ test: true })
            });
            
            return response.status === 200;
        } catch (error) {
            logger.error('Make.com key validation failed', null, error);
            return false;
        }
    }

    // Validate generic API key
    async validateGenericKey(service, key) {
        // For generic keys, we'll do a basic format validation
        const keyPatterns = {
            'api': /^[a-zA-Z0-9]{32,}$/,
            'token': /^[a-zA-Z0-9]{32,}$/,
            'secret': /^[a-zA-Z0-9]{32,}$/
        };

        for (const [type, pattern] of Object.entries(keyPatterns)) {
            if (service.toLowerCase().includes(type)) {
                return pattern.test(key);
            }
        }

        // Default validation - check if key is not empty and has reasonable length
        return key && key.length >= 16;
    }

    // Validate all keys
    async validateAllKeys() {
        const validationPromises = Array.from(this.keys.keys()).map(service => 
            this.validateKey(service, true)
        );

        const results = await Promise.allSettled(validationPromises);
        const validCount = results.filter(result => 
            result.status === 'fulfilled' && result.value
        ).length;

        logger.info(`Validated ${this.keys.size} API keys: ${validCount} valid, ${this.keys.size - validCount} invalid`);
        return validCount;
    }

    // Check if key needs rotation
    needsRotation(service) {
        const keyInfo = this.keys.get(service);
        if (!keyInfo) return false;

        const now = Date.now();
        const age = now - keyInfo.createdAt;
        const daysUntilRotation = (keyInfo.rotationDate - now) / (24 * 60 * 60 * 1000);

        return age >= keyInfo.maxAge || daysUntilRotation <= 0;
    }

    // Rotate API key
    async rotateKey(service, newKey, options = {}) {
        const oldKeyInfo = this.keys.get(service);
        if (!oldKeyInfo) {
            throw new Error(`No API key found for service: ${service}`);
        }

        // Create new key info
        const newKeyInfo = {
            ...oldKeyInfo,
            key: newKey,
            createdAt: Date.now(),
            lastUsed: null,
            lastValidated: null,
            isValid: null,
            rotationDate: options.rotationDate || this.calculateRotationDate(),
            previousKey: oldKeyInfo.key, // Keep reference to old key for rollback
            rotatedAt: Date.now()
        };

        // Validate new key before replacing
        const isValid = await this.performValidation(service, newKey);
        if (!isValid) {
            throw new Error(`New API key for ${service} failed validation`);
        }

        // Replace old key with new key
        this.keys.set(service, newKeyInfo);
        this.rotationSchedule.set(service, newKeyInfo.rotationDate);
        
        await this.saveKeys();
        logger.info(`API key rotated for service: ${service}`);

        // Trigger rotation event
        this.triggerRotationEvent(service, oldKeyInfo, newKeyInfo);

        return newKeyInfo;
    }

    // Calculate next rotation date
    calculateRotationDate() {
        const rotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days
        return Date.now() + rotationInterval;
    }

    // Set up rotation monitoring
    setupRotationMonitoring() {
        // Check for keys that need rotation every hour
        this.rotationInterval = setInterval(() => {
            this.checkRotationNeeds();
        }, 60 * 60 * 1000); // 1 hour

        // Initial check
        this.checkRotationNeeds();
    }

    // Check which keys need rotation
    async checkRotationNeeds() {
        const keysNeedingRotation = Array.from(this.keys.keys()).filter(service => 
            this.needsRotation(service)
        );

        if (keysNeedingRotation.length > 0) {
            logger.warn(`Keys needing rotation: ${keysNeedingRotation.join(', ')}`);
            this.triggerRotationAlert(keysNeedingRotation);
        }
    }

    // Trigger rotation alert
    triggerRotationAlert(services) {
        const event = new CustomEvent('api-key-rotation-needed', {
            detail: { services }
        });
        document.dispatchEvent(event);
    }

    // Trigger rotation event
    triggerRotationEvent(service, oldKey, newKey) {
        const event = new CustomEvent('api-key-rotated', {
            detail: { service, oldKey, newKey }
        });
        document.dispatchEvent(event);
    }

    // Get keys expiring soon
    getKeysExpiringSoon(days = 7) {
        const now = Date.now();
        const threshold = days * 24 * 60 * 60 * 1000;
        
        return Array.from(this.keys.entries())
            .filter(([service, keyInfo]) => {
                const daysUntilExpiry = (keyInfo.rotationDate - now) / (24 * 60 * 60 * 1000);
                return daysUntilExpiry <= days && daysUntilExpiry > 0;
            })
            .map(([service, keyInfo]) => ({
                service,
                daysUntilExpiry: Math.ceil((keyInfo.rotationDate - now) / (24 * 60 * 60 * 1000)),
                keyInfo
            }));
    }

    // Get key statistics
    getKeyStats() {
        const totalKeys = this.keys.size;
        const validKeys = Array.from(this.keys.values()).filter(key => key.isValid).length;
        const expiredKeys = Array.from(this.keys.values()).filter(key => 
            Date.now() > key.rotationDate
        ).length;
        const expiringSoon = this.getKeysExpiringSoon().length;

        return {
            total: totalKeys,
            valid: validKeys,
            invalid: totalKeys - validKeys,
            expired: expiredKeys,
            expiringSoon: expiringSoon,
            lastUpdated: Date.now()
        };
    }

    // Export keys (for backup)
    async exportKeys() {
        const keysData = Object.fromEntries(this.keys);
        return {
            keys: keysData,
            exportDate: Date.now(),
            environment: environmentManager.getEnvironment(),
            version: '1.0'
        };
    }

    // Import keys (for restore)
    async importKeys(data) {
        if (data.version !== '1.0') {
            throw new Error('Unsupported key export version');
        }

        this.keys = new Map(Object.entries(data.keys));
        await this.saveKeys();
        logger.info(`Imported ${this.keys.size} API keys`);
    }

    // Clean up
    cleanup() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        this.validationCache.clear();
    }
}

// Create singleton instance
export const apiKeyManager = new APIKeyManager();

// Export utility functions
export const addAPIKey = (service, key, options) => apiKeyManager.addKey(service, key, options);
export const getAPIKey = (service) => apiKeyManager.getKey(service);
export const validateAPIKey = (service, forceValidation) => apiKeyManager.validateKey(service, forceValidation);
export const rotateAPIKey = (service, newKey, options) => apiKeyManager.rotateKey(service, newKey, options);
export const getKeyStats = () => apiKeyManager.getKeyStats();

export default apiKeyManager; 