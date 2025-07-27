/**
 * Configuration Manager Module
 * Admin interface for managing API credentials and system configuration
 */

import { secureStorageUtils } from './secure-storage.js?v=1.0.2';
import { logger } from './logger.js?v=1.0.2';
import { showNotification } from './notifications.js?v=1.0.2';

class ConfigManager {
    constructor() {
        this.isAdminMode = false;
        this.masterPassword = null;
        this.configModal = null;
        this.init();
    }

    init() {
        console.log('ConfigManager: Initializing...');
        this.setupEventListeners();
        this.checkAdminStatus();
        console.log('ConfigManager: Initialized successfully');
    }

    setupEventListeners() {
        console.log('ConfigManager: Setting up event listeners...');
        
        // Admin mode toggle
        document.addEventListener('click', (e) => {
            if (e.target.id === 'admin-toggle') {
                console.log('ConfigManager: Admin toggle clicked');
                this.toggleAdminMode();
            }
        });

        // Configuration form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'config-form') {
                e.preventDefault();
                this.handleConfigSubmit(e);
            }
        });

        // Master password form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'master-password-form') {
                e.preventDefault();
                this.handleMasterPasswordSubmit(e);
            }
        });

        // Close config modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-config') {
                this.hideConfigModal();
            }
        });
    }

    // Check if admin mode is active
    checkAdminStatus() {
        const adminIndicator = document.getElementById('admin-indicator');
        if (adminIndicator) {
            adminIndicator.style.display = this.isAdminMode ? 'block' : 'none';
        }
    }

    // Toggle admin mode (requires master password)
    async toggleAdminMode() {
        if (this.isAdminMode) {
            this.exitAdminMode();
        } else {
            await this.enterAdminMode();
        }
    }

    // Enter admin mode
    async enterAdminMode() {
        try {
            const password = await this.promptMasterPassword();
            if (password) {
                await secureStorageUtils.initialize(password);
                this.masterPassword = password;
                this.isAdminMode = true;
                this.checkAdminStatus();
                this.showConfigModal();
                showNotification('Admin mode activated', 'success');
                logger.info('Admin mode activated');
            }
        } catch (error) {
            showNotification('Invalid master password', 'error');
            logger.error('Failed to enter admin mode', null, error);
        }
    }

    // Exit admin mode
    exitAdminMode() {
        this.isAdminMode = false;
        this.masterPassword = null;
        this.checkAdminStatus();
        this.hideConfigModal();
        showNotification('Admin mode deactivated', 'info');
        logger.info('Admin mode deactivated');
    }

    // Prompt for master password
    async promptMasterPassword() {
        return new Promise((resolve) => {
            const modal = this.createPasswordModal();
            document.body.appendChild(modal);

            const form = modal.querySelector('#master-password-form');
            const input = modal.querySelector('#master-password-input');
            const cancelBtn = modal.querySelector('#cancel-password');

            const handleSubmit = (e) => {
                e.preventDefault();
                const password = input.value.trim();
                if (password.length >= 8) {
                    document.body.removeChild(modal);
                    resolve(password);
                } else {
                    showNotification('Password must be at least 8 characters', 'error');
                }
            };

            const handleCancel = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            form.addEventListener('submit', handleSubmit);
            cancelBtn.addEventListener('click', handleCancel);
            input.focus();
        });
    }

    // Create password prompt modal
    createPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Admin Access Required</h2>
                </div>
                <div class="modal-body">
                    <form id="master-password-form">
                        <div class="form-group">
                            <label for="master-password-input">Master Password</label>
                            <input type="password" id="master-password-input" class="form-input" 
                                   placeholder="Enter master password" required minlength="8">
                        </div>
                        <div class="button-group">
                            <button type="submit" class="primary-button">Enter Admin Mode</button>
                            <button type="button" id="cancel-password" class="secondary-button">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        return modal;
    }

    // Show configuration modal
    async showConfigModal() {
        if (!this.isAdminMode) {
            showNotification('Admin mode required', 'error');
            return;
        }

        this.configModal = this.createConfigModal();
        document.body.appendChild(this.configModal);
        await this.loadCurrentConfig();
    }

    // Hide configuration modal
    hideConfigModal() {
        if (this.configModal) {
            document.body.removeChild(this.configModal);
            this.configModal = null;
        }
    }

    // Create configuration modal
    createConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content config-modal">
                <div class="modal-header">
                    <h2>System Configuration</h2>
                    <button id="close-config" class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="config-form">
                        <div class="config-section">
                            <h3>API Credentials</h3>
                            <div class="form-group">
                                <label for="api-key">API Key</label>
                                <input type="password" id="api-key" name="apiKey" class="form-input" 
                                       placeholder="Enter API key" autocomplete="current-password">
                                <button type="button" class="toggle-password" data-target="api-key">👁️</button>
                            </div>
                            <div class="form-group">
                                <label for="twilio-sid">Twilio SID</label>
                                <input type="password" id="twilio-sid" name="twilioSid" class="form-input" 
                                       placeholder="Enter Twilio SID" autocomplete="new-password">
                                <button type="button" class="toggle-password" data-target="twilio-sid">👁️</button>
                            </div>
                            <div class="form-group">
                                <label for="twilio-token">Twilio Token</label>
                                <input type="password" id="twilio-token" name="twilioToken" class="form-input" 
                                       placeholder="Enter Twilio token" autocomplete="new-password">
                                <button type="button" class="toggle-password" data-target="twilio-token">👁️</button>
                            </div>
                        </div>
                        
                        <div class="config-section">
                            <h3>System Settings</h3>
                            <div class="form-group">
                                <label for="environment">Environment</label>
                                <select id="environment" name="environment" class="form-select">
                                    <option value="development">Development</option>
                                    <option value="production">Production</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="debug-mode">Debug Mode</label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="debug-mode" name="debugMode">
                                    <span class="checkmark"></span>
                                    Enable debug logging
                                </label>
                            </div>
                        </div>

                        <div class="config-section">
                            <h3>Security</h3>
                            <div class="form-group">
                                <label for="session-timeout">Session Timeout (minutes)</label>
                                <input type="number" id="session-timeout" name="sessionTimeout" 
                                       class="form-input" min="5" max="480" value="30">
                            </div>
                            <div class="form-group">
                                <label for="max-login-attempts">Max Login Attempts</label>
                                <input type="number" id="max-login-attempts" name="maxLoginAttempts" 
                                       class="form-input" min="3" max="10" value="5">
                            </div>
                        </div>

                        <div class="button-group">
                            <button type="submit" class="primary-button">Save Configuration</button>
                            <button type="button" id="test-credentials" class="secondary-button">Test Credentials</button>
                            <button type="button" id="export-config" class="secondary-button">Export Config</button>
                            <button type="button" id="import-config" class="secondary-button">Import Config</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add event listeners for password toggles
        modal.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const input = modal.querySelector(`#${targetId}`);
                if (input.type === 'password') {
                    input.type = 'text';
                    e.target.textContent = '🙈';
                } else {
                    input.type = 'password';
                    e.target.textContent = '👁️';
                }
            });
        });

        // Test credentials button
        modal.querySelector('#test-credentials').addEventListener('click', () => {
            this.testCredentials();
        });

        // Export config button
        modal.querySelector('#export-config').addEventListener('click', () => {
            this.exportConfig();
        });

        // Import config button
        modal.querySelector('#import-config').addEventListener('click', () => {
            this.importConfig();
        });

        return modal;
    }

    // Load current configuration
    async loadCurrentConfig() {
        try {
            const credentials = await secureStorageUtils.getCredentials();
            if (credentials) {
                Object.keys(credentials).forEach(key => {
                    const input = this.configModal.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = credentials[key];
                    }
                });
            }

            // Load other settings from localStorage
            const settings = JSON.parse(localStorage.getItem('btm_settings') || '{}');
            Object.keys(settings).forEach(key => {
                const input = this.configModal.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = settings[key];
                    } else {
                        input.value = settings[key];
                    }
                }
            });

        } catch (error) {
            logger.error('Failed to load configuration', null, error);
            showNotification('Failed to load configuration', 'error');
        }
    }

    // Handle configuration form submission
    async handleConfigSubmit(event) {
        const formData = new FormData(event.target);
        const config = {};

        // Collect form data
        for (const [key, value] of formData.entries()) {
            if (key === 'debugMode') {
                config[key] = true;
            } else {
                config[key] = value;
            }
        }

        // Handle checkbox separately
        const debugMode = event.target.querySelector('#debug-mode');
        config.debugMode = debugMode.checked;

        try {
            // Validate and save credentials
            const credentials = {
                apiKey: config.apiKey,
                twilioSid: config.twilioSid,
                twilioToken: config.twilioToken
            };

            secureStorageUtils.validateCredentials(credentials);
            await secureStorageUtils.storeCredentials(credentials);

            // Save other settings
            const settings = {
                environment: config.environment,
                debugMode: config.debugMode,
                sessionTimeout: parseInt(config.sessionTimeout),
                maxLoginAttempts: parseInt(config.maxLoginAttempts)
            };

            localStorage.setItem('btm_settings', JSON.stringify(settings));

            showNotification('Configuration saved successfully', 'success');
            logger.info('Configuration updated', { settings: Object.keys(settings) });

        } catch (error) {
            showNotification(`Configuration error: ${error.message}`, 'error');
            logger.error('Failed to save configuration', null, error);
        }
    }

    // Handle master password form submission
    handleMasterPasswordSubmit(event) {
        const password = event.target.querySelector('#master-password-input').value;
        if (password.length >= 8) {
            this.masterPassword = password;
            this.isAdminMode = true;
            this.checkAdminStatus();
            showNotification('Admin mode activated', 'success');
        } else {
            showNotification('Password must be at least 8 characters', 'error');
        }
    }

    // Test API credentials
    async testCredentials() {
        try {
            const credentials = await secureStorageUtils.getCredentials();
            if (!credentials) {
                showNotification('No credentials found', 'error');
                return;
            }

            // Test Twilio credentials
            const response = await fetch('https://api.twilio.com/2010-04-01/Accounts.json', {
                headers: {
                    'Authorization': 'Basic ' + btoa(`${credentials.twilioSid}:${credentials.twilioToken}`)
                }
            });

            if (response.ok) {
                showNotification('Credentials test successful', 'success');
            } else {
                showNotification('Credentials test failed', 'error');
            }

        } catch (error) {
            showNotification('Credentials test failed', 'error');
            logger.error('Credentials test failed', null, error);
        }
    }

    // Export configuration
    exportConfig() {
        try {
            const config = {
                timestamp: Date.now(),
                version: '1.0',
                settings: JSON.parse(localStorage.getItem('btm_settings') || '{}')
            };

            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `btm-config-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            showNotification('Configuration exported', 'success');
        } catch (error) {
            showNotification('Export failed', 'error');
            logger.error('Configuration export failed', null, error);
        }
    }

    // Import configuration
    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const config = JSON.parse(text);
                    
                    if (config.settings) {
                        localStorage.setItem('btm_settings', JSON.stringify(config.settings));
                        await this.loadCurrentConfig();
                        showNotification('Configuration imported', 'success');
                    }
                } catch (error) {
                    showNotification('Import failed: Invalid file format', 'error');
                    logger.error('Configuration import failed', null, error);
                }
            }
        };
        input.click();
    }

    // Get current configuration
    getCurrentConfig() {
        return {
            credentials: secureStorageUtils.hasCredentials(),
            settings: JSON.parse(localStorage.getItem('btm_settings') || '{}'),
            usage: secureStorageUtils.getUsage()
        };
    }
}

// Export configuration manager instance
export const configManager = new ConfigManager();

// Export utility functions
export const configManagerUtils = {
    // Get configuration manager instance
    getInstance() {
        return configManager;
    },

    // Check if admin mode is active
    isAdminMode() {
        return configManager.isAdminMode;
    },

    // Get current configuration
    getCurrentConfig() {
        return configManager.getCurrentConfig();
    },

    // Show configuration modal
    showConfig() {
        return configManager.showConfigModal();
    },

    // Hide configuration modal
    hideConfig() {
        return configManager.hideConfigModal();
    }
};

export default configManager; 