/**
 * Configuration Module
 * Centralized configuration management for BTM Utility
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname === 'brianmickley.com';

// Base configuration
export const config = {
    // Application settings
    app: {
        name: 'BTM Utility',
        version: '1.0.0',
        environment: isDevelopment ? 'development' : 'production',
        debug: isDevelopment,
        apiTimeout: 30000, // 30 seconds
        retryAttempts: 3,
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    },

    // API endpoints
    api: {
        baseUrl: isDevelopment ? 'http://localhost:3000/api' : 'https://brianmickley.com/api',
        endpoints: {
            collections: '/collections',
            contacts: '/contacts',
            todos: '/todos',
            cameras: '/cameras',
            climate: '/climate',
            settings: '/settings',
            sync: '/sync',
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    },

    // Twilio configuration
    twilio: {
        accountSid: '',
        authToken: '',
        phoneNumber: '',
        webhookUrl: isDevelopment ? 'http://localhost:3000/webhook/twilio' : 'https://brianmickley.com/webhook/twilio',
    },

    // VAPI configuration
    vapi: {
        apiKey: '',
        baseUrl: 'https://api.vapi.ai',
        webhookUrl: isDevelopment ? 'http://localhost:3000/webhook/vapi' : 'https://brianmickley.com/webhook/vapi',
    },

    // Google Workspace APIs
    google: {
        clientId: '',
        apiKey: '',
        scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/calendar',
        ],
        discoveryDocs: [
            'https://gmail.googleapis.com/$discovery/rest?version=v1',
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        ],
    },

    // Make.com webhooks
    make: {
        webhookUrl: '',
        secret: '',
    },

    // Local storage keys
    storage: {
        collections: 'btm_collections',
        contacts: 'btm_contacts',
        todos: 'btm_todos',
        settings: 'btm_settings',
        apiCredentials: 'btm_api_credentials',
        syncTimestamp: 'btm_sync_timestamp',
        offlineData: 'btm_offline_data',
    },

    // UI configuration
    ui: {
        theme: {
            primary: '#0066cc',
            secondary: '#ffffff',
            accent: '#e6f3ff',
            success: '#28a745',
            warning: '#ffc107',
            danger: '#dc3545',
            info: '#17a2b8',
        },
        animations: {
            duration: 250,
            easing: 'ease-in-out',
        },
        notifications: {
            duration: 5000,
            maxVisible: 3,
        },
    },

    // Feature flags
    features: {
        offlineMode: true,
        pushNotifications: true,
        cameraIntegration: true,
        climateControl: true,
        qrScanner: true,
        voiceCommands: true,
        dataSync: true,
        auditLogging: true,
    },

    // Security settings
    security: {
        encryptionKey: 'btm-default-key-change-in-production',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        passwordMinLength: 8,
        requireSpecialChars: true,
    },

    // Performance settings
    performance: {
        debounceDelay: 300,
        throttleDelay: 100,
        maxConcurrentRequests: 5,
        requestQueueSize: 10,
        imageOptimization: true,
        lazyLoading: true,
    },
};

// Environment-specific overrides
if (isDevelopment) {
    config.app.debug = true;
    config.api.baseUrl = 'http://localhost:3000/api';
    config.features.offlineMode = false; // Disable offline mode in development
}

// Production-specific overrides
if (isProduction) {
    config.app.debug = false;
    config.security.encryptionKey = process.env.ENCRYPTION_KEY;
    config.features.auditLogging = true;
}

// Validation function
export function validateConfig() {
    const requiredFields = [
        'app.name',
        'app.version',
        'api.baseUrl',
        'storage.collections',
        'storage.contacts',
        'storage.todos',
    ];

    const missingFields = requiredFields.filter(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], config);
        return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
        console.error('Missing required configuration fields:', missingFields);
        return false;
    }

    return true;
}

// Configuration getter with fallback
export function getConfig(path, defaultValue = null) {
    try {
        const value = path.split('.').reduce((obj, key) => obj?.[key], config);
        return value !== undefined && value !== null ? value : defaultValue;
    } catch (error) {
        console.warn(`Error accessing config path "${path}":`, error);
        return defaultValue;
    }
}

// Configuration setter
export function setConfig(path, value) {
    try {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, config);
        target[lastKey] = value;
        return true;
    } catch (error) {
        console.error(`Error setting config path "${path}":`, error);
        return false;
    }
}

// Export default configuration
export default config; 