/**
 * Money Collection Module
 * Handles QR code scanning, payment processing, and collection tracking
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatCurrency, formatDate, validateAmount, debounce, playSuccessBeep, playErrorBeep, playNotificationBeep } from './utils.js';

export class MoneyCollection {
    constructor() {
        this.isScanning = false;
        this.scanner = null;
        this.currentCollection = null;
        this.collections = [];
        this.paymentMethods = [
            { id: 'cash', name: 'Cash', icon: '💵' },
            { id: 'card', name: 'Card', icon: '💳' },
            { id: 'qr', name: 'QR Code', icon: '📱' },
            { id: 'venmo', name: 'Venmo', icon: '📱' },
            { id: 'paypal', name: 'PayPal', icon: '📱' },
            { id: 'zelle', name: 'Zelle', icon: '📱' }
        ];
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Money Collection module');
            
            // Load existing collections
            await this.loadCollections();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            logger.info('Money Collection module initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'money-collection-init'
            });
        }
    }

    async loadCollections() {
        try {
            const savedCollections = await storageUtils.collectionsManager.load();
            this.collections = savedCollections || [];
            logger.info(`Loaded ${this.collections.length} collections`);
        } catch (error) {
            logger.error('Failed to load collections', null, error);
            this.collections = [];
        }
    }

    initializeUI() {
        const container = document.getElementById('money-collection-container');
        if (!container) return;

        container.innerHTML = `
            <div class="collection-form">
                <h2>💰 Money Collection</h2>
                
                <div class="form-section">
                    <label for="collection-amount">Amount Collected</label>
                    <div class="amount-input-group">
                        <span class="currency-symbol">$</span>
                        <input type="number" id="collection-amount" 
                               placeholder="0.00" step="0.01" min="0" 
                               class="amount-input" required>
                    </div>
                </div>

                <div class="form-section">
                    <label for="collection-method">Payment Method</label>
                    <div class="payment-methods-grid">
                        ${this.paymentMethods.map(method => `
                            <button type="button" class="payment-method-btn" 
                                    data-method="${method.id}">
                                <span class="method-icon">${method.icon}</span>
                                <span class="method-name">${method.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-section qr-section" style="display: none;">
                    <label>QR Code Scanner</label>
                    <div class="qr-scanner-container">
                        <video id="qr-video" class="qr-video"></video>
                        <canvas id="qr-canvas" class="qr-canvas"></canvas>
                        <div class="qr-overlay">
                            <div class="qr-frame"></div>
                            <div class="qr-instructions">
                                Position QR code within frame
                            </div>
                        </div>
                        <button type="button" id="start-scan-btn" class="btn btn-primary">
                            📷 Start Scanner
                        </button>
                        <button type="button" id="stop-scan-btn" class="btn btn-secondary" style="display: none;">
                            ⏹️ Stop Scanner
                        </button>
                    </div>
                </div>

                <div class="form-section">
                    <label for="collection-notes">Notes (Optional)</label>
                    <textarea id="collection-notes" 
                              placeholder="Enter any additional notes about this collection..."
                              rows="3"></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" id="save-collection-btn" class="btn btn-primary">
                        💾 Save Collection
                    </button>
                    <button type="button" id="clear-form-btn" class="btn btn-secondary">
                        🗑️ Clear Form
                    </button>
                </div>
            </div>

            <div class="collections-summary">
                <h3>Today's Collections</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Collected</span>
                        <span class="stat-value" id="today-total">$0.00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Collections</span>
                        <span class="stat-value" id="today-count">0</span>
                    </div>
                </div>
                <div class="collections-list" id="collections-list">
                    <!-- Collections will be populated here -->
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Amount input validation
        const amountInput = document.getElementById('collection-amount');
        if (amountInput) {
            amountInput.addEventListener('input', debounce((e) => {
                this.validateAmount(e.target.value);
            }, 300));
        }

        // Payment method selection
        const paymentButtons = document.querySelectorAll('.payment-method-btn');
        paymentButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectPaymentMethod(e.target.closest('.payment-method-btn').dataset.method);
            });
        });

        // QR scanner controls
        const startScanBtn = document.getElementById('start-scan-btn');
        const stopScanBtn = document.getElementById('stop-scan-btn');
        
        if (startScanBtn) {
            startScanBtn.addEventListener('click', () => this.startQRScanner());
        }
        
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', () => this.stopQRScanner());
        }

        // Form actions
        const saveBtn = document.getElementById('save-collection-btn');
        const clearBtn = document.getElementById('clear-form-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCollection());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }

        // QR video stream
        const qrVideo = document.getElementById('qr-video');
        if (qrVideo) {
            qrVideo.addEventListener('loadedmetadata', () => {
                this.setupQRCanvas();
            });
        }
    }

    validateAmount(amount) {
        const amountInput = document.getElementById('collection-amount');
        const isValid = validateAmount(amount);
        
        if (isValid) {
            amountInput.classList.remove('error');
            amountInput.setCustomValidity('');
        } else {
            amountInput.classList.add('error');
            amountInput.setCustomValidity('Please enter a valid amount');
        }
    }

    selectPaymentMethod(methodId) {
        // Update button states
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector(`[data-method="${methodId}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }

        // Show/hide QR scanner for QR method
        const qrSection = document.querySelector('.qr-section');
        if (qrSection) {
            qrSection.style.display = methodId === 'qr' ? 'block' : 'none';
        }

        logger.info(`Payment method selected: ${methodId}`);
    }

    async startQRScanner() {
        try {
            if (this.isScanning) return;

            const video = document.getElementById('qr-video');
            const startBtn = document.getElementById('start-scan-btn');
            const stopBtn = document.getElementById('stop-scan-btn');

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            video.srcObject = stream;
            video.play();

            this.isScanning = true;
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';

            // Start QR code detection
            this.scanQRCode();

            logger.info('QR scanner started');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'qr-scanner-start'
            });
            
                               // Show user-friendly error
                   this.showNotification('Camera access denied. Please check permissions.', 'error');
                   playErrorBeep();
        }
    }

    stopQRScanner() {
        try {
            const video = document.getElementById('qr-video');
            const startBtn = document.getElementById('start-scan-btn');
            const stopBtn = document.getElementById('stop-scan-btn');

            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }

            this.isScanning = false;
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';

            logger.info('QR scanner stopped');
        } catch (error) {
            logger.error('Error stopping QR scanner', null, error);
        }
    }

    setupQRCanvas() {
        const video = document.getElementById('qr-video');
        const canvas = document.getElementById('qr-canvas');
        
        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas for QR detection
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    async scanQRCode() {
        if (!this.isScanning) return;

        try {
            const canvas = document.getElementById('qr-canvas');
            const video = document.getElementById('qr-video');
            
            if (!canvas || !video) return;

            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data for QR detection
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Use jsQR library for QR detection (if available)
            if (window.jsQR) {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    this.handleQRCodeDetected(code.data);
                    return;
                }
            }

            // Continue scanning
            requestAnimationFrame(() => this.scanQRCode());
        } catch (error) {
            logger.error('Error scanning QR code', null, error);
            requestAnimationFrame(() => this.scanQRCode());
        }
    }

    handleQRCodeDetected(qrData) {
        try {
            // Parse QR data (could be payment info, amount, etc.)
            let amount = null;
            let paymentInfo = null;

            // Try to parse as JSON
            try {
                const parsed = JSON.parse(qrData);
                amount = parsed.amount || parsed.total || parsed.value;
                paymentInfo = parsed;
            } catch {
                // Try to extract amount from string
                const amountMatch = qrData.match(/\$?(\d+\.?\d*)/);
                if (amountMatch) {
                    amount = parseFloat(amountMatch[1]);
                }
                paymentInfo = { raw: qrData };
            }

            // Update form with detected amount
            if (amount) {
                const amountInput = document.getElementById('collection-amount');
                if (amountInput) {
                    amountInput.value = amount.toFixed(2);
                    this.validateAmount(amount);
                }
            }

            // Stop scanner
            this.stopQRScanner();

                               // Show success notification
                   this.showNotification(`QR Code detected: ${qrData}`, 'success');
                   playSuccessBeep();

            logger.info('QR code detected', { qrData, amount, paymentInfo });
        } catch (error) {
            logger.error('Error handling QR code', null, error);
        }
    }

    async saveCollection() {
        try {
            const amountInput = document.getElementById('collection-amount');
            const notesInput = document.getElementById('collection-notes');
            const selectedMethod = document.querySelector('.payment-method-btn.selected');

            // Validate form
            if (!amountInput.value || !selectedMethod) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            const amount = parseFloat(amountInput.value);
            if (!validateAmount(amount)) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }

            // Create collection object
            const collection = {
                id: generateId('collection'),
                amount: amount,
                method: selectedMethod.dataset.method,
                notes: notesInput.value.trim(),
                timestamp: new Date().toISOString(),
                date: new Date().toDateString(),
                time: new Date().toLocaleTimeString()
            };

            // Add to collections
            this.collections.push(collection);

            // Save to storage
            await storageUtils.collectionsManager.save(this.collections);

            // Update UI
            this.updateCollectionsDisplay();
            this.clearForm();

                               // Show success notification
                   this.showNotification(`Collection saved: ${formatCurrency(amount)}`, 'success');
                   playSuccessBeep();

            logger.info('Collection saved', collection);
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'save-collection'
            });
            
                               this.showNotification('Failed to save collection', 'error');
                   playErrorBeep();
        }
    }

    clearForm() {
        const amountInput = document.getElementById('collection-amount');
        const notesInput = document.getElementById('collection-notes');
        const paymentButtons = document.querySelectorAll('.payment-method-btn');
        const qrSection = document.querySelector('.qr-section');

        if (amountInput) amountInput.value = '';
        if (notesInput) notesInput.value = '';
        
        paymentButtons.forEach(btn => btn.classList.remove('selected'));
        
        if (qrSection) qrSection.style.display = 'none';

        // Stop scanner if running
        if (this.isScanning) {
            this.stopQRScanner();
        }
    }

    updateCollectionsDisplay() {
        const today = new Date().toDateString();
        const todayCollections = this.collections.filter(c => c.date === today);
        
        const total = todayCollections.reduce((sum, c) => sum + c.amount, 0);
        const count = todayCollections.length;

        // Update summary
        const totalElement = document.getElementById('today-total');
        const countElement = document.getElementById('today-count');
        
        if (totalElement) totalElement.textContent = formatCurrency(total);
        if (countElement) countElement.textContent = count;

        // Update collections list
        const listElement = document.getElementById('collections-list');
        if (listElement) {
            listElement.innerHTML = todayCollections.length > 0 
                ? todayCollections.map(collection => `
                    <div class="collection-item">
                        <div class="collection-info">
                            <div class="collection-amount">${formatCurrency(collection.amount)}</div>
                            <div class="collection-method">${this.getPaymentMethodName(collection.method)}</div>
                            <div class="collection-time">${collection.time}</div>
                        </div>
                        ${collection.notes ? `<div class="collection-notes">${collection.notes}</div>` : ''}
                    </div>
                `).join('')
                : '<div class="no-collections">No collections today</div>';
        }
    }

    getPaymentMethodName(methodId) {
        const method = this.paymentMethods.find(m => m.id === methodId);
        return method ? method.name : methodId;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }

    // Public methods for external access
    getCollections() {
        return this.collections;
    }

    getTodayTotal() {
        const today = new Date().toDateString();
        const todayCollections = this.collections.filter(c => c.date === today);
        return todayCollections.reduce((sum, c) => sum + c.amount, 0);
    }

    async exportCollections(format = 'json') {
        try {
            const data = {
                collections: this.collections,
                summary: {
                    total: this.getTodayTotal(),
                    count: this.collections.length,
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data.collections);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting collections', null, error);
            throw error;
        }
    }

    convertToCSV(collections) {
        const headers = ['Date', 'Time', 'Amount', 'Method', 'Notes'];
        const rows = collections.map(c => [
            c.date,
            c.time,
            c.amount,
            c.method,
            c.notes || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.moneyCollection = new MoneyCollection();
    });
} else {
    window.moneyCollection = new MoneyCollection();
}

export default window.moneyCollection; 