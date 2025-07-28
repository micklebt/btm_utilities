/**
 * Simple QR Code Scanner
 * Detects QR codes and returns their JSON data
 */

import { logger } from './logger.js';

export class SimpleQRScanner {
    constructor() {
        this.isInitialized = false;
        this.lastScanTime = 0;
        this.scanCooldown = 2000; // 2 seconds between scans
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof jsQR === 'undefined') {
                logger.warn('Simple QR Scanner: jsQR library not available');
                return;
            }
            
            this.isInitialized = true;
            logger.info('Simple QR Scanner: Initialized successfully');
        } catch (error) {
            logger.error('Simple QR Scanner: Initialization failed', error);
        }
    }
    
    async scanQRCode(imageData) {
        if (!this.isInitialized) {
            logger.warn('Simple QR Scanner: Not initialized');
            return null;
        }
        
        // Check cooldown
        const now = Date.now();
        if (now - this.lastScanTime < this.scanCooldown) {
            logger.info('Simple QR Scanner: Scan cooldown active');
            return null;
        }
        
        try {
            logger.info('Simple QR Scanner: Starting QR scan...');
            
            const qrResult = await this.detectQRCode(imageData);
            
            if (qrResult) {
                this.lastScanTime = now;
                logger.info('Simple QR Scanner: QR code detected:', qrResult);
                return qrResult;
            } else {
                logger.info('Simple QR Scanner: No QR code detected');
                return null;
            }
            
        } catch (error) {
            logger.error('Simple QR Scanner: Scan error', error);
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    async detectQRCode(imageData) {
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                logger.info('Simple QR Scanner: QR code found:', code.data);
                
                // Try to parse as JSON
                let parsedData = null;
                try {
                    parsedData = JSON.parse(code.data);
                    logger.info('Simple QR Scanner: Parsed JSON data:', parsedData);
                } catch (parseError) {
                    logger.info('Simple QR Scanner: QR data is not JSON, using raw data');
                    parsedData = {
                        rawData: code.data,
                        location: code.location
                    };
                }
                
                return {
                    data: parsedData,
                    rawData: code.data,
                    location: code.location,
                    confidence: 100,
                    timestamp: Date.now()
                };
            }
            
            return null;
        } catch (error) {
            logger.error('Simple QR Scanner: QR detection error:', error);
            return null;
        }
    }
    
    getScanStats() {
        return {
            isInitialized: this.isInitialized,
            lastScanTime: this.lastScanTime,
            scanCooldown: this.scanCooldown
        };
    }
}

// Create and export singleton instance
export const simpleQRScanner = new SimpleQRScanner();

// Export for global access
window.simpleQRScanner = simpleQRScanner; 