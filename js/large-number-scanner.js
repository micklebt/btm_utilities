/**
 * Large Number Scanner
 * Specialized for reading large counter values like 963373
 */

export class LargeNumberScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        
        // OCR settings optimized for large numbers
        this.largeNumberOCRConfig = {
            lang: 'eng',
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: '7', // Single uniform block of text
            tessedit_ocr_engine_mode: '3', // Default
            preserve_interword_spaces: '0',
            textord_heavy_nr: '1',
            textord_min_linesize: '1.5',
            textord_noise_debug: '0',
            textord_noise_removal: '1',
            textord_noise_sizelimit: '10',
            textord_noise_snmin: '0.25',
            textord_noise_sp: '1',
            textord_noise_tab: '1',
            textord_noise_uq: '1',
            textord_noise_zones: '1',
            textord_noise_zonesize: '50',
            textord_noise_zonesize2: '25',
            textord_noise_zonesize3: '12',
            textord_noise_zonesize4: '6',
            textord_noise_zonesize5: '3',
            textord_noise_zonesize6: '1',
            textord_noise_zonesize7: '0',
            textord_noise_zonesize8: '0',
            textord_noise_zonesize9: '0',
            textord_noise_zonesize10: '0'
        };
        
        // Larger scan regions to capture full numbers
        this.scanRegions = [
            // Full width center region
            { x: 0.1, y: 0.25, width: 0.8, height: 0.5, name: 'full_center' },
            // Top half
            { x: 0.1, y: 0.1, width: 0.8, height: 0.4, name: 'top_half' },
            // Bottom half
            { x: 0.1, y: 0.5, width: 0.8, height: 0.4, name: 'bottom_half' },
            // Left side
            { x: 0.05, y: 0.2, width: 0.45, height: 0.6, name: 'left_side' },
            // Right side
            { x: 0.5, y: 0.2, width: 0.45, height: 0.6, name: 'right_side' },
            // Very large region
            { x: 0.05, y: 0.1, width: 0.9, height: 0.8, name: 'very_large' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Large Number Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply optimized OCR settings for large numbers
                for (const [key, value] of Object.entries(this.largeNumberOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Large Number Scanner: Initialized successfully');
            } else {
                console.warn('Large Number Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Large Number Scanner: Initialization failed', error);
        }
    }
    
    /**
     * Scan for large counter values in image data
     */
    async scanLargeNumber(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Large Number Scanner: OCR not available');
            return null;
        }
        
        try {
            console.log('Large Number Scanner: Starting large number scan...');
            const results = [];
            
            // Scan multiple regions
            for (const region of this.scanRegions) {
                console.log(`Large Number Scanner: Scanning region ${region.name}...`);
                
                // Extract region as canvas
                const regionCanvas = this.extractRegionCanvas(imageData, region);
                
                if (regionCanvas) {
                    console.log(`Large Number Scanner: Region ${region.name} extracted successfully`);
                    
                    // Use Tesseract's recognize method with canvas
                    const ocrResult = await this.ocrWorker.recognize(regionCanvas);
                    
                    console.log(`Large Number Scanner: OCR result for ${region.name}:`, ocrResult);
                    
                    if (ocrResult && ocrResult.data && ocrResult.data.text) {
                        const largeNumber = this.extractLargeNumber(ocrResult.data.text);
                        if (largeNumber !== null) {
                            results.push({
                                value: largeNumber,
                                confidence: ocrResult.data.confidence,
                                region: region.name,
                                rawText: ocrResult.data.text,
                                timestamp: Date.now()
                            });
                            console.log(`Large Number Scanner: Found value ${largeNumber} in ${region.name}`);
                        }
                    }
                } else {
                    console.warn(`Large Number Scanner: Failed to extract region ${region.name}`);
                }
            }
            
            // Return best result (highest confidence)
            if (results.length > 0) {
                const bestResult = results.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                console.log('Large Number Scanner: Best result found', bestResult);
                return bestResult;
            }
            
            console.log('Large Number Scanner: No large numbers found');
            return null;
        } catch (error) {
            console.error('Large Number Scanner: Scan error', error);
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
            
            console.log(`Large Number Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
            
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
            
            console.log(`Large Number Scanner: Region ${region.name} canvas created successfully`);
            return canvas;
            
        } catch (error) {
            console.error(`Large Number Scanner: Error extracting region ${region.name}:`, error);
            return null;
        }
    }
    
    /**
     * Extract large number from OCR text with better validation for 6+ digit numbers
     */
    extractLargeNumber(text) {
        console.log(`Large Number Scanner: Processing OCR text: "${text}"`);
        
        // Clean the text - remove all non-numeric characters
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Large Number Scanner: Cleaned text: "${cleanText}"`);
        
        // Look for numeric patterns - prefer longer numbers (6+ digits)
        const numberMatches = cleanText.match(/\d+/g);
        
        if (numberMatches && numberMatches.length > 0) {
            // Sort by length (longest first) and then by value
            const sortedNumbers = numberMatches
                .map(num => parseInt(num, 10))
                .sort((a, b) => {
                    // First sort by number of digits (descending)
                    const aDigits = a.toString().length;
                    const bDigits = b.toString().length;
                    if (aDigits !== bDigits) {
                        return bDigits - aDigits;
                    }
                    // Then by value (descending)
                    return b - a;
                });
            
            console.log(`Large Number Scanner: Found numbers:`, sortedNumbers);
            
            // Return the longest number (most likely to be the full counter)
            const bestNumber = sortedNumbers[0];
            console.log(`Large Number Scanner: Selected best number: ${bestNumber}`);
            
            // More permissive validation for large numbers
            if (bestNumber >= 0 && bestNumber <= 9999999) { // Allow up to 7 digits
                return bestNumber;
            }
        }
        
        console.log('Large Number Scanner: No valid large number found');
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
                console.log('Large Number Scanner: Cleanup completed');
            } catch (error) {
                console.error('Large Number Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const largeNumberScanner = new LargeNumberScanner();

// Export for global access
window.largeNumberScanner = largeNumberScanner; 