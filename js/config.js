/**
 * Configuration Module
 * Centralized configuration for the BTM Utility application
 */

export const config = {
    // Application settings
    app: {
        name: 'BTM Utility',
        version: '1.0.0',
        debug: true,
        environment: 'development'
    },

    // Storage configuration
    storage: {
        collections: 'btm_collections',
        contacts: 'btm_contacts',

        settings: 'btm_settings',
        apiCredentials: 'btm_api_credentials'
    },

    // Security configuration
    security: {
        encryptionKey: 'btm-utility-encryption-key-2024',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 3
    },

    // API configuration
    api: {
        baseUrl: 'https://api.brianmickley.com',
        timeout: 10000,
        retryAttempts: 3
    },

    // Notification settings
    notifications: {
        defaultTimeout: 5000,
        maxNotifications: 50,
        soundEnabled: true,
        vibrationEnabled: true
    },

    // Feature flags
    features: {
        qrScanner: true,
        cameraFeeds: true,
        climateControl: true,
        adminMode: true
    }
};

// Validation function
export function validateConfig() {
    const requiredFields = [
        'app.name',
        'app.version',
        'storage.collections',
        'storage.contacts',

        'storage.settings',
        'storage.apiCredentials'
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

export default config; 