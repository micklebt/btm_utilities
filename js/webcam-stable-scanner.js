/**
 * Webcam Stable Scanner
 * Optimized for webcam use with image stabilization and frame averaging
 */

export class WebcamStableScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        this.frameBuffer = [];
        this.maxFrameBuffer = 5; // Average over 5 frames
        this.lastStableResult = null;
        this.resultHistory = [];
        this.maxHistory = 10;
        
        // OCR settings optimized for webcam and digital displays
        this.webcamOCRConfig = {
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
        
        // Multiple scan regions for better coverage
        this.scanRegions = [
            // Primary target - where the 963373 display is located
            { x: 0.3, y: 0.2, width: 0.4, height: 0.3, name: 'primary_display', weight: 3 },
            // Full center area
            { x: 0.2, y: 0.15, width: 0.6, height: 0.4, name: 'full_center', weight: 2 },
            // Top area
            { x: 0.2, y: 0.1, width: 0.6, height: 0.3, name: 'top_area', weight: 1 },
            // Bottom area
            { x: 0.2, y: 0.5, width: 0.6, height: 0.3, name: 'bottom_area', weight: 1 },
            // Left side
            { x: 0.1, y: 0.2, width: 0.3, height: 0.4, name: 'left_side', weight: 1 },
            // Right side
            { x: 0.6, y: 0.2, width: 0.3, height: 0.4, name: 'right_side', weight: 1 }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Webcam Stable Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply optimized OCR settings for webcam
                for (const [key, value] of Object.entries(this.webcamOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Webcam Stable Scanner: Initialized successfully');
            } else {
                console.warn('Webcam Stable Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Webcam Stable Scanner: Initialization failed', error);
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
        console.log(`Webcam Stable Scanner: Frame buffer size: ${this.frameBuffer.length}`);
    }
    
    /**
     * Scan for stable counter values using frame averaging
     */
    async scanStableCounter(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Webcam Stable Scanner: OCR not available');
            return null;
        }
        
        // Add current frame to buffer
        this.addFrameToBuffer(imageData);
        
        try {
            console.log('Webcam Stable Scanner: Starting stable scan...');
            const allResults = [];
            
            // Scan each region with each frame in buffer
            for (const region of this.scanRegions) {
                console.log(`Webcam Stable Scanner: Scanning region ${region.name}...`);
                
                const regionResults = [];
                
                // Process each frame in buffer
                for (let frameIndex = 0; frameIndex < this.frameBuffer.length; frameIndex++) {
                    const frameData = this.frameBuffer[frameIndex];
                    
                    // Extract region as canvas
                    const regionCanvas = this.extractRegionCanvas(frameData, region);
                    
                    if (regionCanvas) {
                        console.log(`Webcam Stable Scanner: Region ${region.name} extracted from frame ${frameIndex + 1}`);
                        
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
                                    frameIndex: frameIndex,
                                    weight: region.weight
                                });
                                console.log(`Webcam Stable Scanner: Found value ${counterValue} in ${region.name} (frame ${frameIndex + 1})`);
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
            
            // Process all results to find the most stable reading
            if (allResults.length > 0) {
                const stableResult = this.findMostStableResult(allResults);
                console.log('Webcam Stable Scanner: Most stable result found', stableResult);
                return stableResult;
            }
            
            console.log('Webcam Stable Scanner: No stable counter values found');
            return null;
        } catch (error) {
            console.error('Webcam Stable Scanner: Scan error', error);
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
        
        console.log('Webcam Stable Scanner: Value groups:', valueGroups);
        
        // Find the most frequently detected value
        let mostStableValue = null;
        let maxOccurrences = 0;
        let maxWeightedScore = 0;
        
        for (const [value, occurrences] of Object.entries(valueGroups)) {
            const numOccurrences = occurrences.length;
            const avgConfidence = occurrences.reduce((sum, r) => sum + r.confidence, 0) / numOccurrences;
            const totalWeight = occurrences.reduce((sum, r) => sum + r.weight, 0);
            const weightedScore = numOccurrences * avgConfidence * totalWeight;
            
            console.log(`Webcam Stable Scanner: Value ${value}: ${numOccurrences} occurrences, avg confidence ${avgConfidence.toFixed(1)}%, weighted score ${weightedScore.toFixed(1)}`);
            
            if (weightedScore > maxWeightedScore) {
                maxWeightedScore = weightedScore;
                maxOccurrences = numOccurrences;
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
                weightedScore: maxWeightedScore,
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
            
            console.log(`Webcam Stable Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
            
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
            
            console.log(`Webcam Stable Scanner: Region ${region.name} canvas created successfully`);
            return canvas;
            
        } catch (error) {
            console.error(`Webcam Stable Scanner: Error extracting region ${region.name}:`, error);
            return null;
        }
    }
    
    /**
     * Extract counter value from OCR text with focus on 6-digit numbers like 963373
     */
    extractCounterValue(text) {
        console.log(`Webcam Stable Scanner: Processing OCR text: "${text}"`);
        
        // Clean the text - remove all non-numeric characters
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Webcam Stable Scanner: Cleaned text: "${cleanText}"`);
        
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
            
            console.log(`Webcam Stable Scanner: Found numbers:`, sortedNumbers);
            
            // Return the longest number (most likely to be the full counter)
            const bestNumber = sortedNumbers[0];
            console.log(`Webcam Stable Scanner: Selected best number: ${bestNumber}`);
            
            // Validation for counter values (allow 4-7 digits)
            if (bestNumber >= 1000 && bestNumber <= 9999999) {
                return bestNumber;
            }
        }
        
        console.log('Webcam Stable Scanner: No valid counter value found');
        return null;
    }
    
    /**
     * Get scan statistics
     */
    getScanStats() {
        return {
            frameBufferSize: this.frameBuffer.length,
            maxFrameBuffer: this.maxFrameBuffer,
            resultHistorySize: this.resultHistory.length,
            lastStableResult: this.lastStableResult
        };
    }
    
    /**
     * Clear frame buffer
     */
    clearFrameBuffer() {
        this.frameBuffer = [];
        console.log('Webcam Stable Scanner: Frame buffer cleared');
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
                console.log('Webcam Stable Scanner: Cleanup completed');
            } catch (error) {
                console.error('Webcam Stable Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const webcamStableScanner = new WebcamStableScanner();

// Export for global access
window.webcamStableScanner = webcamStableScanner; 