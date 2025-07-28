/**
 * Robust QR Code Scanner
 * Enhanced QR detection with better debugging and error handling
 */

import { logger } from './logger.js';

export class RobustQRScanner {
    constructor() {
        this.isInitialized = false;
        this.lastScanTime = 0;
        this.scanCooldown = 1000; // 1 second between scans
        this.debugMode = true;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Wait for jsQR to be available
            let attempts = 0;
            const maxAttempts = 10;
            
            while (typeof jsQR === 'undefined' && attempts < maxAttempts) {
                logger.info(`Robust QR Scanner: Waiting for jsQR library... (attempt ${attempts + 1})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            if (typeof jsQR === 'undefined') {
                logger.error('Robust QR Scanner: jsQR library not available after waiting');
                return;
            }
            
            this.isInitialized = true;
            logger.info('Robust QR Scanner: Initialized successfully');
            
            // Test jsQR function
            if (this.debugMode) {
                logger.info('Robust QR Scanner: jsQR function test:', typeof jsQR);
            }
            
        } catch (error) {
            logger.error('Robust QR Scanner: Initialization failed', error);
        }
    }
    
    async scanQRCode(imageData) {
        if (!this.isInitialized) {
            logger.warn('Robust QR Scanner: Not initialized');
            return null;
        }
        
        // Check cooldown
        const now = Date.now();
        if (now - this.lastScanTime < this.scanCooldown) {
            if (this.debugMode) {
                logger.info('Robust QR Scanner: Scan cooldown active');
            }
            return null;
        }
        
        try {
            if (this.debugMode) {
                logger.info('Robust QR Scanner: Starting QR scan...');
                logger.info('Robust QR Scanner: Image data size:', imageData.width, 'x', imageData.height);
                logger.info('Robust QR Scanner: Image data length:', imageData.data.length);
            }
            
            const qrResult = await this.detectQRCode(imageData);
            
            if (qrResult) {
                this.lastScanTime = now;
                logger.info('Robust QR Scanner: QR code detected:', qrResult);
                return qrResult;
            } else {
                if (this.debugMode) {
                    logger.info('Robust QR Scanner: No QR code detected');
                }
                return null;
            }
            
        } catch (error) {
            logger.error('Robust QR Scanner: Scan error', error);
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    async detectQRCode(imageData) {
        try {
            if (this.debugMode) {
                logger.info('Robust QR Scanner: Attempting QR detection...');
            }
            
            // Ensure imageData is valid
            if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
                logger.error('Robust QR Scanner: Invalid image data');
                return null;
            }
            
            // Try multiple detection approaches
            const results = [];
            
            // Approach 1: Direct jsQR call
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    logger.info('Robust QR Scanner: QR code found (direct):', code.data);
                    results.push(this.processQRResult(code));
                }
            } catch (error) {
                logger.error('Robust QR Scanner: Direct jsQR error:', error);
            }
            
            // Approach 2: Try with different parameters
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });
                if (code) {
                    logger.info('Robust QR Scanner: QR code found (no invert):', code.data);
                    results.push(this.processQRResult(code));
                }
            } catch (error) {
                logger.error('Robust QR Scanner: No invert jsQR error:', error);
            }
            
            // Approach 3: Try with grayscale conversion
            try {
                const grayscaleData = this.convertToGrayscale(imageData);
                const code = jsQR(grayscaleData, imageData.width, imageData.height);
                if (code) {
                    logger.info('Robust QR Scanner: QR code found (grayscale):', code.data);
                    results.push(this.processQRResult(code));
                }
            } catch (error) {
                logger.error('Robust QR Scanner: Grayscale jsQR error:', error);
            }
            
            // Return the best result
            if (results.length > 0) {
                // Prefer JSON results over raw data
                const jsonResult = results.find(r => r.data && typeof r.data === 'object' && !r.data.rawData);
                return jsonResult || results[0];
            }
            
            if (this.debugMode) {
                logger.info('Robust QR Scanner: No QR codes found with any approach');
            }
            
            return null;
            
        } catch (error) {
            logger.error('Robust QR Scanner: QR detection error:', error);
            return null;
        }
    }
    
    processQRResult(code) {
        // Try to parse as JSON
        let parsedData = null;
        try {
            parsedData = JSON.parse(code.data);
            logger.info('Robust QR Scanner: Parsed JSON data:', parsedData);
        } catch (parseError) {
            logger.info('Robust QR Scanner: QR data is not JSON, using raw data');
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
    
    convertToGrayscale(imageData) {
        const grayscaleData = new Uint8ClampedArray(imageData.width * imageData.height);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grayscaleData[i / 4] = gray;
        }
        
        return grayscaleData;
    }
    
    getScanStats() {
        return {
            isInitialized: this.isInitialized,
            lastScanTime: this.lastScanTime,
            scanCooldown: this.scanCooldown,
            debugMode: this.debugMode
        };
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
        logger.info('Robust QR Scanner: Debug mode', enabled ? 'enabled' : 'disabled');
    }
}

// Create and export singleton instance
export const robustQRScanner = new RobustQRScanner();

// Export for global access
window.robustQRScanner = robustQRScanner; 