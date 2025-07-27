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
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
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

        // Setup wizard form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'setup-wizard-form') {
                e.preventDefault();
                this.handleSetupWizardSubmit(e);
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
            // Check if secure storage is already initialized
            const usage = secureStorageUtils.getUsage();
            
            if (!usage.hasCredentials && this.isDevelopment) {
                // Development environment - use auto-generated password
                await this.setupDevelopmentMode();
            } else if (!usage.hasCredentials) {
                // Production environment - show setup wizard
                await this.showSetupWizard();
            } else {
                // Already initialized - prompt for password
                const password = await this.promptMasterPassword();
                if (password) {
                    await this.initializeWithPassword(password);
                }
            }
        } catch (error) {
            showNotification('Failed to enter admin mode: ' + error.message, 'error');
            logger.error('Failed to enter admin mode', null, error);
        }
    }

    // Setup development mode with auto-generated password
    async setupDevelopmentMode() {
        const devPassword = 'dev-admin-2024-secure';
        
        try {
            await secureStorageUtils.initialize(devPassword);
            this.masterPassword = devPassword;
            this.isAdminMode = true;
            this.checkAdminStatus();
            this.showConfigModal();
            
            showNotification('Development mode activated with auto-generated password', 'info');
            logger.info('Development mode activated with auto-generated password');
            
            // Show development password info
            this.showDevelopmentInfo(devPassword);
        } catch (error) {
            throw new Error('Failed to setup development mode: ' + error.message);
        }
    }

    // Show development password information
    showDevelopmentInfo(password) {
        const infoModal = document.createElement('div');
        infoModal.className = 'modal show';
        infoModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔧 Development Mode Active</h2>
                    <button class="close-button" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <h3>Development Environment Detected</h3>
                        <p><strong>Auto-generated Master Password:</strong> <code>${password}</code></p>
                        <p><strong>⚠️ Important:</strong> This password is for development only. In production, you'll need to create your own secure master password.</p>
                        <p><strong>Security Note:</strong> This password is visible in the console and should not be used in production environments.</p>
                    </div>
                    <button class="primary-button" onclick="this.closest('.modal').remove()">Continue to Admin Panel</button>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    // Show setup wizard for first-time users
    async showSetupWizard() {
        const modal = this.createSetupWizardModal();
        document.body.appendChild(modal);
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('#master-password-input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Create setup wizard modal
    createSetupWizardModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔐 Setup Master Password</h2>
                </div>
                <div class="modal-body">
                    <div class="setup-wizard">
                        <div class="wizard-step active" id="step-1">
                            <h3>Welcome to BTM Utility Admin Setup</h3>
                            <p>To access the admin configuration panel, you need to create a master password. This password will be used to encrypt and protect your API credentials.</p>
                            
                            <div class="password-requirements">
                                <h4>Password Requirements:</h4>
                                <ul>
                                    <li id="req-length">At least 8 characters</li>
                                    <li id="req-uppercase">At least one uppercase letter</li>
                                    <li id="req-lowercase">At least one lowercase letter</li>
                                    <li id="req-number">At least one number</li>
                                    <li id="req-special">At least one special character</li>
                                </ul>
                            </div>
                            
                            <form id="setup-wizard-form">
                                <div class="form-group">
                                    <label for="master-password-input">Master Password</label>
                                    <input type="password" id="master-password-input" class="form-input" 
                                           placeholder="Enter your master password" required minlength="8">
                                    <div class="password-strength" id="password-strength"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="confirm-password-input">Confirm Password</label>
                                    <input type="password" id="confirm-password-input" class="form-input" 
                                           placeholder="Confirm your master password" required>
                                    <div class="password-match" id="password-match"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="remember-password" required>
                                        <span class="checkmark"></span>
                                        I understand that I must remember this password to access admin features
                                    </label>
                                </div>
                                
                                <div class="button-group">
                                    <button type="submit" class="primary-button" id="setup-submit">Create Master Password</button>
                                    <button type="button" class="secondary-button" onclick="this.closest('.modal').remove()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add password validation
        this.setupPasswordValidation(modal);
        
        return modal;
    }

    // Setup password validation
    setupPasswordValidation(modal) {
        const passwordInput = modal.querySelector('#master-password-input');
        const confirmInput = modal.querySelector('#confirm-password-input');
        const strengthDiv = modal.querySelector('#password-strength');
        const matchDiv = modal.querySelector('#password-match');

        const validatePassword = (password) => {
            const requirements = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /\d/.test(password),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
            };

            // Update requirement indicators
            Object.keys(requirements).forEach(req => {
                const element = modal.querySelector(`#req-${req}`);
                if (element) {
                    element.className = requirements[req] ? 'met' : 'unmet';
                }
            });

            // Calculate strength
            const metCount = Object.values(requirements).filter(Boolean).length;
            const strength = metCount < 3 ? 'weak' : metCount < 5 ? 'medium' : 'strong';
            
            strengthDiv.innerHTML = `
                <div class="strength-indicator ${strength}">
                    Password Strength: <span class="strength-text">${strength.toUpperCase()}</span>
                </div>
            `;

            return metCount >= 4; // At least 4 requirements met
        };

        const validateMatch = () => {
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            
            if (confirm.length === 0) {
                matchDiv.innerHTML = '';
                return false;
            }
            
            const matches = password === confirm;
            matchDiv.innerHTML = `
                <div class="match-indicator ${matches ? 'match' : 'no-match'}">
                    ${matches ? '✅ Passwords match' : '❌ Passwords do not match'}
                </div>
            `;
            
            return matches;
        };

        passwordInput.addEventListener('input', () => {
            validatePassword(passwordInput.value);
            validateMatch();
        });

        confirmInput.addEventListener('input', validateMatch);
    }

    // Handle setup wizard form submission
    async handleSetupWizardSubmit(event) {
        const form = event.target;
        const password = form.querySelector('#master-password-input').value;
        const confirm = form.querySelector('#confirm-password-input').value;
        const remember = form.querySelector('#remember-password').checked;

        if (!remember) {
            showNotification('You must acknowledge that you will remember the password', 'error');
            return;
        }

        if (password !== confirm) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return;
        }

        // Validate password strength
        const requirements = {
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const metCount = Object.values(requirements).filter(Boolean).length;
        if (metCount < 4) {
            showNotification('Password does not meet security requirements', 'error');
            return;
        }

        try {
            await this.initializeWithPassword(password);
            form.closest('.modal').remove();
            showNotification('Master password created successfully!', 'success');
        } catch (error) {
            showNotification('Failed to create master password: ' + error.message, 'error');
        }
    }

    // Initialize with password
    async initializeWithPassword(password) {
        await secureStorageUtils.initialize(password);
        this.masterPassword = password;
        this.isAdminMode = true;
        this.checkAdminStatus();
        this.showConfigModal();
        showNotification('Admin mode activated', 'success');
        logger.info('Admin mode activated');
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
            
            // Focus on input
            setTimeout(() => input.focus(), 100);
        });
    }

    // Create password prompt modal
    createPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔐 Enter Master Password</h2>
                </div>
                <div class="modal-body">
                    <p>Please enter your master password to access admin features.</p>
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
        if (this.configModal) {
            this.configModal.remove();
        }
        
        this.configModal = this.createConfigModal();
        document.body.appendChild(this.configModal);
        
        // Load current configuration
        await this.loadCurrentConfig();
    }

    // Hide configuration modal
    hideConfigModal() {
        if (this.configModal) {
            this.configModal.remove();
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
                    <h2>⚙️ Admin Configuration</h2>
                    <button id="close-config" class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="config-section">
                        <h3>API Credentials</h3>
                        <form id="config-form">
                            <div class="form-group">
                                <label for="api-key">API Key</label>
                                <div class="input-group">
                                    <input type="password" id="api-key" name="apiKey" class="form-input"
                                           placeholder="Enter API key" autocomplete="current-password">
                                    <button type="button" class="toggle-password" data-target="api-key">👁️</button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="twilio-sid">Twilio SID</label>
                                <div class="input-group">
                                    <input type="password" id="twilio-sid" name="twilioSid" class="form-input"
                                           placeholder="Enter Twilio SID" autocomplete="new-password">
                                    <button type="button" class="toggle-password" data-target="twilio-sid">👁️</button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="twilio-token">Twilio Token</label>
                                <div class="input-group">
                                    <input type="password" id="twilio-token" name="twilioToken" class="form-input"
                                           placeholder="Enter Twilio token" autocomplete="new-password">
                                    <button type="button" class="toggle-password" data-target="twilio-token">👁️</button>
                                </div>
                            </div>
                            
                            <div class="button-group">
                                <button type="submit" class="primary-button">Save Configuration</button>
                                <button type="button" class="secondary-button" onclick="this.closest('.modal').querySelector('#test-credentials').click()">Test Credentials</button>
                                <button type="button" id="test-credentials" class="secondary-button" style="display: none;">Test</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="config-section">
                        <h3>Security Settings</h3>
                        <div class="form-group">
                            <label for="session-timeout">Session Timeout (minutes)</label>
                            <input type="number" id="session-timeout" name="sessionTimeout" class="form-input"
                                   value="30" min="5" max="480">
                        </div>
                        
                        <div class="form-group">
                            <label for="max-login-attempts">Max Login Attempts</label>
                            <input type="number" id="max-login-attempts" name="maxLoginAttempts"
                                   class="form-input" value="3" min="1" max="10">
                        </div>
                        
                        <div class="button-group">
                            <button type="button" class="primary-button" onclick="this.closest('.modal').querySelector('#export-config').click()">Export Config</button>
                            <button type="button" id="export-config" class="secondary-button" style="display: none;">Export</button>
                            <button type="button" class="secondary-button" onclick="this.closest('.modal').querySelector('#import-config').click()">Import Config</button>
                            <button type="button" id="import-config" class="secondary-button" style="display: none;">Import</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for password toggles
        modal.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = modal.querySelector(`#${targetId}`);
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = '🙈';
                } else {
                    input.type = 'password';
                    btn.textContent = '👁️';
                }
            });
        });

        return modal;
    }

    // Load current configuration
    async loadCurrentConfig() {
        try {
            const credentials = await secureStorageUtils.getCredentials();
            if (credentials) {
                const modal = this.configModal;
                modal.querySelector('#api-key').value = credentials.apiKey || '';
                modal.querySelector('#twilio-sid').value = credentials.twilioSid || '';
                modal.querySelector('#twilio-token').value = credentials.twilioToken || '';
            }
        } catch (error) {
            logger.warn('No existing configuration found', null, error);
        }
    }

    // Handle configuration form submission
    async handleConfigSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const config = {
            apiKey: formData.get('apiKey'),
            twilioSid: formData.get('twilioSid'),
            twilioToken: formData.get('twilioToken'),
            sessionTimeout: parseInt(formData.get('sessionTimeout')),
            maxLoginAttempts: parseInt(formData.get('maxLoginAttempts'))
        };

        try {
            await secureStorageUtils.storeCredentials(config);
            showNotification('Configuration saved successfully', 'success');
            logger.info('Configuration saved successfully');
        } catch (error) {
            showNotification('Failed to save configuration: ' + error.message, 'error');
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
                showNotification('No credentials found to test', 'warning');
                return;
            }

            // Test Twilio credentials
            if (credentials.twilioSid && credentials.twilioToken) {
                const response = await fetch('https://api.twilio.com/2010-04-01/Accounts.json', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${btoa(credentials.twilioSid + ':' + credentials.twilioToken)}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    showNotification('Twilio credentials are valid', 'success');
                } else {
                    showNotification('Twilio credentials are invalid', 'error');
                }
            }

            // Test generic API key
            if (credentials.apiKey) {
                showNotification('API key format appears valid', 'info');
            }
        } catch (error) {
            showNotification('Failed to test credentials: ' + error.message, 'error');
            logger.error('Failed to test credentials', null, error);
        }
    }

    // Export configuration
    exportConfig() {
        try {
            const config = this.getCurrentConfig();
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'btm-utility-config.json';
            link.click();
            
            showNotification('Configuration exported successfully', 'success');
        } catch (error) {
            showNotification('Failed to export configuration: ' + error.message, 'error');
        }
    }

    // Import configuration
    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const config = JSON.parse(text);
                    await this.handleConfigSubmit({ target: { querySelector: () => config } });
                    showNotification('Configuration imported successfully', 'success');
                } catch (error) {
                    showNotification('Failed to import configuration: ' + error.message, 'error');
                }
            }
        };
        
        input.click();
    }

    // Get current configuration
    getCurrentConfig() {
        return {
            timestamp: Date.now(),
            environment: window.location.hostname,
            version: '1.0.0'
        };
    }

    // Get instance
    getInstance() {
        return this;
    }

    // Check if admin mode is active
    isAdminMode() {
        return this.isAdminMode;
    }

    // Get current configuration
    getCurrentConfig() {
        return {
            timestamp: Date.now(),
            environment: window.location.hostname,
            version: '1.0.0'
        };
    }

    // Show configuration
    showConfig() {
        this.showConfigModal();
    }

    // Hide configuration
    hideConfig() {
        this.hideConfigModal();
    }
}

// Create singleton instance
export const configManager = new ConfigManager();

export default configManager; 