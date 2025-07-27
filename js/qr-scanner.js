/**
 * QR Scanner Module
 * Comprehensive QR code scanning and generation functionality for BTM Utility
 * Implements all tasks in section 4.0: QR Code & Camera Integration
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, playSuccessBeep, playErrorBeep } from './utils.js';

export class QRScanner {
    constructor() {
        this.isScanning = false;
        this.scanner = null;
        this.currentStream = null;
        this.scanInterval = null;
        this.lastScanTime = 0;
        this.scanCooldown = 2000; // 2 seconds between scans
        
        // BTM Machine Configuration
        this.machines = [
            { location: 'peacock', changers: 3, hoppers: [1, 1, 1] },
            { location: 'dover', changers: 3, hoppers: [1, 1, 1] },
            { location: 'massillon', changers: 2, hoppers: [2, 2] }
        ];
        
        // QR Code format validation
        this.btmQRFormat = {
            required: ['location', 'changer', 'hopper'],
            optional: ['machineId', 'type', 'version', 'timestamp'],
            type: 'btm-machine',
            version: '1.0'
        };
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing QR Scanner module');
            
            // Check for required APIs
            this.checkAPISupport();
            
            // Initialize UI elements
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            logger.info('QR Scanner module initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'qr-scanner-init'
            });
        }
    }

    checkAPISupport() {
        // Check for camera API support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not supported in this browser');
        }

        // Check for canvas support
        const canvas = document.createElement('canvas');
        if (!canvas.getContext) {
            throw new Error('Canvas API not supported in this browser');
        }

        // Check for jsQR library (will be loaded dynamically)
        if (typeof jsQR === 'undefined') {
            logger.warn('jsQR library not loaded - QR detection may not work');
        }

        logger.info('QR Scanner API support verified');
    }

    initializeUI() {
        // Create QR scanner container if it doesn't exist
        let container = document.getElementById('qr-scanner-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'qr-scanner-container';
            container.className = 'qr-scanner';
            document.body.appendChild(container);
        }

        // Initialize UI elements
        this.createScannerUI();
        this.createManualEntryUI();
        this.createQRGeneratorUI();
    }

    createScannerUI() {
        const container = document.getElementById('qr-scanner-container');
        if (!container) return;

        container.innerHTML = `
            <div class="qr-scanner-interface">
                <div class="scanner-header">
                    <h3>📱 QR Code Scanner</h3>
                    <div class="scanner-status" id="scanner-status">
                        <span class="status-indicator status-offline"></span>
                        <span class="status-text">Ready</span>
                    </div>
                </div>
                
                <div class="scanner-video-container">
                    <video id="qr-video" class="qr-video" autoplay playsinline muted></video>
                    <canvas id="qr-canvas" class="qr-canvas" style="display: none;"></canvas>
                    
                    <div class="qr-overlay">
                        <div class="qr-frame">
                            <div class="qr-corner qr-corner-tl"></div>
                            <div class="qr-corner qr-corner-tr"></div>
                            <div class="qr-corner qr-corner-bl"></div>
                            <div class="qr-corner qr-corner-br"></div>
                        </div>
                        <div class="qr-instructions">
                            Position QR code within frame
                        </div>
                        <div class="qr-scan-line"></div>
                    </div>
                </div>
                
                <div class="scanner-controls">
                    <button type="button" id="start-scan-btn" class="btn btn-primary">
                        📷 Start Scanner
                    </button>
                    <button type="button" id="stop-scan-btn" class="btn btn-secondary" style="display: none;">
                        ⏹️ Stop Scanner
                    </button>
                    <button type="button" id="switch-camera-btn" class="btn btn-secondary">
                        🔄 Switch Camera
                    </button>
                    <button type="button" id="manual-entry-btn" class="btn btn-secondary">
                        ⌨️ Manual Entry
                    </button>
                </div>
                
                <div class="scanner-results" id="scanner-results" style="display: none;">
                    <h4>Scan Results</h4>
                    <div id="scan-result-content"></div>
                </div>
            </div>
        `;
    }

    createManualEntryUI() {
        const container = document.getElementById('manual-entry-container');
        if (!container) return;

        container.innerHTML = `
            <div class="manual-entry-interface">
                <h3>⌨️ Manual Entry</h3>
                <form id="manual-entry-form" class="manual-entry-form">
                    <div class="form-group">
                        <label for="manual-location">Location</label>
                        <select id="manual-location" required>
                            <option value="">Select Location</option>
                            <option value="peacock">Peacock</option>
                            <option value="dover">Dover</option>
                            <option value="massillon">Massillon</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="manual-changer">Changer</label>
                        <select id="manual-changer" required>
                            <option value="">Select Changer</option>
                            <option value="1">Changer 1</option>
                            <option value="2">Changer 2</option>
                            <option value="3">Changer 3</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="manual-hopper">Hopper</label>
                        <select id="manual-hopper" required>
                            <option value="">Select Hopper</option>
                            <option value="1">Hopper 1</option>
                            <option value="2">Hopper 2</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="manual-counter">Counter Value</label>
                        <input type="number" id="manual-counter" step="0.01" min="0" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Submit Entry</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closeManualEntry()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }

    createQRGeneratorUI() {
        const container = document.getElementById('qr-generator-container');
        if (!container) return;

        container.innerHTML = `
            <div class="qr-generator-interface">
                <h3>🎨 QR Code Generator</h3>
                <div class="generator-controls">
                    <button type="button" id="generate-all-qr-btn" class="btn btn-primary">
                        Generate All Machine QR Codes
                    </button>
                    <button type="button" id="generate-single-qr-btn" class="btn btn-secondary">
                        Generate Single QR Code
                    </button>
                </div>
                
                <div class="generator-input" id="generator-input" style="display: none;">
                    <input type="text" id="qr-data-input" placeholder="Enter data for QR code">
                    <button type="button" onclick="this.generateSingleQR()">Generate</button>
                </div>
                
                <div class="generated-qr-codes" id="generated-qr-codes"></div>
            </div>
        `;
    }

    setupEventListeners() {
        // Scanner controls
        const startBtn = document.getElementById('start-scan-btn');
        const stopBtn = document.getElementById('stop-scan-btn');
        const switchBtn = document.getElementById('switch-camera-btn');
        const manualBtn = document.getElementById('manual-entry-btn');

        if (startBtn) startBtn.addEventListener('click', () => this.startScanner());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopScanner());
        if (switchBtn) switchBtn.addEventListener('click', () => this.switchCamera());
        if (manualBtn) manualBtn.addEventListener('click', () => this.showManualEntry());

        // Manual entry form
        const manualForm = document.getElementById('manual-entry-form');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => this.handleManualEntry(e));
        }

        // QR generator controls
        const generateAllBtn = document.getElementById('generate-all-qr-btn');
        const generateSingleBtn = document.getElementById('generate-single-qr-btn');

        if (generateAllBtn) generateAllBtn.addEventListener('click', () => this.generateAllMachineQRs());
        if (generateSingleBtn) generateSingleBtn.addEventListener('click', () => this.showSingleQRGenerator());

        // Dynamic hopper options based on location
        const locationSelect = document.getElementById('manual-location');
        const changerSelect = document.getElementById('manual-changer');
        const hopperSelect = document.getElementById('manual-hopper');

        if (locationSelect) {
            locationSelect.addEventListener('change', () => this.updateHopperOptions());
        }
        if (changerSelect) {
            changerSelect.addEventListener('change', () => this.updateHopperOptions());
        }
    }

    // Task 4.1: QR Scanner Library Integration
    async startScanner() {
        try {
            if (this.isScanning) return;

            logger.info('Starting QR scanner');
            this.updateScannerStatus('starting', 'Initializing camera...');

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.currentStream = stream;
            const video = document.getElementById('qr-video');
            video.srcObject = stream;
            await video.play();

            this.isScanning = true;
            this.updateScannerStatus('scanning', 'Scanning for QR codes...');
            this.updateScannerControls(true);

            // Start QR detection loop
            this.startQRDetection();

            logger.info('QR scanner started successfully');
            playSuccessBeep();

        } catch (error) {
            this.handleScannerError(error);
        }
    }

    stopScanner() {
        try {
            if (!this.isScanning) return;

            logger.info('Stopping QR scanner');

            // Stop video stream
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            // Clear scan interval
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }

            this.isScanning = false;
            this.updateScannerStatus('ready', 'Ready to scan');
            this.updateScannerControls(false);

            logger.info('QR scanner stopped');

        } catch (error) {
            logger.error('Error stopping QR scanner', null, error);
        }
    }

    // Task 4.2: QR Code Scanning Interface with Visual Feedback
    startQRDetection() {
        if (!this.isScanning) return;

        this.scanInterval = setInterval(() => {
            this.scanQRCode();
        }, 100); // Scan every 100ms
    }

    async scanQRCode() {
        try {
            const video = document.getElementById('qr-video');
            const canvas = document.getElementById('qr-canvas');
            
            if (!video || !canvas || !this.isScanning) return;

            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data for QR detection
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Use jsQR library for QR detection
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    this.handleQRCodeDetected(code.data);
                    return;
                }
            }

            // Visual feedback - animate scan line
            this.animateScanLine();

        } catch (error) {
            logger.error('Error scanning QR code', null, error);
        }
    }

    animateScanLine() {
        const scanLine = document.querySelector('.qr-scan-line');
        if (scanLine) {
            scanLine.style.animation = 'scan-line 2s linear infinite';
        }
    }

    // Task 4.3: Machine Identification System
    handleQRCodeDetected(qrData) {
        try {
            const now = Date.now();
            if (now - this.lastScanTime < this.scanCooldown) {
                return; // Prevent multiple scans
            }
            this.lastScanTime = now;

            logger.info('QR code detected', { qrData });

            // Validate QR data format
            const validatedData = this.validateQRData(qrData);
            if (!validatedData) {
                this.showScanError('Invalid QR code format');
                return;
            }

            // Identify machine
            const machineInfo = this.identifyMachine(validatedData);
            if (!machineInfo) {
                this.showScanError('Machine not found in system');
                return;
            }

            // Display results
            this.showScanResults(machineInfo);
            
            // Stop scanner
            this.stopScanner();

            // Success feedback
            playSuccessBeep();
            this.updateScannerStatus('success', 'QR code scanned successfully');

        } catch (error) {
            logger.error('Error handling QR code', null, error);
            this.showScanError('Error processing QR code');
        }
    }

    // Task 4.4: Manual Entry Fallback
    showManualEntry() {
        const container = document.getElementById('manual-entry-container');
        if (container) {
            container.style.display = 'block';
        }
    }

    closeManualEntry() {
        const container = document.getElementById('manual-entry-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    async handleManualEntry(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const entry = {
                location: formData.get('manual-location'),
                changer: parseInt(formData.get('manual-changer')),
                hopper: parseInt(formData.get('manual-hopper')),
                counter: parseFloat(formData.get('manual-counter')),
                timestamp: new Date().toISOString(),
                source: 'manual-entry'
            };

            // Validate entry
            if (!this.validateManualEntry(entry)) {
                this.showManualEntryError('Please fill in all fields correctly');
                return;
            }

            // Process entry
            const machineInfo = this.identifyMachine(entry);
            this.showScanResults(machineInfo);
            this.closeManualEntry();

            logger.info('Manual entry processed', entry);
            playSuccessBeep();

        } catch (error) {
            logger.error('Error handling manual entry', null, error);
            this.showManualEntryError('Error processing entry');
        }
    }

    // Task 4.5: QR Code Validation for BTM-specific Format
    validateQRData(data) {
        try {
            let parsed;
            
            // Try to parse as JSON
            if (typeof data === 'string') {
                parsed = JSON.parse(data);
            } else {
                parsed = data;
            }

            // Check required fields
            const required = this.btmQRFormat.required;
            for (const field of required) {
                if (!parsed[field]) {
                    logger.warn(`QR validation failed: missing required field '${field}'`);
                    return null;
                }
            }

            // Validate location
            const validLocations = this.machines.map(m => m.location);
            if (!validLocations.includes(parsed.location)) {
                logger.warn(`QR validation failed: invalid location '${parsed.location}'`);
                return null;
            }

            // Validate changer and hopper numbers
            const machine = this.machines.find(m => m.location === parsed.location);
            if (!machine) {
                logger.warn(`QR validation failed: machine not found for location '${parsed.location}'`);
                return null;
            }

            if (parsed.changer < 1 || parsed.changer > machine.changers) {
                logger.warn(`QR validation failed: invalid changer number '${parsed.changer}'`);
                return null;
            }

            const maxHoppers = machine.hoppers[parsed.changer - 1];
            if (parsed.hopper < 1 || parsed.hopper > maxHoppers) {
                logger.warn(`QR validation failed: invalid hopper number '${parsed.hopper}'`);
                return null;
            }

            // Add default values for optional fields
            parsed.type = parsed.type || this.btmQRFormat.type;
            parsed.version = parsed.version || this.btmQRFormat.version;
            parsed.timestamp = parsed.timestamp || new Date().toISOString();

            logger.info('QR validation successful', parsed);
            return parsed;

        } catch (error) {
            logger.error('QR validation error', null, error);
            return null;
        }
    }

    validateManualEntry(entry) {
        return entry.location && 
               entry.changer && 
               entry.hopper && 
               entry.counter !== null && 
               entry.counter >= 0;
    }

    // Task 4.6: Camera Permission Handling and User Guidance
    async handleScannerError(error) {
        logger.error('Scanner error', null, error);

        let userMessage = 'Camera access error';
        let guidance = '';

        if (error.name === 'NotAllowedError') {
            userMessage = 'Camera permission denied';
            guidance = 'Please enable camera permissions in your browser settings and try again.';
        } else if (error.name === 'NotFoundError') {
            userMessage = 'No camera found';
            guidance = 'Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
            userMessage = 'Camera not supported';
            guidance = 'Your browser does not support camera access. Please try a different browser.';
        } else {
            guidance = 'Please check your camera connection and try again.';
        }

        this.updateScannerStatus('error', userMessage);
        this.showUserGuidance(userMessage, guidance);
        playErrorBeep();
    }

    showUserGuidance(title, message) {
        const guidance = document.createElement('div');
        guidance.className = 'user-guidance';
        guidance.innerHTML = `
            <div class="guidance-content">
                <h4>${title}</h4>
                <p>${message}</p>
                <button onclick="this.remove()">OK</button>
            </div>
        `;
        document.body.appendChild(guidance);
    }

    // Task 4.7: QR Code Generation for Testing
    generateAllMachineQRs() {
        try {
            const container = document.getElementById('generated-qr-codes');
            if (!container) return;

            container.innerHTML = '<h4>Generated QR Codes for All Machines</h4>';

            this.machines.forEach(machine => {
                for (let changer = 1; changer <= machine.changers; changer++) {
                    for (let hopper = 1; hopper <= machine.hoppers[changer - 1]; hopper++) {
                        const qrData = {
                            location: machine.location,
                            changer: changer,
                            hopper: hopper,
                            machineId: `${machine.location}-changer${changer}-hopper${hopper}`,
                            type: this.btmQRFormat.type,
                            version: this.btmQRFormat.version,
                            timestamp: new Date().toISOString()
                        };

                        this.createQRCodeDisplay(qrData, container);
                    }
                }
            });

            logger.info('All machine QR codes generated');

        } catch (error) {
            logger.error('Error generating QR codes', null, error);
        }
    }

    generateSingleQR() {
        const input = document.getElementById('qr-data-input');
        if (!input || !input.value) {
            alert('Please enter data for QR code');
            return;
        }

        try {
            const qrData = JSON.parse(input.value);
            const container = document.getElementById('generated-qr-codes');
            
            if (container) {
                container.innerHTML = '<h4>Generated QR Code</h4>';
                this.createQRCodeDisplay(qrData, container);
            }

        } catch (error) {
            alert('Invalid JSON format. Please enter valid JSON data.');
        }
    }

    createQRCodeDisplay(qrData, container) {
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-code-display';
        qrDiv.innerHTML = `
            <div class="qr-code-container">
                <div class="qr-code-placeholder">
                    <div class="qr-code-text">QR Code</div>
                    <div class="qr-code-id">${qrData.machineId || 'Custom'}</div>
                </div>
            </div>
            <div class="qr-code-data">
                <pre>${JSON.stringify(qrData, null, 2)}</pre>
            </div>
        `;
        container.appendChild(qrDiv);
    }

    // Utility Methods
    identifyMachine(data) {
        const machine = this.machines.find(m => m.location === data.location);
        if (!machine) return null;

        return {
            ...data,
            machineId: data.machineId || `${data.location}-changer${data.changer}-hopper${data.hopper}`,
            maxHoppers: machine.hoppers[data.changer - 1],
            locationName: this.getLocationName(data.location)
        };
    }

    getLocationName(location) {
        const names = {
            'peacock': 'Peacock Laundromat',
            'dover': 'Dover Laundromat',
            'massillon': 'Massillon Laundromat'
        };
        return names[location] || location;
    }

    updateScannerStatus(status, message) {
        const statusElement = document.getElementById('scanner-status');
        if (!statusElement) return;

        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('.status-text');

        if (indicator) {
            indicator.className = `status-indicator status-${status}`;
        }
        if (text) {
            text.textContent = message;
        }
    }

    updateScannerControls(isScanning) {
        const startBtn = document.getElementById('start-scan-btn');
        const stopBtn = document.getElementById('stop-scan-btn');

        if (startBtn) startBtn.style.display = isScanning ? 'none' : 'block';
        if (stopBtn) stopBtn.style.display = isScanning ? 'block' : 'none';
    }

    showScanResults(machineInfo) {
        const resultsContainer = document.getElementById('scanner-results');
        const contentContainer = document.getElementById('scan-result-content');

        if (resultsContainer && contentContainer) {
            contentContainer.innerHTML = `
                <div class="scan-result">
                    <h5>Machine Identified</h5>
                    <div class="machine-info">
                        <p><strong>Location:</strong> ${machineInfo.locationName}</p>
                        <p><strong>Changer:</strong> ${machineInfo.changer}</p>
                        <p><strong>Hopper:</strong> ${machineInfo.hopper}</p>
                        <p><strong>Machine ID:</strong> ${machineInfo.machineId}</p>
                        <p><strong>Scanned:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <button onclick="this.hideScanResults()" class="btn btn-primary">Continue</button>
                </div>
            `;
            resultsContainer.style.display = 'block';
        }
    }

    hideScanResults() {
        const resultsContainer = document.getElementById('scanner-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    showScanError(message) {
        this.updateScannerStatus('error', message);
        playErrorBeep();
    }

    showManualEntryError(message) {
        alert(message);
        playErrorBeep();
    }

    updateHopperOptions() {
        const locationSelect = document.getElementById('manual-location');
        const changerSelect = document.getElementById('manual-changer');
        const hopperSelect = document.getElementById('manual-hopper');

        if (!locationSelect || !changerSelect || !hopperSelect) return;

        const location = locationSelect.value;
        const changer = parseInt(changerSelect.value);

        if (location && changer) {
            const machine = this.machines.find(m => m.location === location);
            if (machine && changer <= machine.changers) {
                const maxHoppers = machine.hoppers[changer - 1];
                
                hopperSelect.innerHTML = '<option value="">Select Hopper</option>';
                for (let i = 1; i <= maxHoppers; i++) {
                    hopperSelect.innerHTML += `<option value="${i}">Hopper ${i}</option>`;
                }
            }
        }
    }

    switchCamera() {
        // Implementation for switching between front/back cameras
        logger.info('Camera switch requested');
        // This would require additional implementation for multiple camera support
    }

    showSingleQRGenerator() {
        const inputContainer = document.getElementById('generator-input');
        if (inputContainer) {
            inputContainer.style.display = inputContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Public API
    getMachineConfiguration() {
        return this.machines;
    }

    getBTMQRFormat() {
        return this.btmQRFormat;
    }

    isScanning() {
        return this.isScanning;
    }

    // Cleanup
    destroy() {
        this.stopScanner();
        logger.info('QR Scanner module destroyed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.qrScanner = new QRScanner();
    });
} else {
    window.qrScanner = new QRScanner();
}

export default window.qrScanner; 