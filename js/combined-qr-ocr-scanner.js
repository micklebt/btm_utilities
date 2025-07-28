/**
 * Combined QR + OCR Scanner
 * Detects QR codes AND reads digital counter values
 */

export class CombinedQROCRScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        this.frameBuffer = [];
        this.maxFrameBuffer = 3; // Average over 3 frames for stability
        
        // OCR settings optimized for digital displays
        this.digitalOCRConfig = {
            lang: 'eng',
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: '7', // Single uniform block of text
            tessedit_ocr_engine_mode: '3', // Default
            preserve_interword_spaces: '0',
            textord_heavy_nr: '1',
            textord_min_linesize: '2.0',
            textord_noise_debug: '0',
            textord_noise_removal: '1',
            textord_noise_sizelimit: '8',
            textord_noise_snmin: '0.3',
            textord_noise_sp: '1',
            textord_noise_tab: '1',
            textord_noise_uq: '1',
            textord_noise_zones: '1',
            textord_noise_zonesize: '40',
            textord_noise_zonesize2: '20',
            textord_noise_zonesize3: '10',
            textord_noise_zonesize4: '5',
            textord_noise_zonesize5: '2',
            textord_noise_zonesize6: '1',
            textord_noise_zonesize7: '0',
            textord_noise_zonesize8: '0',
            textord_noise_zonesize9: '0',
            textord_noise_zonesize10: '0'
        };
        
        // Scan regions for digital counter
        this.counterRegions = [
            // Primary target - where the 963373 display is located
            { x: 0.3, y: 0.2, width: 0.4, height: 0.3, name: 'primary_display' },
            // Full center area
            { x: 0.2, y: 0.15, width: 0.6, height: 0.4, name: 'full_center' },
            // Top area
            { x: 0.2, y: 0.1, width: 0.6, height: 0.3, name: 'top_area' },
            // Bottom area
            { x: 0.2, y: 0.5, width: 0.6, height: 0.3, name: 'bottom_area' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Combined QR+OCR Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply optimized OCR settings
                for (const [key, value] of Object.entries(this.digitalOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Combined QR+OCR Scanner: Initialized successfully');
            } else {
                console.warn('Combined QR+OCR Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Combined QR+OCR Scanner: Initialization failed', error);
        }
    }
    
    /**
     * Add frame to buffer for averaging
     */
    addFrameToBuffer(imageData) {
        this.frameBuffer.push(imageData);
        if (this.frameBuffer.length > this.maxFrameBuffer) {
            this.frameBuffer.shift(); // Remove oldest frame
        }
        console.log(`Combined QR+OCR Scanner: Frame buffer size: ${this.frameBuffer.length}`);
    }
    
    /**
     * Scan for both QR codes and digital counter values
     */
    async scanCombined(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Combined QR+OCR Scanner: OCR not available');
            return null;
        }
        
        // Add current frame to buffer
        this.addFrameToBuffer(imageData);
        
        try {
            console.log('Combined QR+OCR Scanner: Starting combined scan...');
            
            const results = {
                qrCode: null,
                counterValue: null,
                timestamp: Date.now()
            };
            
            // Step 1: Detect QR Code
            console.log('Combined QR+OCR Scanner: Detecting QR code...');
            const qrResult = await this.detectQRCode(imageData);
            if (qrResult) {
                results.qrCode = qrResult;
                console.log('Combined QR+OCR Scanner: QR code detected:', qrResult);
            } else {
                console.log('Combined QR+OCR Scanner: No QR code detected');
            }
            
            // Step 2: Read Digital Counter
            console.log('Combined QR+OCR Scanner: Reading digital counter...');
            const counterResult = await this.readDigitalCounter(imageData);
            if (counterResult) {
                results.counterValue = counterResult;
                console.log('Combined QR+OCR Scanner: Counter value detected:', counterResult);
            } else {
                console.log('Combined QR+OCR Scanner: No counter value detected');
            }
            
            // Return results if we found at least one
            if (results.qrCode || results.counterValue) {
                console.log('Combined QR+OCR Scanner: Combined results:', results);
                return results;
            }
            
            console.log('Combined QR+OCR Scanner: No results found');
            return null;
            
        } catch (error) {
            console.error('Combined QR+OCR Scanner: Scan error', error);
            return null;
        }
    }
    
    /**
     * Detect QR code in image data
     */
    async detectQRCode(imageData) {
        try {
            // Check if jsQR is available
            if (typeof jsQR === 'undefined') {
                console.warn('Combined QR+OCR Scanner: jsQR library not available');
                return null;
            }
            
            // Convert image data to format jsQR can process
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                console.log('Combined QR+OCR Scanner: QR code found:', code.data);
                return {
                    data: code.data,
                    location: code.location,
                    confidence: 100 // QR codes are typically 100% accurate
                };
            }
            
            return null;
        } catch (error) {
            console.error('Combined QR+OCR Scanner: QR detection error:', error);
            return null;
        }
    }
    
    /**
     * Read digital counter using OCR
     */
    async readDigitalCounter(imageData) {
        try {
            const allResults = [];
            
            // Scan each region
            for (const region of this.counterRegions) {
                console.log(`Combined QR+OCR Scanner: Scanning counter region ${region.name}...`);
                
                const regionResults = [];
                
                // Process each frame in buffer for stability
                for (let frameIndex = 0; frameIndex < this.frameBuffer.length; frameIndex++) {
                    const frameData = this.frameBuffer[frameIndex];
                    
                    // Extract region as canvas
                    const regionCanvas = this.extractRegionCanvas(frameData, region);
                    
                    if (regionCanvas) {
                        console.log(`Combined QR+OCR Scanner: Region ${region.name} extracted from frame ${frameIndex + 1}`);
                        
                        // Use Tesseract's recognize method with canvas
                        const ocrResult = await this.ocrWorker.recognize(regionCanvas);
                        
                        if (ocrResult && ocrResult.data && ocrResult.data.text) {
                            const counterValue = this.extractCounterValue(ocrResult.data.text);
                            if (counterValue !== null) {
                                regionResults.push({
                                    value: counterValue,
                                    confidence: ocrResult.data.confidence,
                                    region: region.name,
                                    rawText: ocrResult.data.text,
                                    frameIndex: frameIndex
                                });
                                console.log(`Combined QR+OCR Scanner: Found value ${counterValue} in ${region.name} (frame ${frameIndex + 1})`);
                            }
                        }
                    }
                }
                
                // If we found results for this region, add the best one
                if (regionResults.length > 0) {
                    const bestRegionResult = regionResults.reduce((best, current) => 
                        current.confidence > best.confidence ? current : best
                    );
                    allResults.push(bestRegionResult);
                }
            }
            
            // Find the most stable result
            if (allResults.length > 0) {
                const stableResult = this.findMostStableResult(allResults);
                console.log('Combined QR+OCR Scanner: Most stable counter result:', stableResult);
                return stableResult;
            }
            
            return null;
        } catch (error) {
            console.error('Combined QR+OCR Scanner: Counter reading error:', error);
            return null;
        }
    }
    
    /**
     * Find the most stable result from multiple readings
     */
    findMostStableResult(results) {
        // Group results by value
        const valueGroups = {};
        results.forEach(result => {
            if (!valueGroups[result.value]) {
                valueGroups[result.value] = [];
            }
            valueGroups[result.value].push(result);
        });
        
        console.log('Combined QR+OCR Scanner: Value groups:', valueGroups);
        
        // Find the most frequently detected value
        let mostStableValue = null;
        let maxOccurrences = 0;
        let maxConfidence = 0;
        
        for (const [value, occurrences] of Object.entries(valueGroups)) {
            const numOccurrences = occurrences.length;
            const avgConfidence = occurrences.reduce((sum, r) => sum + r.confidence, 0) / numOccurrences;
            
            console.log(`Combined QR+OCR Scanner: Value ${value}: ${numOccurrences} occurrences, avg confidence ${avgConfidence.toFixed(1)}%`);
            
            if (numOccurrences > maxOccurrences || (numOccurrences === maxOccurrences && avgConfidence > maxConfidence)) {
                maxOccurrences = numOccurrences;
                maxConfidence = avgConfidence;
                mostStableValue = value;
            }
        }
        
        if (mostStableValue && maxOccurrences >= 2) { // Require at least 2 detections
            const bestResult = valueGroups[mostStableValue].reduce((best, current) => 
                current.confidence > best.confidence ? current : best
            );
            
            // Add stability info
            bestResult.stability = {
                occurrences: maxOccurrences,
                avgConfidence: maxConfidence,
                totalFrames: this.frameBuffer.length
            };
            
            return bestResult;
        }
        
        return null;
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
            
            console.log(`Combined QR+OCR Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
            
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
            
            console.log(`Combined QR+OCR Scanner: Region ${region.name} canvas created successfully`);
            return canvas;
            
        } catch (error) {
            console.error(`Combined QR+OCR Scanner: Error extracting region ${region.name}:`, error);
            return null;
        }
    }
    
    /**
     * Extract counter value from OCR text with focus on 6-digit numbers like 963373
     */
    extractCounterValue(text) {
        console.log(`Combined QR+OCR Scanner: Processing OCR text: "${text}"`);
        
        // Clean the text - remove all non-numeric characters
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Combined QR+OCR Scanner: Cleaned text: "${cleanText}"`);
        
        // Look for numeric patterns - prefer 6-digit numbers
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
            
            console.log(`Combined QR+OCR Scanner: Found numbers:`, sortedNumbers);
            
            // Return the longest number (most likely to be the full counter)
            const bestNumber = sortedNumbers[0];
            console.log(`Combined QR+OCR Scanner: Selected best number: ${bestNumber}`);
            
            // Validation for counter values (allow 4-7 digits)
            if (bestNumber >= 1000 && bestNumber <= 9999999) {
                return bestNumber;
            }
        }
        
        console.log('Combined QR+OCR Scanner: No valid counter value found');
        return null;
    }
    
    /**
     * Get scan statistics
     */
    getScanStats() {
        return {
            frameBufferSize: this.frameBuffer.length,
            maxFrameBuffer: this.maxFrameBuffer,
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * Clear frame buffer
     */
    clearFrameBuffer() {
        this.frameBuffer = [];
        console.log('Combined QR+OCR Scanner: Frame buffer cleared');
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
                this.frameBuffer = [];
                console.log('Combined QR+OCR Scanner: Cleanup completed');
            } catch (error) {
                console.error('Combined QR+OCR Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const combinedQROCRScanner = new CombinedQROCRScanner();

// Export for global access
window.combinedQROCRScanner = combinedQROCRScanner; 