/**
 * Environment Management System
 * Handles development vs production configurations and environment-specific settings
 */

import { logger } from './logger.js?v=1.0.2';

class EnvironmentManager {
    constructor() {
        this.currentEnvironment = this.detectEnvironment();
        this.config = this.loadEnvironmentConfig();
        this.isInitialized = false;
    }

    // Detect current environment
    detectEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Development environments
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        // Staging environment (if using staging subdomain)
        if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        }
        
        // Production environment
        if (hostname === 'brianmickley.com' || hostname === 'www.brianmickley.com') {
            return 'production';
        }
        
        // Default to development for unknown hosts
        return 'development';
    }

    // Load environment-specific configuration
    loadEnvironmentConfig() {
        const baseConfig = {
            development: {
                name: 'Development',
                debug: true,
                apiBaseUrl: 'http://localhost:3000/api',
                websocketUrl: 'ws://localhost:3000',
                enableLogging: true,
                enableAnalytics: false,
                enableErrorReporting: false,
                cacheExpiry: 5 * 60 * 1000, // 5 minutes
                retryAttempts: 2,
                timeout: 10000,
                features: {
                    offlineMode: false,
                    pushNotifications: false,
                    voiceCommands: true,
                    cameraIntegration: false,
                    qrScanner: true,
                    dataSync: false,
                    auditLogging: true
                },
                security: {
                    encryptionEnabled: true,
                    sessionTimeout: 60 * 60 * 1000, // 1 hour
                    maxLoginAttempts: 5,
                    requireHttps: false
                },
                storage: {
                    maxSize: 50 * 1024 * 1024, // 50MB
                    enableCompression: false,
                    enableEncryption: true
                }
            },
            staging: {
                name: 'Staging',
                debug: true,
                apiBaseUrl: 'https://staging-api.brianmickley.com',
                websocketUrl: 'wss://staging-api.brianmickley.com',
                enableLogging: true,
                enableAnalytics: true,
                enableErrorReporting: true,
                cacheExpiry: 15 * 60 * 1000, // 15 minutes
                retryAttempts: 3,
                timeout: 15000,
                features: {
                    offlineMode: true,
                    pushNotifications: true,
                    voiceCommands: true,
                    cameraIntegration: true,
                    qrScanner: true,
                    dataSync: true,
                    auditLogging: true
                },
                security: {
                    encryptionEnabled: true,
                    sessionTimeout: 30 * 60 * 1000, // 30 minutes
                    maxLoginAttempts: 3,
                    requireHttps: true
                },
                storage: {
                    maxSize: 100 * 1024 * 1024, // 100MB
                    enableCompression: true,
                    enableEncryption: true
                }
            },
            production: {
                name: 'Production',
                debug: false,
                apiBaseUrl: 'https://api.brianmickley.com',
                websocketUrl: 'wss://api.brianmickley.com',
                enableLogging: false,
                enableAnalytics: true,
                enableErrorReporting: true,
                cacheExpiry: 60 * 60 * 1000, // 1 hour
                retryAttempts: 3,
                timeout: 20000,
                features: {
                    offlineMode: true,
                    pushNotifications: true,
                    voiceCommands: true,
                    cameraIntegration: true,
                    qrScanner: true,
                    dataSync: true,
                    auditLogging: true
                },
                security: {
                    encryptionEnabled: true,
                    sessionTimeout: 15 * 60 * 1000, // 15 minutes
                    maxLoginAttempts: 3,
                    requireHttps: true
                },
                storage: {
                    maxSize: 200 * 1024 * 1024, // 200MB
                    enableCompression: true,
                    enableEncryption: true
                }
            }
        };

        return baseConfig[this.currentEnvironment] || baseConfig.development;
    }

    // Initialize environment manager
    async init() {
        try {
            logger.info(`Initializing Environment Manager for ${this.config.name} environment`);
            
            // Validate environment configuration
            this.validateConfig();
            
            // Set up environment-specific features
            await this.setupEnvironmentFeatures();
            
            // Initialize security settings
            this.setupSecuritySettings();
            
            this.isInitialized = true;
            logger.info('Environment Manager initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize Environment Manager', null, error);
            throw error;
        }
    }

    // Validate environment configuration
    validateConfig() {
        const requiredFields = [
            'name', 'debug', 'apiBaseUrl', 'enableLogging', 
            'features', 'security', 'storage'
        ];

        const missingFields = requiredFields.filter(field => {
            return !this.config[field];
        });

        if (missingFields.length > 0) {
            throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
        }
    }

    // Set up environment-specific features
    async setupEnvironmentFeatures() {
        // Enable/disable features based on environment
        if (!this.config.features.offlineMode) {
            this.disableOfflineMode();
        }

        if (!this.config.features.pushNotifications) {
            this.disablePushNotifications();
        }

        if (!this.config.features.voiceCommands) {
            this.disableVoiceCommands();
        }

        // Set up analytics if enabled
        if (this.config.enableAnalytics) {
            this.setupAnalytics();
        }

        // Set up error reporting if enabled
        if (this.config.enableErrorReporting) {
            this.setupErrorReporting();
        }
    }

    // Set up security settings
    setupSecuritySettings() {
        // Enforce HTTPS in production
        if (this.config.security.requireHttps && window.location.protocol !== 'https:') {
            logger.warn('HTTPS is required in this environment');
        }

        // Set up session timeout
        if (this.config.security.sessionTimeout) {
            this.setupSessionTimeout();
        }
    }

    // Disable offline mode
    disableOfflineMode() {
        // Remove service worker if exists
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }
    }

    // Disable push notifications
    disablePushNotifications() {
        // Remove push notification permissions
        if ('Notification' in window && Notification.permission === 'granted') {
            // Note: Cannot programmatically revoke permissions, but can ignore them
            logger.info('Push notifications disabled for this environment');
        }
    }

    // Disable voice commands
    disableVoiceCommands() {
        // Remove voice-related event listeners
        const voiceElements = document.querySelectorAll('[data-voice-command]');
        voiceElements.forEach(element => {
            element.removeAttribute('data-voice-command');
        });
    }

    // Set up analytics
    setupAnalytics() {
        // Initialize analytics tracking
        logger.info('Analytics enabled for this environment');
        // Add analytics initialization code here
    }

    // Set up error reporting
    setupErrorReporting() {
        // Initialize error reporting service
        logger.info('Error reporting enabled for this environment');
        // Add error reporting initialization code here
    }

    // Set up session timeout
    setupSessionTimeout() {
        let sessionTimer;
        
        const resetTimer = () => {
            clearTimeout(sessionTimer);
            sessionTimer = setTimeout(() => {
                this.handleSessionTimeout();
            }, this.config.security.sessionTimeout);
        };

        // Reset timer on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Start initial timer
        resetTimer();
    }

    // Handle session timeout
    handleSessionTimeout() {
        logger.warn('Session timeout reached');
        
        // Clear stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login or show timeout message
        this.showSessionTimeoutMessage();
    }

    // Show session timeout message
    showSessionTimeoutMessage() {
        const message = document.createElement('div');
        message.className = 'session-timeout-message';
        message.innerHTML = `
            <div class="timeout-content">
                <h3>Session Expired</h3>
                <p>Your session has timed out due to inactivity. Please refresh the page to continue.</p>
                <button onclick="location.reload()">Refresh Page</button>
            </div>
        `;
        
        document.body.appendChild(message);
    }

    // Get current environment
    getEnvironment() {
        return this.currentEnvironment;
    }

    // Get environment configuration
    getConfig() {
        return { ...this.config };
    }

    // Get specific configuration value
    getConfigValue(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    // Check if feature is enabled
    isFeatureEnabled(feature) {
        return this.config.features[feature] || false;
    }

    // Check if debug mode is enabled
    isDebugEnabled() {
        return this.config.debug;
    }

    // Get API base URL
    getApiBaseUrl() {
        return this.config.apiBaseUrl;
    }

    // Get WebSocket URL
    getWebSocketUrl() {
        return this.config.websocketUrl;
    }

    // Check if HTTPS is required
    isHttpsRequired() {
        return this.config.security.requireHttps;
    }

    // Get storage configuration
    getStorageConfig() {
        return { ...this.config.storage };
    }

    // Get security configuration
    getSecurityConfig() {
        return { ...this.config.security };
    }

    // Update configuration (for runtime changes)
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        logger.info('Environment configuration updated', updates);
    }

    // Reload configuration
    async reloadConfig() {
        this.config = this.loadEnvironmentConfig();
        await this.setupEnvironmentFeatures();
        logger.info('Environment configuration reloaded');
    }
}

// Create singleton instance
export const environmentManager = new EnvironmentManager();

// Export utility functions
export const getEnvironment = () => environmentManager.getEnvironment();
export const getConfig = () => environmentManager.getConfig();
export const getConfigValue = (path) => environmentManager.getConfigValue(path);
export const isFeatureEnabled = (feature) => environmentManager.isFeatureEnabled(feature);
export const isDebugEnabled = () => environmentManager.isDebugEnabled();
export const getApiBaseUrl = () => environmentManager.getApiBaseUrl();
export const getWebSocketUrl = () => environmentManager.getWebSocketUrl();

export default environmentManager; 