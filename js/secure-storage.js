/**
 * Secure Storage Module
 * Enhanced encryption system for API credentials and sensitive data
 */

import { config } from './config.js?v=1.0.2';
import { generateId, deepClone } from './utils.js?v=1.0.2';

// Enhanced encryption class using Web Crypto API when available
class SecureCrypto {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.saltLength = 16;
        this.iterations = 100000;
    }

    // Generate a secure encryption key from password
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.algorithm, length: this.keyLength },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt data with Web Crypto API
    async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            const key = await this.deriveKey(password, salt);
            const encodedData = encoder.encode(JSON.stringify(data));
            
            const encryptedData = await crypto.subtle.encrypt(
                { name: this.algorithm, iv: iv },
                key,
                encodedData
            );

            // Combine salt, IV, and encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    // Decrypt data with Web Crypto API
    async decrypt(encryptedData, password) {
        try {
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );

            const salt = combined.slice(0, this.saltLength);
            const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
            const data = combined.slice(this.saltLength + this.ivLength);

            const key = await this.deriveKey(password, salt);
            
            const decryptedData = await crypto.subtle.decrypt(
                { name: this.algorithm, iv: iv },
                key,
                data
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedData));
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    // Fallback encryption for older browsers
    fallbackEncrypt(data, password) {
        try {
            const textToChars = text => text.split('').map(c => c.charCodeAt(0));
            const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
            const applySaltToChar = code => textToChars(password).reduce((a, b) => a ^ b, code);

            const jsonData = JSON.stringify(data);
            return jsonData
                .split('')
                .map(textToChars)
                .map(applySaltToChar)
                .map(byteHex)
                .join('');
        } catch (error) {
            console.error('Fallback encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    // Fallback decryption for older browsers
    fallbackDecrypt(encoded, password) {
        try {
            const textToChars = text => text.split('').map(c => c.charCodeAt(0));
            const applySaltToChar = code => textToChars(password).reduce((a, b) => a ^ b, code);

            const decrypted = encoded
                .match(/.{1,2}/g)
                .map(hex => parseInt(hex, 16))
                .map(applySaltToChar)
                .map(charCode => String.fromCharCode(charCode))
                .join('');

            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Fallback decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }
}

// Secure storage class for API credentials
class SecureStorage {
    constructor() {
        this.crypto = new SecureCrypto();
        this.storageKey = 'btm_secure_';
        this.credentialsKey = 'api_credentials';
        this.supported = this.checkSupport();
        this.masterPassword = null;
    }

    // Check if secure storage is supported
    checkSupport() {
        return typeof crypto !== 'undefined' && 
               crypto.subtle && 
               typeof localStorage !== 'undefined';
    }

    // Set master password for credential encryption
    setMasterPassword(password) {
        if (!password || password.length < 8) {
            throw new Error('Master password must be at least 8 characters long');
        }
        this.masterPassword = password;
    }

    // Store API credentials securely
    async storeCredentials(credentials) {
        if (!this.masterPassword) {
            throw new Error('Master password not set');
        }

        if (!this.supported) {
            throw new Error('Secure storage not supported in this browser');
        }

        try {
            const encryptedData = await this.crypto.encrypt(credentials, this.masterPassword);
            const key = this.storageKey + this.credentialsKey;
            
            localStorage.setItem(key, encryptedData);
            
            // Store metadata
            const metadata = {
                timestamp: Date.now(),
                version: '1.0',
                checksum: this.generateChecksum(credentials)
            };
            
            localStorage.setItem(key + '_meta', JSON.stringify(metadata));
            
            return true;
        } catch (error) {
            console.error('Failed to store credentials:', error);
            throw error;
        }
    }

    // Retrieve API credentials
    async getCredentials() {
        if (!this.masterPassword) {
            throw new Error('Master password not set');
        }

        if (!this.supported) {
            throw new Error('Secure storage not supported in this browser');
        }

        try {
            const key = this.storageKey + this.credentialsKey;
            const encryptedData = localStorage.getItem(key);
            
            if (!encryptedData) {
                return null;
            }

            const credentials = await this.crypto.decrypt(encryptedData, this.masterPassword);
            
            // Verify checksum
            const metadata = JSON.parse(localStorage.getItem(key + '_meta') || '{}');
            if (metadata.checksum !== this.generateChecksum(credentials)) {
                throw new Error('Credential integrity check failed');
            }

            return credentials;
        } catch (error) {
            console.error('Failed to retrieve credentials:', error);
            throw error;
        }
    }

    // Update specific credential
    async updateCredential(key, value) {
        const credentials = await this.getCredentials() || {};
        credentials[key] = value;
        return await this.storeCredentials(credentials);
    }

    // Remove specific credential
    async removeCredential(key) {
        const credentials = await this.getCredentials() || {};
        delete credentials[key];
        return await this.storeCredentials(credentials);
    }

    // Clear all credentials
    clearCredentials() {
        const key = this.storageKey + this.credentialsKey;
        localStorage.removeItem(key);
        localStorage.removeItem(key + '_meta');
        this.masterPassword = null;
    }

    // Check if credentials exist
    hasCredentials() {
        const key = this.storageKey + this.credentialsKey;
        return localStorage.getItem(key) !== null;
    }

    // Generate checksum for integrity verification
    generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    // Get storage usage information
    getUsage() {
        const key = this.storageKey + this.credentialsKey;
        const data = localStorage.getItem(key);
        const metadata = localStorage.getItem(key + '_meta');
        
        return {
            hasCredentials: data !== null,
            dataSize: data ? data.length : 0,
            metadataSize: metadata ? metadata.length : 0,
            lastModified: metadata ? JSON.parse(metadata).timestamp : null
        };
    }

    // Validate credential format
    validateCredentials(credentials) {
        const required = ['apiKey', 'twilioSid', 'twilioToken'];
        const missing = required.filter(key => !credentials[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required credentials: ${missing.join(', ')}`);
        }

        // Validate API key format (basic check)
        if (credentials.apiKey && credentials.apiKey.length < 10) {
            throw new Error('API key appears to be invalid (too short)');
        }

        // Validate Twilio SID format
        if (credentials.twilioSid && !credentials.twilioSid.startsWith('AC')) {
            throw new Error('Twilio SID appears to be invalid (should start with AC)');
        }

        return true;
    }
}

// Export secure storage instance
export const secureStorage = new SecureStorage();

// Export utility functions
export const secureStorageUtils = {
    // Initialize secure storage with master password
    async initialize(password) {
        secureStorage.setMasterPassword(password);
        return true;
    },

    // Store API credentials
    async storeCredentials(credentials) {
        secureStorage.validateCredentials(credentials);
        return await secureStorage.storeCredentials(credentials);
    },

    // Get API credentials
    async getCredentials() {
        return await secureStorage.getCredentials();
    },

    // Update specific credential
    async updateCredential(key, value) {
        return await secureStorage.updateCredential(key, value);
    },

    // Remove specific credential
    async removeCredential(key) {
        return await secureStorage.removeCredential(key);
    },

    // Clear all credentials
    clearCredentials() {
        secureStorage.clearCredentials();
    },

    // Check if credentials exist
    hasCredentials() {
        return secureStorage.hasCredentials();
    },

    // Get usage information
    getUsage() {
        return secureStorage.getUsage();
    },

    // Validate credentials
    validateCredentials(credentials) {
        return secureStorage.validateCredentials(credentials);
    }
};

export default secureStorage; 