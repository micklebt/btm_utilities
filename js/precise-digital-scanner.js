/**
 * Precise Digital Counter Scanner
 * Focused on accurate digital display reading with better OCR settings
 */

export class PreciseDigitalScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        
        // Optimized OCR settings for digital displays
        this.digitalOCRConfig = {
            lang: 'eng',
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: '8', // Single word
            tessedit_ocr_engine_mode: '3', // Default
            preserve_interword_spaces: '0',
            textord_heavy_nr: '1', // More aggressive noise removal
            textord_min_linesize: '2.5',
            textord_noise_debug: '0',
            textord_noise_removal: '1',
            textord_noise_sizelimit: '7',
            textord_noise_snmin: '0.375',
            textord_noise_sp: '1',
            textord_noise_tab: '1',
            textord_noise_uq: '1',
            textord_noise_zones: '1',
            textord_noise_zonesize: '38',
            textord_noise_zonesize2: '19',
            textord_noise_zonesize3: '9',
            textord_noise_zonesize4: '4',
            textord_noise_zonesize5: '2',
            textord_noise_zonesize6: '1',
            textord_noise_zonesize7: '0',
            textord_noise_zonesize8: '0',
            textord_noise_zonesize9: '0',
            textord_noise_zonesize10: '0',
            textord_noise_zonesize11: '0',
            textord_noise_zonesize12: '0',
            textord_noise_zonesize13: '0',
            textord_noise_zonesize14: '0',
            textord_noise_zonesize15: '0',
            textord_noise_zonesize16: '0',
            textord_noise_zonesize17: '0',
            textord_noise_zonesize18: '0',
            textord_noise_zonesize19: '0',
            textord_noise_zonesize20: '0',
            textord_noise_zonesize21: '0',
            textord_noise_zonesize22: '0',
            textord_noise_zonesize23: '0',
            textord_noise_zonesize24: '0',
            textord_noise_zonesize25: '0',
            textord_noise_zonesize26: '0',
            textord_noise_zonesize27: '0',
            textord_noise_zonesize28: '0',
            textord_noise_zonesize29: '0',
            textord_noise_zonesize30: '0',
            textord_noise_zonesize31: '0',
            textord_noise_zonesize32: '0',
            textord_noise_zonesize33: '0',
            textord_noise_zonesize34: '0',
            textord_noise_zonesize35: '0',
            textord_noise_zonesize36: '0',
            textord_noise_zonesize37: '0',
            textord_noise_zonesize38: '0',
            textord_noise_zonesize39: '0',
            textord_noise_zonesize40: '0',
            textord_noise_zonesize41: '0',
            textord_noise_zonesize42: '0',
            textord_noise_zonesize43: '0',
            textord_noise_zonesize44: '0',
            textord_noise_zonesize45: '0',
            textord_noise_zonesize46: '0',
            textord_noise_zonesize47: '0',
            textord_noise_zonesize48: '0',
            textord_noise_zonesize49: '0',
            textord_noise_zonesize50: '0',
            textord_noise_zonesize51: '0',
            textord_noise_zonesize52: '0',
            textord_noise_zonesize53: '0',
            textord_noise_zonesize54: '0',
            textord_noise_zonesize55: '0',
            textord_noise_zonesize56: '0',
            textord_noise_zonesize57: '0',
            textord_noise_zonesize58: '0',
            textord_noise_zonesize59: '0',
            textord_noise_zonesize60: '0',
            textord_noise_zonesize61: '0',
            textord_noise_zonesize62: '0',
            textord_noise_zonesize63: '0',
            textord_noise_zonesize64: '0',
            textord_noise_zonesize65: '0',
            textord_noise_zonesize66: '0',
            textord_noise_zonesize67: '0',
            textord_noise_zonesize68: '0',
            textord_noise_zonesize69: '0',
            textord_noise_zonesize70: '0',
            textord_noise_zonesize71: '0',
            textord_noise_zonesize72: '0',
            textord_noise_zonesize73: '0',
            textord_noise_zonesize74: '0',
            textord_noise_zonesize75: '0',
            textord_noise_zonesize76: '0',
            textord_noise_zonesize77: '0',
            textord_noise_zonesize78: '0',
            textord_noise_zonesize79: '0',
            textord_noise_zonesize80: '0',
            textord_noise_zonesize81: '0',
            textord_noise_zonesize82: '0',
            textord_noise_zonesize83: '0',
            textord_noise_zonesize84: '0',
            textord_noise_zonesize85: '0',
            textord_noise_zonesize86: '0',
            textord_noise_zonesize87: '0',
            textord_noise_zonesize88: '0',
            textord_noise_zonesize89: '0',
            textord_noise_zonesize90: '0',
            textord_noise_zonesize91: '0',
            textord_noise_zonesize92: '0',
            textord_noise_zonesize93: '0',
            textord_noise_zonesize94: '0',
            textord_noise_zonesize95: '0',
            textord_noise_zonesize96: '0',
            textord_noise_zonesize97: '0',
            textord_noise_zonesize98: '0',
            textord_noise_zonesize99: '0',
            textord_noise_zonesize100: '0'
        };
        
        // More precise scan regions - smaller, focused areas
        this.scanRegions = [
            // Center digital display area
            { x: 0.35, y: 0.35, width: 0.3, height: 0.3, name: 'center_display' },
            // Top digital display area
            { x: 0.25, y: 0.15, width: 0.5, height: 0.25, name: 'top_display' },
            // Bottom digital display area
            { x: 0.25, y: 0.6, width: 0.5, height: 0.25, name: 'bottom_display' },
            // Left side display
            { x: 0.1, y: 0.3, width: 0.25, height: 0.4, name: 'left_display' },
            // Right side display
            { x: 0.65, y: 0.3, width: 0.25, height: 0.4, name: 'right_display' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Precise Digital Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply optimized OCR settings
                for (const [key, value] of Object.entries(this.digitalOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Precise Digital Scanner: Initialized successfully');
            } else {
                console.warn('Precise Digital Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Precise Digital Scanner: Initialization failed', error);
        }
    }
    
    /**
     * Scan for digital counter values in image data
     */
    async scanDigitalCounter(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Precise Digital Scanner: OCR not available');
            return null;
        }
        
        try {
            console.log('Precise Digital Scanner: Starting precise scan...');
            const results = [];
            
            // Scan multiple regions
            for (const region of this.scanRegions) {
                console.log(`Precise Digital Scanner: Scanning region ${region.name}...`);
                
                // Extract region as canvas
                const regionCanvas = this.extractRegionCanvas(imageData, region);
                
                if (regionCanvas) {
                    console.log(`Precise Digital Scanner: Region ${region.name} extracted successfully`);
                    
                    // Use Tesseract's recognize method with canvas
                    const ocrResult = await this.ocrWorker.recognize(regionCanvas);
                    
                    console.log(`Precise Digital Scanner: OCR result for ${region.name}:`, ocrResult);
                    
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
                            console.log(`Precise Digital Scanner: Found value ${counterValue} in ${region.name}`);
                        }
                    }
                } else {
                    console.warn(`Precise Digital Scanner: Failed to extract region ${region.name}`);
                }
            }
            
            // Return best result (highest confidence)
            if (results.length > 0) {
                const bestResult = results.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                console.log('Precise Digital Scanner: Best result found', bestResult);
                return bestResult;
            }
            
            console.log('Precise Digital Scanner: No counter values found');
            return null;
        } catch (error) {
            console.error('Precise Digital Scanner: Scan error', error);
            return null;
        }
    }
    
    /**
     * Extract region from image data and return as canvas
     */
    extractRegionCanvas(imageData, region) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const x = Math.floor(region.x * imageData.width);
            const y = Math.floor(region.y * imageData.height);
            const width = Math.floor(region.width * imageData.width);
            const height = Math.floor(region.height * imageData.height);
            
            canvas.width = width;
            canvas.height = height;
            
            console.log(`Precise Digital Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
            
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
            
            // Put the region data back to the canvas
            ctx.putImageData(regionData, 0, 0);
            
            console.log(`Precise Digital Scanner: Region ${region.name} canvas created successfully`);
            return canvas;
            
        } catch (error) {
            console.error(`Precise Digital Scanner: Error extracting region ${region.name}:`, error);
            return null;
        }
    }
    
    /**
     * Extract digital counter value from OCR text with better validation
     */
    extractDigitalValue(text) {
        console.log(`Precise Digital Scanner: Processing OCR text: "${text}"`);
        
        // Clean the text - remove all non-numeric characters
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Precise Digital Scanner: Cleaned text: "${cleanText}"`);
        
        // Look for numeric patterns - prefer shorter, more likely counter values
        const numberMatch = cleanText.match(/\d+/);
        
        if (numberMatch) {
            const value = parseInt(numberMatch[0], 10);
            console.log(`Precise Digital Scanner: Extracted value: ${value}`);
            
            // More restrictive validation for counter values
            if (value >= 0 && value <= 9999) { // Most counters are 4 digits or less
                return value;
            } else if (value >= 10000 && value <= 99999) { // Allow 5 digits for some counters
                return value;
            }
        }
        
        console.log('Precise Digital Scanner: No valid counter value found');
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
                console.log('Precise Digital Scanner: Cleanup completed');
            } catch (error) {
                console.error('Precise Digital Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const preciseDigitalScanner = new PreciseDigitalScanner();

// Export for global access
window.preciseDigitalScanner = preciseDigitalScanner; 