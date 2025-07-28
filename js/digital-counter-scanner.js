/**
 * Digital Counter Scanner
 * Specialized OCR scanner for reading digital counter displays
 */

import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';

export class DigitalCounterScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        
        // Optimized OCR settings for digital displays
        this.digitalOCRConfig = {
            lang: 'eng',
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: '7', // Single uniform block of text
            tessedit_ocr_engine_mode: '3', // Default, based on what is available
            preserve_interword_spaces: '1',
            textord_heavy_nr: '1', // More aggressive noise removal
            textord_min_linesize: '2.5', // Minimum line size
            textord_old_baselines: '0', // Use new baseline detection
            textord_noise_debug: '0',
            textord_noise_removal: '1', // Enable noise removal
            textord_noise_sizelimit: '7', // Size limit for noise removal
            textord_noise_snmin: '0.375', // Minimum signal-to-noise ratio
            textord_noise_sp: '1', // Enable noise removal for single pixels
            textord_noise_tab: '1', // Enable noise removal for tab characters
            textord_noise_uq: '1', // Enable noise removal for unknown characters
            textord_noise_zones: '1', // Enable noise removal for zones
            textord_noise_zonesize: '38', // Size of noise zones
            textord_noise_zonesize2: '19', // Secondary size of noise zones
            textord_noise_zonesize3: '9', // Tertiary size of noise zones
            textord_noise_zonesize4: '4', // Quaternary size of noise zones
            textord_noise_zonesize5: '2', // Quinary size of noise zones
            textord_noise_zonesize6: '1', // Senary size of noise zones
            textord_noise_zonesize7: '0', // Septenary size of noise zones
            textord_noise_zonesize8: '0', // Octenary size of noise zones
            textord_noise_zonesize9: '0', // Nonary size of noise zones
            textord_noise_zonesize10: '0', // Denary size of noise zones
            textord_noise_zonesize11: '0', // Undenary size of noise zones
            textord_noise_zonesize12: '0', // Duodenary size of noise zones
            textord_noise_zonesize13: '0', // Tridecenary size of noise zones
            textord_noise_zonesize14: '0', // Tetradecenary size of noise zones
            textord_noise_zonesize15: '0', // Pentadecenary size of noise zones
            textord_noise_zonesize16: '0', // Hexadecenary size of noise zones
            textord_noise_zonesize17: '0', // Heptadecenary size of noise zones
            textord_noise_zonesize18: '0', // Octadecenary size of noise zones
            textord_noise_zonesize19: '0', // Nonadecenary size of noise zones
            textord_noise_zonesize20: '0', // Vigintenary size of noise zones
            textord_noise_zonesize21: '0', // Unvigintenary size of noise zones
            textord_noise_zonesize22: '0', // Duovigintenary size of noise zones
            textord_noise_zonesize23: '0', // Trivigintenary size of noise zones
            textord_noise_zonesize24: '0', // Tetravigintenary size of noise zones
            textord_noise_zonesize25: '0', // Pentavigintenary size of noise zones
            textord_noise_zonesize26: '0', // Hexavigintenary size of noise zones
            textord_noise_zonesize27: '0', // Heptavigintenary size of noise zones
            textord_noise_zonesize28: '0', // Octavigintenary size of noise zones
            textord_noise_zonesize29: '0', // Nonavigintenary size of noise zones
            textord_noise_zonesize30: '0', // Trigenary size of noise zones
            textord_noise_zonesize31: '0', // Untrigenary size of noise zones
            textord_noise_zonesize32: '0', // Duotrigenary size of noise zones
            textord_noise_zonesize33: '0', // Tritrigenary size of noise zones
            textord_noise_zonesize34: '0', // Tetratrigenary size of noise zones
            textord_noise_zonesize35: '0', // Pentatrigenary size of noise zones
            textord_noise_zonesize36: '0', // Hexatrigenary size of noise zones
            textord_noise_zonesize37: '0', // Heptatrigenary size of noise zones
            textord_noise_zonesize38: '0', // Octatrigenary size of noise zones
            textord_noise_zonesize39: '0', // Nonatrigenary size of noise zones
            textord_noise_zonesize40: '0', // Quadragenary size of noise zones
            textord_noise_zonesize41: '0', // Unquadragenary size of noise zones
            textord_noise_zonesize42: '0', // Duoquadragenary size of noise zones
            textord_noise_zonesize43: '0', // Triquadragenary size of noise zones
            textord_noise_zonesize44: '0', // Tetraquadragenary size of noise zones
            textord_noise_zonesize45: '0', // Pentaquadragenary size of noise zones
            textord_noise_zonesize46: '0', // Hexaquadragenary size of noise zones
            textord_noise_zonesize47: '0', // Heptaquadragenary size of noise zones
            textord_noise_zonesize48: '0', // Octaquadragenary size of noise zones
            textord_noise_zonesize49: '0', // Nonaquadragenary size of noise zones
            textord_noise_zonesize50: '0', // Quinquagenary size of noise zones
            textord_noise_zonesize51: '0', // Unquinquagenary size of noise zones
            textord_noise_zonesize52: '0', // Duoquinquagenary size of noise zones
            textord_noise_zonesize53: '0', // Triquinquagenary size of noise zones
            textord_noise_zonesize54: '0', // Tetraquinquagenary size of noise zones
            textord_noise_zonesize55: '0', // Pentaquinquagenary size of noise zones
            textord_noise_zonesize56: '0', // Hexaquinquagenary size of noise zones
            textord_noise_zonesize57: '0', // Heptaquinquagenary size of noise zones
            textord_noise_zonesize58: '0', // Octaquinquagenary size of noise zones
            textord_noise_zonesize59: '0', // Nonaquinquagenary size of noise zones
            textord_noise_zonesize60: '0', // Sexagenary size of noise zones
            textord_noise_zonesize61: '0', // Unsexagenary size of noise zones
            textord_noise_zonesize62: '0', // Duosexagenary size of noise zones
            textord_noise_zonesize63: '0', // Trisexagenary size of noise zones
            textord_noise_zonesize64: '0', // Tetrasexagenary size of noise zones
            textord_noise_zonesize65: '0', // Pentasexagenary size of noise zones
            textord_noise_zonesize66: '0', // Hexasexagenary size of noise zones
            textord_noise_zonesize67: '0', // Heptasexagenary size of noise zones
            textord_noise_zonesize68: '0', // Octasexagenary size of noise zones
            textord_noise_zonesize69: '0', // Nonasexagenary size of noise zones
            textord_noise_zonesize70: '0', // Septuagenary size of noise zones
            textord_noise_zonesize71: '0', // Unseptuagenary size of noise zones
            textord_noise_zonesize72: '0', // Duoseptuagenary size of noise zones
            textord_noise_zonesize73: '0', // Triseptuagenary size of noise zones
            textord_noise_zonesize74: '0', // Tetraseptuagenary size of noise zones
            textord_noise_zonesize75: '0', // Pentaseptuagenary size of noise zones
            textord_noise_zonesize76: '0', // Hexaseptuagenary size of noise zones
            textord_noise_zonesize77: '0', // Heptaseptuagenary size of noise zones
            textord_noise_zonesize78: '0', // Octaseptuagenary size of noise zones
            textord_noise_zonesize79: '0', // Nonaseptuagenary size of noise zones
            textord_noise_zonesize80: '0', // Octogenary size of noise zones
            textord_noise_zonesize81: '0', // Unoctogenary size of noise zones
            textord_noise_zonesize82: '0', // Duooctogenary size of noise zones
            textord_noise_zonesize83: '0', // Trioctogenary size of noise zones
            textord_noise_zonesize84: '0', // Tetraoctogenary size of noise zones
            textord_noise_zonesize85: '0', // Pentaoctogenary size of noise zones
            textord_noise_zonesize86: '0', // Hexaoctogenary size of noise zones
            textord_noise_zonesize87: '0', // Heptaoctogenary size of noise zones
            textord_noise_zonesize88: '0', // Octaoctogenary size of noise zones
            textord_noise_zonesize89: '0', // Nonaoctogenary size of noise zones
            textord_noise_zonesize90: '0', // Nonagenary size of noise zones
            textord_noise_zonesize91: '0', // Unnonagenary size of noise zones
            textord_noise_zonesize92: '0', // Duononagenary size of noise zones
            textord_noise_zonesize93: '0', // Trinnonagenary size of noise zones
            textord_noise_zonesize94: '0', // Tetranonagenary size of noise zones
            textord_noise_zonesize95: '0', // Pentanonagenary size of noise zones
            textord_noise_zonesize96: '0', // Hexanonagenary size of noise zones
            textord_noise_zonesize97: '0', // Heptanonagenary size of noise zones
            textord_noise_zonesize98: '0', // Octanonagenary size of noise zones
            textord_noise_zonesize99: '0', // Nonanonagenary size of noise zones
            textord_noise_zonesize100: '0' // Centenary size of noise zones
        };
        
        // Multiple scan regions for digital displays
        this.digitalRegions = [
            // Center region (most common for digital displays)
            { x: 0.2, y: 0.3, width: 0.6, height: 0.4, name: 'center' },
            // Top region
            { x: 0.1, y: 0.1, width: 0.8, height: 0.3, name: 'top' },
            // Bottom region
            { x: 0.1, y: 0.6, width: 0.8, height: 0.3, name: 'bottom' },
            // Left region
            { x: 0.05, y: 0.2, width: 0.4, height: 0.6, name: 'left' },
            // Right region
            { x: 0.55, y: 0.2, width: 0.4, height: 0.6, name: 'right' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply digital-specific OCR settings
                for (const [key, value] of Object.entries(this.digitalOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                logger.info('Digital Counter Scanner: Initialized successfully');
            } else {
                logger.warn('Digital Counter Scanner: Tesseract not available');
            }
        } catch (error) {
            logger.error('Digital Counter Scanner: Initialization failed', error);
            errorHandler.handleError('DIGITAL_OCR_INIT_ERROR', error);
        }
    }
    
    /**
     * Scan for digital counter values in image data
     */
    async scanDigitalCounter(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            logger.warn('Digital Counter Scanner: OCR not available');
            return null;
        }
        
        try {
            const results = [];
            
            // Scan multiple regions
            for (const region of this.digitalRegions) {
                const regionData = this.extractRegion(imageData, region);
                const ocrResult = await this.ocrWorker.recognize(regionData);
                
                if (ocrResult && ocrResult.data && ocrResult.data.text) {
                    const counterValue = this.extractDigitalValue(ocrResult.data.text);
                    if (counterValue !== null) {
                        results.push({
                            value: counterValue,
                            confidence: ocrResult.data.confidence,
                            region: region.name,
                            rawText: ocrResult.data.text,
                            timestamp: Date.now()
                        });
                    }
                }
            }
            
            // Return best result (highest confidence)
            if (results.length > 0) {
                const bestResult = results.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                logger.info('Digital Counter Scanner: Found counter value', bestResult);
                return bestResult;
            }
            
            return null;
        } catch (error) {
            logger.error('Digital Counter Scanner: Scan error', error);
            return null;
        }
    }
    
    /**
     * Extract region from image data
     */
    extractRegion(imageData, region) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const x = Math.floor(region.x * imageData.width);
        const y = Math.floor(region.y * imageData.height);
        const width = Math.floor(region.width * imageData.width);
        const height = Math.floor(region.height * imageData.height);
        
        canvas.width = width;
        canvas.height = height;
        
        // Create new image data for the region
        const regionData = ctx.createImageData(width, height);
        
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
     * Extract digital counter value from OCR text
     */
    extractDigitalValue(text) {
        // Clean the text - remove all non-numeric characters
        const cleanText = text.replace(/[^\d]/g, '');
        
        // Look for numeric patterns
        const numberMatch = cleanText.match(/\d+/);
        
        if (numberMatch) {
            const value = parseInt(numberMatch[0], 10);
            
            // Validate reasonable range for counter values
            if (value >= 0 && value <= 999999) {
                return value;
            }
        }
        
        return null;
    }
    
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.ocrWorker) {
            try {
                await this.ocrWorker.terminate();
                this.ocrWorker = null;
                this.isInitialized = false;
                logger.info('Digital Counter Scanner: Cleanup completed');
            } catch (error) {
                logger.error('Digital Counter Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const digitalCounterScanner = new DigitalCounterScanner();

// Export for global access
window.digitalCounterScanner = digitalCounterScanner; 