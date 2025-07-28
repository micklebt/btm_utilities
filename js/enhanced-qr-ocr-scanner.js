/**
 * Enhanced QR + OCR Scanner Module
 * Combines QR code scanning with OCR for counter value reading
 * Implements both QR code recognition and computer vision counter reading
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { qrDataParser } from './qr-data-parser.js';
import { generateId, formatDate, debounce, playSuccessBeep, playErrorBeep } from './utils.js';

/**
 * Enhanced Scanner Class
 * Handles both QR code scanning and OCR counter reading
 */
export class EnhancedQRScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isScanning = false;
        this.scanInterval = null;
        this.ocrWorker = null;
        this.lastScanTime = 0;
        this.scanCooldown = 2000; // 2 seconds between scans
        
        // OCR Configuration
        this.ocrConfig = {
            lang: 'eng',
            tessedit_char_whitelist: '0123456789',
            preserve_interword_spaces: '1'
        };
        
        // Counter display regions (can be adjusted based on image analysis)
        this.counterRegions = [
            { x: 0.1, y: 0.1, width: 0.8, height: 0.3 }, // Top region
            { x: 0.1, y: 0.7, width: 0.8, height: 0.2 }  // Bottom region
        ];
        
        this.initializeOCR();
    }

    /**
     * Initialize OCR capabilities
     */
    async initializeOCR() {
        try {
            // Check if Tesseract is available
            if (typeof Tesseract !== 'undefined') {
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                await this.ocrWorker.setParameters(this.ocrConfig);
                logger.info('Enhanced Scanner: OCR initialized successfully');
            } else {
                logger.warn('Enhanced Scanner: Tesseract not available, OCR disabled');
            }
        } catch (error) {
            logger.error('Enhanced Scanner: Failed to initialize OCR', error);
            errorHandler.handleError('OCR_INIT_ERROR', error);
        }
    }

    /**
     * Start enhanced scanning (QR + OCR)
     */
    async startScanning(videoElement, canvasElement) {
        try {
            this.video = videoElement;
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
            
            if (!this.video || !this.canvas) {
                throw new Error('Video and canvas elements required');
            }

            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            this.isScanning = true;
            this.scanInterval = setInterval(() => {
                this.performEnhancedScan();
            }, 100); // Scan every 100ms

            logger.info('Enhanced Scanner: Scanning started');
            return true;
        } catch (error) {
            logger.error('Enhanced Scanner: Failed to start scanning', error);
            errorHandler.handleError('SCAN_START_ERROR', error);
            return false;
        }
    }

    /**
     * Stop enhanced scanning
     */
    stopScanning() {
        this.isScanning = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        logger.info('Enhanced Scanner: Scanning stopped');
    }

    /**
     * Perform enhanced scan (QR + OCR)
     */
    async performEnhancedScan() {
        if (!this.isScanning || !this.video || !this.canvas) return;

        try {
            // Draw current video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data for processing
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Perform QR code detection
            const qrResult = await this.detectQRCode(imageData);
            
            if (qrResult) {
                // QR code found, now try OCR for counter
                const ocrResult = await this.performOCR(imageData);
                
                // Combine results
                const combinedResult = this.combineResults(qrResult, ocrResult);
                
                if (combinedResult) {
                    this.handleEnhancedResult(combinedResult);
                }
            }
        } catch (error) {
            logger.error('Enhanced Scanner: Scan error', error);
        }
    }

    /**
     * Detect QR code in image data
     */
    async detectQRCode(imageData) {
        try {
            if (typeof jsQR === 'undefined') {
                logger.warn('Enhanced Scanner: jsQR library not available');
                return null;
            }

            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                logger.info('Enhanced Scanner: QR code detected', { data: code.data });
                return {
                    type: 'qr',
                    data: code.data,
                    timestamp: Date.now()
                };
            }
            
            return null;
        } catch (error) {
            logger.error('Enhanced Scanner: QR detection error', error);
            return null;
        }
    }

    /**
     * Perform OCR on image data to read counter values
     */
    async performOCR(imageData) {
        if (!this.ocrWorker) {
            logger.warn('Enhanced Scanner: OCR not available');
            return null;
        }

        try {
            const results = [];
            
            // Process multiple regions for counter detection
            for (const region of this.counterRegions) {
                const regionData = this.extractRegion(imageData, region);
                const ocrResult = await this.ocrWorker.recognize(regionData);
                
                if (ocrResult && ocrResult.data && ocrResult.data.text) {
                    const counterValue = this.extractCounterValue(ocrResult.data.text);
                    if (counterValue !== null) {
                        results.push({
                            type: 'ocr',
                            value: counterValue,
                            confidence: ocrResult.data.confidence,
                            region: region,
                            timestamp: Date.now()
                        });
                    }
                }
            }
            
            return results.length > 0 ? results : null;
        } catch (error) {
            logger.error('Enhanced Scanner: OCR error', error);
            return null;
        }
    }

    /**
     * Extract a specific region from image data
     */
    extractRegion(imageData, region) {
        const x = Math.floor(region.x * imageData.width);
        const y = Math.floor(region.y * imageData.height);
        const width = Math.floor(region.width * imageData.width);
        const height = Math.floor(region.height * imageData.height);
        
        const regionData = this.ctx.createImageData(width, height);
        
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const sourceIndex = ((y + i) * imageData.width + (x + j)) * 4;
                const targetIndex = (i * width + j) * 4;
                
                regionData.data[targetIndex] = imageData.data[sourceIndex];     // R
                regionData.data[targetIndex + 1] = imageData.data[sourceIndex + 1]; // G
                regionData.data[targetIndex + 2] = imageData.data[sourceIndex + 2]; // B
                regionData.data[targetIndex + 3] = imageData.data[sourceIndex + 3]; // A
            }
        }
        
        return regionData;
    }

    /**
     * Extract counter value from OCR text
     */
    extractCounterValue(text) {
        // Clean the text
        const cleanText = text.replace(/[^\d]/g, '');
        
        // Look for numeric patterns
        const numberMatch = cleanText.match(/\d+/);
        
        if (numberMatch) {
            const value = parseInt(numberMatch[0], 10);
            if (value >= 0 && value <= 999999) { // Reasonable range for counter
                return value;
            }
        }
        
        return null;
    }

    /**
     * Combine QR and OCR results
     */
    combineResults(qrResult, ocrResults) {
        if (!qrResult) return null;
        
        try {
            // Parse QR data
            const parsedQR = qrDataParser.parseQRData(qrResult.data);
            
            if (!qrDataParser.validateParsedData(parsedQR)) {
                logger.warn('Enhanced Scanner: Invalid QR data', qrResult.data);
                return null;
            }
            
            // Get best OCR result (highest confidence)
            let bestOCRResult = null;
            if (ocrResults && ocrResults.length > 0) {
                bestOCRResult = ocrResults.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
            }
            
            // Create combined result
            const combinedResult = {
                qrData: parsedQR,
                ocrData: bestOCRResult,
                timestamp: Date.now(),
                scanId: generateId()
            };
            
            // Use OCR counter value if available, otherwise use QR counter
            if (bestOCRResult) {
                combinedResult.counterValue = bestOCRResult.value;
                combinedResult.counterSource = 'ocr';
                combinedResult.confidence = bestOCRResult.confidence;
            } else {
                combinedResult.counterValue = parsedQR.counterValue;
                combinedResult.counterSource = 'qr';
                combinedResult.confidence = 100; // QR data is reliable
            }
            
            return combinedResult;
        } catch (error) {
            logger.error('Enhanced Scanner: Error combining results', error);
            return null;
        }
    }

    /**
     * Handle enhanced scan result
     */
    handleEnhancedResult(result) {
        // Check cooldown to prevent duplicate scans
        const now = Date.now();
        if (now - this.lastScanTime < this.scanCooldown) {
            return;
        }
        
        this.lastScanTime = now;
        
        // Play success sound
        playSuccessBeep();
        
        // Log the result
        logger.info('Enhanced Scanner: Combined result', {
            location: result.qrData.locationName,
            machine: qrDataParser.getMachineDisplayName(result.qrData),
            counterValue: result.counterValue,
            counterSource: result.counterSource,
            confidence: result.confidence,
            scanId: result.scanId
        });
        
        // Emit custom event for other modules to listen
        const event = new CustomEvent('enhancedScanResult', {
            detail: result
        });
        window.dispatchEvent(event);
        
        // Store result
        this.storeScanResult(result);
    }

    /**
     * Store scan result
     */
    async storeScanResult(result) {
        try {
            const scanData = {
                id: result.scanId,
                timestamp: result.timestamp,
                location: result.qrData.locationName,
                machine: qrDataParser.getMachineDisplayName(result.qrData),
                machineId: result.qrData.machineId,
                counterValue: result.counterValue,
                counterSource: result.counterSource,
                confidence: result.confidence,
                dollarAmount: result.qrData.dollarAmount,
                rawQRData: result.qrData.rawData,
                ocrData: result.ocrData
            };
            
            // Store in local storage
            const existingScans = JSON.parse(localStorage.getItem('btm_scan_history') || '[]');
            existingScans.unshift(scanData);
            
            // Keep only last 100 scans
            if (existingScans.length > 100) {
                existingScans.splice(100);
            }
            
            localStorage.setItem('btm_scan_history', JSON.stringify(existingScans));
            
            logger.info('Enhanced Scanner: Result stored', scanData);
        } catch (error) {
            logger.error('Enhanced Scanner: Failed to store result', error);
            errorHandler.handleError('SCAN_STORE_ERROR', error);
        }
    }

    /**
     * Get scan history
     */
    getScanHistory() {
        try {
            return JSON.parse(localStorage.getItem('btm_scan_history') || '[]');
        } catch (error) {
            logger.error('Enhanced Scanner: Failed to get scan history', error);
            return [];
        }
    }

    /**
     * Clear scan history
     */
    clearScanHistory() {
        try {
            localStorage.removeItem('btm_scan_history');
            logger.info('Enhanced Scanner: Scan history cleared');
        } catch (error) {
            logger.error('Enhanced Scanner: Failed to clear scan history', error);
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.stopScanning();
        
        if (this.ocrWorker) {
            try {
                await this.ocrWorker.terminate();
                this.ocrWorker = null;
            } catch (error) {
                logger.error('Enhanced Scanner: Failed to cleanup OCR worker', error);
            }
        }
        
        logger.info('Enhanced Scanner: Cleanup completed');
    }
}

// Create and export singleton instance
export const enhancedScanner = new EnhancedQRScanner();

// Export for global access
window.enhancedScanner = enhancedScanner; 