/**
 * Main Application Module
 * BTM Utility application initialization and lifecycle management
 */

import { config, validateConfig } from './config.js?v=1.0.2';
import { storageUtils } from './storage.js?v=1.0.2';
import { generateId, formatDate, isMobile, supportsFeature, playSuccessBeep, playNotificationBeep } from './utils.js?v=1.0.2';
import { logger } from './logger.js?v=1.0.2';
import { errorHandler } from './error-handler.js?v=1.0.2';
import { secureStorageUtils } from './secure-storage.js?v=1.0.2';
import { configManager } from './config-manager.js?v=1.0.2';
import { environmentManager } from './environment-manager.js?v=1.0.2';
import { apiKeyManager } from './api-key-manager.js?v=1.0.2';
import { qrScanner } from './qr-scanner.js?v=1.0.3';
import todoManager from './todo-manager.js?v=1.0.3';
import emergencyContacts from './emergency-contacts.js?v=1.0.2';
import { SecurityCameras } from './security-cameras.js?v=1.0.9';
import { ClimateControl } from './climate-control-fixed.js?v=1.0.1';
import { locationManager } from './location-config.js?v=1.0.1';
console.log('BTM Utility: Location manager imported:', !!locationManager);

// Import the robust QR scanner for integrated scanning
import { RobustQRScanner } from './robust-qr-scanner.js?v=1.0.1';

// Application state management
class AppState {
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
            version: config.app.version,
        };
        this.listeners = new Map();
    }

    // Get state
    get(key = null) {
        if (key === null) return { ...this.state };
        return this.state[key];
    }

    // Set state
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notifyListeners(key, value, oldValue);
    }

    // Update state
    update(updates) {
        Object.keys(updates).forEach(key => {
            this.set(key, updates[key]);
        });
    }

    // Subscribe to state changes
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

    // Notify listeners
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

// Application class
class BTMUtility {
    constructor() {
        this.state = new AppState();
        this.modules = new Map();
        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    // Initialize application
    async init() {
        try {
            console.log('BTM Utility: Starting initialization...');
            logger.info('Initializing BTM Utility...');
            
            // Validate configuration
            console.log('BTM Utility: Validating configuration...');
            if (!validateConfig()) {
                throw new Error('Invalid configuration');
            }

            // Show loading screen
            console.log('BTM Utility: Showing loading screen...');
            this.showLoadingScreen();

            // Initialize core modules
            console.log('BTM Utility: Initializing modules...');
            await this.initializeModules();

            // Load settings
            console.log('BTM Utility: Loading settings...');
            await this.loadSettings();

            // Set up event listeners
            console.log('BTM Utility: Setting up event listeners...');
            this.setupEventListeners();
            this.setupNavigationListeners();
            
            // Initialize notification system
            console.log('BTM Utility: Initializing notification system...');
            await this.initializeNotifications();

            // Check online status
            console.log('BTM Utility: Checking online status...');
            this.updateOnlineStatus();

            // Hide loading screen and show main app
            console.log('BTM Utility: Hiding loading screen and showing main app...');
            this.hideLoadingScreen();
            this.showMainApp();

            // Mark as initialized
            this.state.set('isInitialized', true);
            this.isInitialized = true;

            console.log('BTM Utility: Initialization complete!');
            logger.info('BTM Utility initialized successfully');
            playSuccessBeep();
            
            // Trigger initialization event
            this.triggerEvent('app:initialized');

        } catch (error) {
            console.error('BTM Utility: Initialization failed!', error);
            logger.error('Failed to initialize BTM Utility', null, error);
            this.handleError(error);
        }
    }

    // Initialize core modules
    async initializeModules() {
        try {
            logger.info('Initializing application modules...');
            
            // Initialize core modules
            await storageUtils.init();
            await errorHandler.init();
            await logger.init();
            
            // Initialize feature modules
            await environmentManager.init();
            await apiKeyManager.init();
            await configManager.init();
            await qrScanner.init();
            await todoManager.init();
            await emergencyContacts.init();
            
            // Initialize security cameras module
            this.securityCameras = new SecurityCameras();
            await this.securityCameras.init();
            
            // Initialize climate control module
            this.climateControl = new ClimateControl();
            await this.climateControl.init();
            
            // Initialize robust QR scanner for integrated scanning
            this.robustQRScanner = new RobustQRScanner();
            // RobustQRScanner initializes automatically in constructor
            
            // Add test function to window for debugging
            window.testApp = () => {
                console.log('Testing BTM Utility app...');
                console.log('Security cameras module:', this.securityCameras);
                if (this.securityCameras) {
                    console.log('Security cameras module loaded successfully');
                    window.testSecurityCameras();
                } else {
                    console.error('Security cameras module not loaded');
                }
            };

            // Add location manager test function
            window.testLocationManager = async () => {
                console.log('Testing location manager...');
                try {
                    const { locationManager } = await import('./location-config.js?v=1.0.1');
                    console.log('Location manager imported successfully');
                    
                    const locations = locationManager.getLocations();
                    console.log('Available locations:', locations);
                    
                    const locationSelect = document.getElementById('location-select');
                    if (locationSelect) {
                        console.log('Location select found, current options:', Array.from(locationSelect.options).map(opt => opt.textContent));
                    } else {
                        console.error('Location select not found');
                    }
                } catch (error) {
                    console.error('Error testing location manager:', error);
                }
            };

            // Add dropdown test function
            window.testDropdowns = () => {
                console.log('Testing dropdowns...');
                const locationSelect = document.getElementById('location-select');
                const machineSelect = document.getElementById('machine-select');
                
                console.log('Location select:', locationSelect);
                console.log('Machine select:', machineSelect);
                
                if (locationSelect) {
                    console.log('Location options:', locationSelect.options.length);
                    for (let i = 0; i < locationSelect.options.length; i++) {
                        console.log(`  Option ${i}:`, locationSelect.options[i].value, '=', locationSelect.options[i].textContent);
                    }
                }
                
                if (machineSelect) {
                    console.log('Machine options:', machineSelect.options.length);
                    for (let i = 0; i < machineSelect.options.length; i++) {
                        console.log(`  Option ${i}:`, machineSelect.options[i].value, '=', machineSelect.options[i].textContent);
                    }
                }
            };

            // Add manual initialization test function
            window.initDropdowns = () => {
                console.log('Manually initializing dropdowns...');
                if (app && typeof app.initializeLocationDropdowns === 'function') {
                    app.initializeLocationDropdowns();
                    console.log('Dropdown initialization called');
                } else {
                    console.error('App or initializeLocationDropdowns not available');
                }
            };
            
            logger.info('All modules initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'app-module-init'
            });
        }
    }

    // Load module dynamically
    async loadModule(path) {
        try {
            const module = await import(path);
            return module.default || module;
        } catch (error) {
            console.error(`Failed to load module from ${path}:`, error);
            return null;
        }
    }

    // Load application settings
    async loadSettings() {
        try {
            // Use default settings for now
            const defaultSettings = {
                theme: 'default',
                language: 'en',
                notifications: true,
                autoSync: true,
                offlineMode: true,
                debugMode: false,
            };
            
            this.state.set('settings', defaultSettings);
            this.applySettings(defaultSettings);
            
            logger.info('Default settings applied successfully');
        } catch (error) {
            logger.warn('Failed to load settings, using defaults', null, error);
            
            // Use default settings
            const defaultSettings = {
                theme: 'default',
                language: 'en',
                notifications: true,
                autoSync: true,
                offlineMode: true,
                debugMode: false,
            };
            
            this.state.set('settings', defaultSettings);
            this.applySettings(defaultSettings);
        }
    }

    // Apply settings
    applySettings(settings) {
        // Apply theme
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }

        // Apply language
        if (settings.language) {
            document.documentElement.lang = settings.language;
        }

        // Apply debug mode
        if (settings.debugMode) {
            window.debugMode = true;
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.triggerEvent('app:background');
            } else {
                this.triggerEvent('app:foreground');
            }
        });

        // Before unload
        window.addEventListener('beforeunload', (event) => {
            this.triggerEvent('app:beforeunload');
        });

        // Error handling
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });

        // Navigation
        this.setupNavigationListeners();
        
        // Form interactions
        this.setupFormListeners();
    }

    // Set up navigation listeners
    setupNavigationListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
                
                // Close mobile menu after navigation
                this.hideMobileMenu();
            });
        });
    }

    // Set up form listeners
    setupFormListeners() {
        // Initialize location dropdowns
        this.initializeLocationDropdowns();

        // Money collection form
        const submitCollectionBtn = document.getElementById('submit-collection');
        if (submitCollectionBtn) {
            submitCollectionBtn.addEventListener('click', () => {
                this.handleCollectionSubmit();
            });
        }

        // Add task button
        const addTaskBtn = document.getElementById('add-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.handleAddTask();
            });
        }

        // Search contacts button
        const searchContactsBtn = document.getElementById('search-contacts');
        if (searchContactsBtn) {
            searchContactsBtn.addEventListener('click', () => {
                this.handleSearchContacts();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-button');
        console.log('Settings button element:', settingsBtn);
        console.log('Settings button HTML:', settingsBtn ? settingsBtn.outerHTML : 'NOT FOUND');
        if (settingsBtn) {
            console.log('Adding click listener to settings button');
            settingsBtn.addEventListener('click', (e) => {
                console.log('Settings button clicked!', e.target);
                e.preventDefault();
                e.stopPropagation();
                this.showSettings();
            });
        } else {
            console.error('Settings button not found!');
        }

        // Close settings button
        const closeSettingsBtn = document.getElementById('close-settings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettings();
            });
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Home button functionality
        const homeButton = document.getElementById('home-button');
        if (homeButton) {
            homeButton.addEventListener('click', () => this.goHome());
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mainNav && mainNav.classList.contains('show') && 
                !mainNav.contains(e.target) && 
                !mobileMenuToggle.contains(e.target)) {
                this.hideMobileMenu();
            }
        });

        // QR Scanner functionality
        this.setupQRScannerListeners();

        // Counter value input validation
        this.setupCounterInputValidation();

        // Numeric keypad functionality
        this.setupNumericKeypad();
    }

    // Set up QR scanner listeners
    setupQRScannerListeners() {
        // QR Code scan button
        const scanQRBtn = document.getElementById('scan-qr');
        if (scanQRBtn) {
            scanQRBtn.addEventListener('click', () => {
                this.showQRScannerModal();
            });
        }

        // QR Modal close button
        const closeQRBtn = document.getElementById('close-qr');
        if (closeQRBtn) {
            closeQRBtn.addEventListener('click', () => {
                this.hideQRScannerModal();
            });
        }

        // Manual entry button
        const manualEntryBtn = document.getElementById('manual-entry');
        if (manualEntryBtn) {
            manualEntryBtn.addEventListener('click', () => {
                this.hideQRScannerModal();
                // Focus on location dropdown for manual entry
                const locationSelect = document.getElementById('location-select');
                if (locationSelect) {
                    locationSelect.focus();
                }
            });
        }

        // Camera switch button (placeholder for future implementation)
        const switchCameraBtn = document.getElementById('switch-camera');
        if (switchCameraBtn) {
            switchCameraBtn.addEventListener('click', () => {
                logger.info('Camera switch requested (not yet implemented)');
            });
        }
    }

    // Set up counter input validation
    setupCounterInputValidation() {
        const counterInput = document.getElementById('counter-value');
        if (counterInput) {
            // Prevent non-numeric characters from being typed
            counterInput.addEventListener('input', (e) => {
                // Remove any non-digit characters
                let value = e.target.value.replace(/[^0-9]/g, '');
                
                // Limit to 6 characters
                if (value.length > 6) {
                    value = value.substring(0, 6);
                }
                
                // Update the input value
                e.target.value = value;
                
                logger.info(`Counter value updated: ${value}`);
            });

            // Prevent paste of non-numeric content
            counterInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const numericOnly = paste.replace(/[^0-9]/g, '').substring(0, 6);
                counterInput.value = numericOnly;
                
                logger.info(`Counter value pasted and cleaned: ${numericOnly}`);
            });

            // Prevent non-numeric keys from being typed
            counterInput.addEventListener('keypress', (e) => {
                // Allow backspace, delete, arrow keys, etc.
                if (e.ctrlKey || e.altKey || e.metaKey) {
                    return;
                }
                
                // Allow only digit keys (0-9)
                if (!/[0-9]/.test(e.key) && 
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                }
            });

            logger.info('Counter input validation setup complete');
        } else {
            logger.warn('Counter input element not found');
        }
    }

    // Set up numeric keypad functionality
    setupNumericKeypad() {
        // Prevent infinite retry loops
        if (this._keypadSetupAttempts && this._keypadSetupAttempts > 5) {
            logger.error('Keypad setup failed after 5 attempts - stopping retries');
            return;
        }
        
        this._keypadSetupAttempts = (this._keypadSetupAttempts || 0) + 1;
        
        // Wait for DOM to be fully ready
        if (document.readyState !== 'complete') {
            logger.info('DOM not ready yet, waiting for load event');
            window.addEventListener('load', () => this.setupNumericKeypad());
            return;
        }

        const counterInput = document.getElementById('counter-value');
        const keypadModal = document.getElementById('numeric-keypad-modal');
        const keypadDisplay = document.getElementById('keypad-display');
        const closeKeypadBtn = document.getElementById('close-keypad');
        const keypadDoneBtn = document.getElementById('keypad-done');
        const keypadCancelBtn = document.getElementById('keypad-cancel');
        const keypadClearBtn = document.getElementById('keypad-clear');
        const keypadBackspaceBtn = document.getElementById('keypad-backspace');

        // Enhanced debugging
        logger.info(`DOM ready state: ${document.readyState}`);
        logger.info(`Total elements in document: ${document.querySelectorAll('*').length}`);
        logger.info(`Looking for keypad modal...`);
        const allModals = document.querySelectorAll('.modal');
        logger.info(`Found ${allModals.length} modal elements total`);
        allModals.forEach((modal, index) => {
            logger.info(`Modal ${index}: id="${modal.id}", classes="${modal.className}"`);
        });
        
        // Check for duplicate IDs
        const allElementsWithId = document.querySelectorAll('[id]');
        const idCounts = {};
        allElementsWithId.forEach(el => {
            idCounts[el.id] = (idCounts[el.id] || 0) + 1;
        });
        
        const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
        if (duplicateIds.length > 0) {
            logger.error('Duplicate IDs found:', duplicateIds);
        }
        
        // Check for any elements with "keypad" in their ID or class
        const keypadElements = document.querySelectorAll('[id*="keypad"], [class*="keypad"]');
        logger.info(`Found ${keypadElements.length} elements with "keypad" in ID or class:`);
        keypadElements.forEach((el, index) => {
            logger.info(`Keypad element ${index}: id="${el.id}", classes="${el.className}"`);
        });
        
        // Check if the keypad modal exists but with a different ID
        const allDivs = document.querySelectorAll('div');
        const modalDivs = Array.from(allDivs).filter(div => 
            div.className.includes('modal') || 
            div.id.includes('keypad') || 
            div.className.includes('keypad')
        );
        logger.info(`Found ${modalDivs.length} divs that might be the keypad modal:`);
        modalDivs.forEach((div, index) => {
            logger.info(`Modal div ${index}: id="${div.id}", classes="${div.className}"`);
        });
        
        logger.info(`Keypad elements check: counter=${!!counterInput}, modal=${!!keypadModal}, display=${!!keypadDisplay}`);
        
        if (!counterInput || !keypadModal || !keypadDisplay) {
            logger.warn(`Keypad elements not found - retry attempt ${this._keypadSetupAttempts}/5`);
            
            // Try to manually create the keypad modal if it doesn't exist
            if (!keypadModal && this._keypadSetupAttempts >= 3) {
                logger.info('Attempting to manually create keypad modal...');
                this.createKeypadModal();
            }
            
            setTimeout(() => this.setupNumericKeypad(), 1000);
            return;
        }

        logger.info('✅ All keypad elements found, setting up functionality');

        // Show keypad when counter input is focused
        counterInput.addEventListener('focus', (e) => {
            e.preventDefault();
            counterInput.blur(); // Remove focus from input
            keypadDisplay.value = counterInput.value || '';
            keypadModal.classList.add('show');
            logger.info('Numeric keypad opened');
        });

        // Also show keypad on click for better mobile experience
        counterInput.addEventListener('click', (e) => {
            e.preventDefault();
            counterInput.blur(); // Remove focus from input
            keypadDisplay.value = counterInput.value || '';
            keypadModal.classList.add('show');
            logger.info('Numeric keypad opened via click');
        });

        // Close keypad handlers
        const closeKeypad = () => {
            keypadModal.classList.remove('show');
            logger.info('Numeric keypad closed');
        };

        if (closeKeypadBtn) closeKeypadBtn.addEventListener('click', closeKeypad);
        if (keypadCancelBtn) keypadCancelBtn.addEventListener('click', closeKeypad);

        // Done button - save value and close
        if (keypadDoneBtn) {
            keypadDoneBtn.addEventListener('click', () => {
                const newValue = keypadDisplay.value;
                counterInput.value = newValue;
                // Trigger input event to ensure validation runs
                counterInput.dispatchEvent(new Event('input', { bubbles: true }));
                logger.info(`Counter value set to: ${newValue}`);
                closeKeypad();
            });
        }

        // Number button handlers
        const numberBtns = document.querySelectorAll('.number-btn');
        logger.info(`Found ${numberBtns.length} number buttons`);
        numberBtns.forEach((btn, index) => {
            logger.info(`Setting up number button ${index}: ${btn.dataset.number}`);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const number = btn.dataset.number;
                if (keypadDisplay.value.length < 6) {
                    keypadDisplay.value += number;
                    logger.info(`Keypad input: ${keypadDisplay.value}`);
                }
            });
            
            // Also add touchstart for better mobile support
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const number = btn.dataset.number;
                if (keypadDisplay.value.length < 6) {
                    keypadDisplay.value += number;
                    logger.info(`Keypad touch input: ${keypadDisplay.value}`);
                }
            });
        });

        // Clear button
        if (keypadClearBtn) {
            keypadClearBtn.addEventListener('click', () => {
                keypadDisplay.value = '';
                logger.info('Keypad cleared');
            });
        }

        // Backspace button
        if (keypadBackspaceBtn) {
            keypadBackspaceBtn.addEventListener('click', () => {
                keypadDisplay.value = keypadDisplay.value.slice(0, -1);
                logger.info(`Keypad backspace: ${keypadDisplay.value}`);
            });
        }

        // Close keypad when clicking outside
        keypadModal.addEventListener('click', (e) => {
            if (e.target === keypadModal) {
                closeKeypad();
            }
        });

        logger.info('Numeric keypad setup complete');
    }

    // Manually create the keypad modal if it doesn't exist
    createKeypadModal() {
        logger.info('Creating keypad modal manually...');
        
        const modalHTML = `
            <div id="numeric-keypad-modal" class="modal">
                <div class="modal-content keypad-content">
                    <div class="modal-header">
                        <h2>Enter Counter Value</h2>
                        <button id="close-keypad" class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="keypad-display">
                            <label for="keypad-display" class="sr-only">Counter Value Display</label>
                            <input type="text" id="keypad-display" class="keypad-input" readonly maxlength="6" aria-label="Counter Value Display">
                        </div>
                        <div class="numeric-keypad">
                            <button class="keypad-btn number-btn" data-number="1">1</button>
                            <button class="keypad-btn number-btn" data-number="2">2</button>
                            <button class="keypad-btn number-btn" data-number="3">3</button>
                            <button class="keypad-btn number-btn" data-number="4">4</button>
                            <button class="keypad-btn number-btn" data-number="5">5</button>
                            <button class="keypad-btn number-btn" data-number="6">6</button>
                            <button class="keypad-btn number-btn" data-number="7">7</button>
                            <button class="keypad-btn number-btn" data-number="8">8</button>
                            <button class="keypad-btn number-btn" data-number="9">9</button>
                            <button class="keypad-btn action-btn" id="keypad-clear">Clear</button>
                            <button class="keypad-btn number-btn" data-number="0">0</button>
                            <button class="keypad-btn action-btn" id="keypad-backspace">⌫</button>
                        </div>
                        <div class="keypad-actions">
                            <button id="keypad-cancel" class="secondary-button">Cancel</button>
                            <button id="keypad-done" class="primary-button">Done</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the modal into the DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        logger.info('Keypad modal created and inserted into DOM');
    }

    // Show QR scanner modal
    async showQRScannerModal() {
        try {
            logger.info('Opening QR scanner modal');
            
            const qrModal = document.getElementById('qr-modal');
            if (!qrModal) {
                logger.error('QR modal not found');
                return;
            }

            // Show the modal
            qrModal.classList.add('show');

            // Initialize camera and start scanning
            await this.startQRScanning();

        } catch (error) {
            logger.error('Error opening QR scanner modal', null, error);
            this.handleError(error);
        }
    }

    // Hide QR scanner modal
    hideQRScannerModal() {
        try {
            logger.info('Closing QR scanner modal');
            
            const qrModal = document.getElementById('qr-modal');
            if (qrModal) {
                qrModal.classList.remove('show');
            }

            // Stop scanning
            this.stopQRScanning();

        } catch (error) {
            logger.error('Error closing QR scanner modal', null, error);
        }
    }

    // Start QR scanning
    async startQRScanning() {
        try {
            if (!this.robustQRScanner) {
                throw new Error('QR scanner not initialized');
            }

            const video = document.getElementById('qr-video');
            if (!video) {
                throw new Error('QR video element not found');
            }

            logger.info('Starting QR camera stream');

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = stream;
            this.currentStream = stream;
            await video.play();

            // Start scanning with the robust scanner
            this.isScanning = true;
            this.scanQRLoop();

            logger.info('QR scanning started successfully');

        } catch (error) {
            logger.error('Error starting QR scanning', null, error);
            
            // Show user-friendly error message
            if (error.name === 'NotAllowedError') {
                alert('Camera permission denied. Please allow camera access and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('No camera found. Please connect a camera and try again.');
            } else {
                alert('Error accessing camera: ' + error.message);
            }
        }
    }

    // Stop QR scanning
    stopQRScanning() {
        try {
            this.isScanning = false;

            // Stop video stream
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            // Clear video source
            const video = document.getElementById('qr-video');
            if (video) {
                video.srcObject = null;
            }

            logger.info('QR scanning stopped');

        } catch (error) {
            logger.error('Error stopping QR scanning', null, error);
        }
    }

    // QR scanning loop
    async scanQRLoop() {
        if (!this.isScanning) return;

        try {
            const video = document.getElementById('qr-video');
            if (!video || !this.robustQRScanner) {
                return;
            }

            // Create canvas and get image data
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            if (canvas.width > 0 && canvas.height > 0) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                // Scan for QR code
                const result = await this.robustQRScanner.scanQRCode(imageData);
                
                if (result && result.data) {
                    this.handleQRScanResult(result);
                    return; // Stop scanning on successful scan
                }
            }

            // Continue scanning
            setTimeout(() => this.scanQRLoop(), 100);

        } catch (error) {
            logger.error('Error in QR scan loop', null, error);
            
            // Continue scanning even if there's an error
            setTimeout(() => this.scanQRLoop(), 500);
        }
    }

    // Handle QR scan result
    handleQRScanResult(result) {
        try {
            logger.info('QR code scanned successfully', result);

            // Stop scanning
            this.stopQRScanning();
            this.hideQRScannerModal();

            // Parse the QR data
            const qrData = result.data;
            
            // Populate the form with scanned data
            this.populateFormFromQRData(qrData);

                    // Show success notification
        playSuccessBeep();
        
        // Use alert for now since notification system method is not available
        alert(`✅ QR Code scanned successfully!\n\nLocation: ${qrData.location}\nMachine: ${qrData.machine}\n\nForm has been populated. Please enter the counter value.`);

        } catch (error) {
            logger.error('Error handling QR scan result', null, error);
            alert('Error processing QR code data: ' + error.message);
        }
    }

    // Populate form from QR data
    populateFormFromQRData(qrData) {
        try {
            logger.info('Populating form with QR data', qrData);

            const locationSelect = document.getElementById('location-select');
            const machineSelect = document.getElementById('machine-select');

            if (!locationSelect || !machineSelect) {
                logger.error('Form elements not found');
                return;
            }

            // Populate location dropdown
            if (qrData.location) {
                // Convert location to lowercase to match option values
                const locationValue = qrData.location.toLowerCase();
                locationSelect.value = locationValue;
                
                // Trigger change event to populate machine dropdown
                locationSelect.dispatchEvent(new Event('change'));
                
                logger.info(`Location set to: ${locationValue}`);
            }

            // Populate machine dropdown (after a longer delay to ensure dropdown is populated)
            setTimeout(() => {
                if (qrData.machine && locationManager) {
                    const locationValue = qrData.location.toLowerCase();
                    
                    // Debug: Check current machine dropdown options
                    const currentOptions = Array.from(machineSelect.options);
                    logger.info(`Machine dropdown has ${currentOptions.length} options:`, 
                        currentOptions.map(opt => `${opt.value} = ${opt.textContent}`));
                    
                    // Extract changer number from machine string (e.g., "CH2" -> "2")
                    const changerMatch = qrData.machine.match(/CH(\d+)/);
                    if (changerMatch) {
                        const changerNumber = parseInt(changerMatch[1]);
                        logger.info(`Looking for changer ${changerNumber} at ${locationValue}`);
                        
                        // Find matching machine option in dropdown
                        const matchingOptions = currentOptions.filter(option => {
                            if (!option.value) return false; // Skip empty option
                            
                            // Check if option contains the changer number
                            const optionText = option.textContent.toLowerCase();
                            const optionValue = option.value.toLowerCase();
                            
                            return optionText.includes(`changer ${changerNumber}`) || 
                                   optionValue.includes(`ch${changerNumber}`);
                        });
                        
                        if (matchingOptions.length > 0) {
                            // Select the first matching option (first hopper for this changer)
                            const selectedOption = matchingOptions[0];
                            machineSelect.value = selectedOption.value;
                            
                            logger.info(`Machine dropdown set to: ${selectedOption.value} (${selectedOption.textContent})`);
                            
                            // Show all available options for this changer
                            if (matchingOptions.length > 1) {
                                logger.info(`Available hoppers for ${qrData.machine}:`, 
                                    matchingOptions.map(opt => `${opt.textContent} (${opt.value})`));
                            }
                        } else {
                            logger.warn(`No machine options found for changer ${changerNumber}. Available options:`,
                                currentOptions.map(opt => opt.textContent));
                        }
                    } else {
                        logger.warn(`Could not parse changer number from: ${qrData.machine}`);
                    }
                } else {
                    logger.warn('QR machine data or locationManager not available');
                }

                // Focus on counter input for manual entry
                const counterInput = document.getElementById('counter-value');
                if (counterInput) {
                    counterInput.focus();
                }
            }, 300); // Increased delay to 300ms

        } catch (error) {
            logger.error('Error populating form from QR data', null, error);
        }
    }

    // Update online status
    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        this.state.set('isOnline', isOnline);
        
        // Show/hide offline indicator
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            if (isOnline) {
                offlineIndicator.classList.remove('show');
            } else {
                offlineIndicator.classList.add('show');
            }
        }

        // Trigger event
        this.triggerEvent('app:onlineStatusChanged', { isOnline });
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500); // Small delay for smooth transition
        }
    }

    // Show main application
    showMainApp() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.classList.remove('hidden');
        }
    }

    // Initialize location dropdowns
    initializeLocationDropdowns() {
        console.log('BTM Utility: Initializing location dropdowns...');
        console.log('BTM Utility: Location manager available:', !!locationManager);
        try {
            // Check if locationManager is available
            if (!locationManager) {
                console.error('Location manager not available');
                return;
            }

            const locationSelect = document.getElementById('location-select');
            const machineSelect = document.getElementById('machine-select');

            console.log('Location select element:', locationSelect);
            console.log('Machine select element:', machineSelect);

            if (locationSelect) {
                // The location dropdown already has options in HTML, so we just need to add the change listener
                locationSelect.addEventListener('change', (e) => {
                    const selectedLocation = e.target.value;
                    console.log('Location changed to:', selectedLocation);
                    
                    if (selectedLocation && machineSelect) {
                        try {
                            locationManager.populateMachineDropdown(machineSelect, selectedLocation);
                            logger.info(`Machine dropdown populated for location: ${selectedLocation}`);
                        } catch (error) {
                            console.error('Error populating machine dropdown:', error);
                        }
                    } else if (machineSelect) {
                        // Clear machine dropdown if no location selected
                        machineSelect.innerHTML = '<option value="">Select Machine</option>';
                        logger.info('Machine dropdown cleared');
                    }
                });

                logger.info('Location dropdowns initialized successfully');
                console.log('Location dropdown initialization complete');
            } else {
                logger.warn('Location select element not found');
                console.error('Location select element not found');
            }
        } catch (error) {
            logger.error('Error initializing location dropdowns', null, error);
            console.error('Error initializing location dropdowns:', error);
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'location-dropdown-init'
            });
        }
    }

    // Handle collection submit
    handleCollectionSubmit() {
        const locationSelect = document.getElementById('location-select');
        const machineSelect = document.getElementById('machine-select');
        const counterValue = document.getElementById('counter-value');
        const notes = document.getElementById('collection-notes');
        const coinsToOffice = document.getElementById('coins-to-office');

        if (!locationSelect.value || !machineSelect.value || !counterValue.value) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate location and machine combination
        const locationId = locationSelect.value;
        const machineId = machineSelect.value;
        
        // Debug: Log the values being validated
        logger.info(`Validating combination: Location='${locationId}', Machine='${machineId}'`);
        
        if (!locationManager.validateLocationMachine(locationId, machineId)) {
            // Debug: Log available machines for this location
            const availableMachines = locationManager.getMachines(locationId);
            logger.error(`Validation failed. Available machines for ${locationId}:`, 
                availableMachines.map(m => m.id));
            alert('Invalid location and machine combination. Please select a valid machine for the chosen location.');
            return;
        }

        // Get location and machine details
        const location = locationManager.getLocation(locationId);
        const machine = locationManager.getMachineById(machineId);

        const collection = {
            location: locationId,
            locationName: location ? location.name : locationId,
            machine: machineId,
            machineName: machine ? machine.name : machineId,
            counterValue: parseInt(counterValue.value),
            notes: notes.value,
            coinsToOffice: coinsToOffice.checked,
            timestamp: new Date().toISOString()
        };

        logger.info('Collection submitted', collection);
        alert('Collection submitted successfully!');
        
        // Clear form
        locationSelect.value = '';
        machineSelect.value = '';
        counterValue.value = '';
        notes.value = '';
        coinsToOffice.checked = false;
    }

    // Handle add task
    handleAddTask() {
        // Use the todo manager to show the add task modal
        if (todoManager && typeof todoManager.showAddTaskModal === 'function') {
            todoManager.showAddTaskModal();
        } else {
            // Fallback to simple prompt
            const taskText = prompt('Enter task description:');
            if (taskText) {
                const task = {
                    id: generateId('task'),
                    text: taskText,
                    completed: false,
                    timestamp: new Date().toISOString()
                };
                
                logger.info('Task added', task);
                alert('Task added successfully!');
            }
        }
    }

    handleSearchContacts() {
        // Use the emergency contacts module to handle search
        if (emergencyContacts && typeof emergencyContacts.showSearchModal === 'function') {
            emergencyContacts.showSearchModal();
        } else {
            // Fallback to simple alert
            alert('Contact search feature is being initialized. Please try again in a moment.');
        }
    }

    // Show settings
    showSettings() {
        console.log('showSettings() called');
        const settingsModal = document.getElementById('settings-modal');
        console.log('Settings modal element:', settingsModal);
        if (settingsModal) {
            console.log('Showing settings modal');
            console.log('Modal classes before:', settingsModal.className);
            settingsModal.classList.add('show');
            console.log('Modal classes after showing:', settingsModal.className);
            console.log('Modal computed style display:', window.getComputedStyle(settingsModal).display);
            console.log('Modal computed style visibility:', window.getComputedStyle(settingsModal).visibility);
            console.log('Modal computed style opacity:', window.getComputedStyle(settingsModal).opacity);
        } else {
            console.error('Settings modal element not found!');
        }
    }

    // Hide settings
    hideSettings() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.classList.remove('show');
        }
    }

    // Mobile menu functionality
    toggleMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        
        console.log('Toggle mobile menu called');
        console.log('Elements found:', { mainNav: !!mainNav, mobileMenuToggle: !!mobileMenuToggle });
        
        if (mainNav && mobileMenuToggle) {
            const isOpen = mainNav.classList.contains('show');
            console.log('Menu is open:', isOpen);
            if (isOpen) {
                this.hideMobileMenu();
            } else {
                this.showMobileMenu();
            }
        } else {
            console.error('Mobile menu elements not found');
        }
    }

    showMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        
        if (mainNav && mobileMenuToggle) {
            console.log('Showing mobile menu...');
            mainNav.classList.add('show');
            mobileMenuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Mobile menu classes:', mainNav.classList.toString());
        } else {
            console.error('Mobile menu elements not found:', { mainNav, mobileMenuToggle });
        }
    }

    hideMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        
        if (mainNav && mobileMenuToggle) {
            mainNav.classList.remove('show');
            mobileMenuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Go home functionality
    goHome() {
        try {
            console.log('BTM Utility: Going home...');
            
            // Navigate to money collection section (main page)
            this.navigateToSection('money-collection');
            
            // Close mobile menu if open
            this.hideMobileMenu();
            
            // Show success notification
            if (this.notificationSystem) {
                this.notificationSystem.showNotification('Returned to home page', 'success');
            }
            
            // Log the action
            logger.info('User returned to home page');
            
        } catch (error) {
            console.error('Failed to go home:', error);
            logger.error('Failed to go home', null, error);
        }
    }

    // Initialize notification system
    async initializeNotifications() {
        try {
            // Import and initialize notification system
            const { NotificationSystem } = await import('./notifications.js');
            this.notificationSystem = new NotificationSystem();
            await this.notificationSystem.init();
            
            // Set up notification bell event listener
            const notificationBell = document.getElementById('notification-bell');
            if (notificationBell) {
                notificationBell.addEventListener('click', () => {
                    if (this.notificationSystem) {
                        this.notificationSystem.toggleNotificationCenter();
                    }
                });
            }
            
            logger.info('Notification system initialized successfully');
        } catch (error) {
            logger.warn('Notification system not available', null, error);
        }
    }

    // Navigate to section
    navigateToSection(sectionName) {
        try {
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Show target section - look for both formats
            let targetSection = document.getElementById(sectionName);
            if (!targetSection) {
                targetSection = document.getElementById(`${sectionName}-section`);
            }
            
            if (targetSection) {
                targetSection.classList.add('active');
            } else {
                logger.warn(`Section not found: ${sectionName}`);
            }

            // Update navigation
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.classList.remove('active');
            });

            const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
            }

            // Update state
            this.state.set('currentSection', sectionName);

            // Trigger event
            this.triggerEvent('app:navigationChanged', { section: sectionName });

        } catch (error) {
            logger.error('Navigation error', null, error);
        }
    }

    // Get module
    getModule(name) {
        return this.modules.get(name);
    }

    getSecurityCameras() {
        return this.securityCameras;
    }

    getClimateControl() {
        return this.climateControl;
    }

    // Register event listener
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.eventListeners.get(event);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    // Trigger event
    triggerEvent(event, data = null) {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
    }

    // Handle errors
    handleError(error) {
        logger.error('Application error', null, error);
        
        this.state.set('error', {
            message: error.message || 'An unknown error occurred',
            timestamp: Date.now(),
            stack: error.stack,
        });

        // Use error handler for user-friendly error display
        errorHandler.handleError(error, {
            type: 'client',
            severity: 'medium',
            context: 'application',
        });

        // Trigger error event
        this.triggerEvent('app:error', error);
    }

    // Get application info
    getInfo() {
        return {
            name: config.app.name,
            version: config.app.version,
            environment: config.app.environment,
            isInitialized: this.isInitialized,
            isOnline: this.state.get('isOnline'),
            currentSection: this.state.get('currentSection'),
            settings: this.state.get('settings'),
            lastSync: this.state.get('lastSync'),
            modules: Array.from(this.modules.keys()),
            storageUsage: storageUtils.usage(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            features: {
                localStorage: supportsFeature('localStorage'),
                serviceWorker: supportsFeature('serviceWorker'),
                pushNotifications: supportsFeature('pushNotifications'),
                camera: supportsFeature('camera'),
                webGL: supportsFeature('webGL'),
            },
        };
    }

    // Cleanup application
    cleanup() {
        try {
            // Trigger cleanup event
            this.triggerEvent('app:cleanup');

            // Cleanup modules
            this.modules.forEach(module => {
                if (module && typeof module.cleanup === 'function') {
                    module.cleanup();
                }
            });

            // Clear event listeners
            this.eventListeners.clear();

            logger.info('BTM Utility cleanup completed');
        } catch (error) {
            logger.error('Cleanup error', null, error);
        }
    }
}

// Create global application instance
const app = new BTMUtility();

// Make app available globally for debugging
window.app = app;

// Export application instance and utilities
export { app, AppState };

console.log('BTM Utility: App instance created, checking document ready state...');
console.log('Document ready state:', document.readyState);

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    console.log('BTM Utility: Document still loading, adding DOMContentLoaded listener...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('BTM Utility: DOMContentLoaded fired, initializing app...');
        app.init();
    });
} else {
    console.log('BTM Utility: Document already loaded, initializing app immediately...');
    app.init();
}

// Export default application
export default app;

// Global test functions for debugging
window.testLocationManager = async () => {
    console.log('Testing location manager...');
    try {
        const { locationManager } = await import('./location-config.js?v=1.0.1');
        console.log('Location manager imported successfully');
        
        const locations = locationManager.getLocations();
        console.log('Available locations:', locations);
        
        const locationSelect = document.getElementById('location-select');
        if (locationSelect) {
            console.log('Location select found, current options:', Array.from(locationSelect.options).map(opt => opt.textContent));
        } else {
            console.error('Location select not found');
        }
    } catch (error) {
        console.error('Error testing location manager:', error);
    }
};

window.testDropdowns = () => {
    console.log('Testing dropdowns...');
    const locationSelect = document.getElementById('location-select');
    const machineSelect = document.getElementById('machine-select');
    
    console.log('Location select:', locationSelect);
    console.log('Machine select:', machineSelect);
    
    if (locationSelect) {
        console.log('Location options:', locationSelect.options.length);
        for (let i = 0; i < locationSelect.options.length; i++) {
            console.log(`  Option ${i}:`, locationSelect.options[i].value, '=', locationSelect.options[i].textContent);
        }
    }
    
    if (machineSelect) {
        console.log('Machine options:', machineSelect.options.length);
        for (let i = 0; i < machineSelect.options.length; i++) {
            console.log(`  Option ${i}:`, machineSelect.options[i].value, '=', machineSelect.options[i].textContent);
        }
    }
};

window.initDropdowns = () => {
    console.log('Manually initializing dropdowns...');
    if (window.app && typeof window.app.initializeLocationDropdowns === 'function') {
        window.app.initializeLocationDropdowns();
        console.log('Dropdown initialization called');
    } else {
        console.error('App or initializeLocationDropdowns not available');
        console.log('Available on window:', Object.keys(window).filter(key => key.includes('app')));
    }
};

window.testApp = () => {
    console.log('Testing app availability...');
    console.log('App on window:', window.app);
    console.log('App type:', typeof window.app);
    if (window.app) {
        console.log('App methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.app)));
    }
};

console.log('BTM Utility: Global test functions added to window object'); 