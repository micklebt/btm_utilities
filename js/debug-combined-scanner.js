/**
 * Debug Combined QR + OCR Scanner
 * Shows ALL OCR results for debugging purposes
 */

export class DebugCombinedScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        this.frameBuffer = [];
        this.maxFrameBuffer = 3;
        
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
        
        // More comprehensive scan regions
        this.counterRegions = [
            // Primary target - where the 963373 display is located
            { x: 0.3, y: 0.2, width: 0.4, height: 0.3, name: 'primary_display' },
            // Full center area
            { x: 0.2, y: 0.15, width: 0.6, height: 0.4, name: 'full_center' },
            // Top area
            { x: 0.2, y: 0.1, width: 0.6, height: 0.3, name: 'top_area' },
            // Bottom area
            { x: 0.2, y: 0.5, width: 0.6, height: 0.3, name: 'bottom_area' },
            // Left side
            { x: 0.05, y: 0.2, width: 0.4, height: 0.6, name: 'left_side' },
            // Right side
            { x: 0.55, y: 0.2, width: 0.4, height: 0.6, name: 'right_side' },
            // Very large area
            { x: 0.1, y: 0.1, width: 0.8, height: 0.8, name: 'very_large' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Debug Combined Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply optimized OCR settings
                for (const [key, value] of Object.entries(this.digitalOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Debug Combined Scanner: Initialized successfully');
            } else {
                console.warn('Debug Combined Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Debug Combined Scanner: Initialization failed', error);
        }
    }
    
    addFrameToBuffer(imageData) {
        this.frameBuffer.push(imageData);
        if (this.frameBuffer.length > this.maxFrameBuffer) {
            this.frameBuffer.shift();
        }
        console.log(`Debug Combined Scanner: Frame buffer size: ${this.frameBuffer.length}`);
    }
    
    async scanCombined(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Debug Combined Scanner: OCR not available');
            return null;
        }
        
        this.addFrameToBuffer(imageData);
        
        try {
            console.log('Debug Combined Scanner: Starting debug scan...');
            
            const results = {
                qrCode: null,
                counterValue: null,
                allOCRResults: [], // NEW: Store ALL OCR results for debugging
                timestamp: Date.now()
            };
            
            // Step 1: Detect QR Code
            console.log('Debug Combined Scanner: Detecting QR code...');
            const qrResult = await this.detectQRCode(imageData);
            if (qrResult) {
                results.qrCode = qrResult;
                console.log('Debug Combined Scanner: QR code detected:', qrResult);
            } else {
                console.log('Debug Combined Scanner: No QR code detected');
            }
            
            // Step 2: Read Digital Counter (with ALL results)
            console.log('Debug Combined Scanner: Reading digital counter (showing ALL results)...');
            const counterResults = await this.readDigitalCounterDebug(imageData);
            results.allOCRResults = counterResults;
            
            // Find the best counter value
            if (counterResults.length > 0) {
                const bestResult = this.findBestCounterResult(counterResults);
                if (bestResult) {
                    results.counterValue = bestResult;
                    console.log('Debug Combined Scanner: Best counter result:', bestResult);
                }
            }
            
            console.log('Debug Combined Scanner: All OCR results:', results.allOCRResults);
            return results;
            
        } catch (error) {
            console.error('Debug Combined Scanner: Scan error', error);
            return null;
        }
    }
    
    async detectQRCode(imageData) {
        try {
            if (typeof jsQR === 'undefined') {
                console.warn('Debug Combined Scanner: jsQR library not available');
                return null;
            }
            
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                console.log('Debug Combined Scanner: QR code found:', code.data);
                return {
                    data: code.data,
                    location: code.location,
                    confidence: 100
                };
            }
            
            return null;
        } catch (error) {
            console.error('Debug Combined Scanner: QR detection error:', error);
            return null;
        }
    }
    
    async readDigitalCounterDebug(imageData) {
        try {
            const allResults = [];
            
            // Scan each region
            for (const region of this.counterRegions) {
                console.log(`Debug Combined Scanner: Scanning counter region ${region.name}...`);
                
                // Process each frame in buffer
                for (let frameIndex = 0; frameIndex < this.frameBuffer.length; frameIndex++) {
                    const frameData = this.frameBuffer[frameIndex];
                    
                    const regionCanvas = this.extractRegionCanvas(frameData, region);
                    
                    if (regionCanvas) {
                        console.log(`Debug Combined Scanner: Region ${region.name} extracted from frame ${frameIndex + 1}`);
                        
                        try {
                            const ocrResult = await this.ocrWorker.recognize(regionCanvas);
                            
                            if (ocrResult && ocrResult.data && ocrResult.data.text) {
                                console.log(`Debug Combined Scanner: OCR result for ${region.name} (frame ${frameIndex + 1}):`, {
                                    text: ocrResult.data.text,
                                    confidence: ocrResult.data.confidence,
                                    region: region.name,
                                    frameIndex: frameIndex
                                });
                                
                                // Store ALL results, not just valid ones
                                allResults.push({
                                    text: ocrResult.data.text,
                                    confidence: ocrResult.data.confidence,
                                    region: region.name,
                                    frameIndex: frameIndex,
                                    rawText: ocrResult.data.text,
                                    cleanText: ocrResult.data.text.replace(/[^\d]/g, ''),
                                    numbers: this.extractAllNumbers(ocrResult.data.text)
                                });
                            } else {
                                console.log(`Debug Combined Scanner: No OCR text for ${region.name} (frame ${frameIndex + 1})`);
                            }
                        } catch (ocrError) {
                            console.error(`Debug Combined Scanner: OCR error for ${region.name} (frame ${frameIndex + 1}):`, ocrError);
                        }
                    }
                }
            }
            
            console.log('Debug Combined Scanner: All OCR results collected:', allResults);
            return allResults;
            
        } catch (error) {
            console.error('Debug Combined Scanner: Counter reading error:', error);
            return [];
        }
    }
    
    extractAllNumbers(text) {
        console.log(`Debug Combined Scanner: Processing text: "${text}"`);
        
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Debug Combined Scanner: Cleaned text: "${cleanText}"`);
        
        const numberMatches = cleanText.match(/\d+/g);
        
        if (numberMatches && numberMatches.length > 0) {
            const numbers = numberMatches.map(num => parseInt(num, 10));
            console.log(`Debug Combined Scanner: Found numbers:`, numbers);
            return numbers;
        }
        
        console.log('Debug Combined Scanner: No numbers found');
        return [];
    }
    
    findBestCounterResult(allResults) {
        console.log('Debug Combined Scanner: Finding best counter result from', allResults.length, 'results');
        
        // Collect all numbers from all results
        const allNumbers = [];
        allResults.forEach(result => {
            result.numbers.forEach(num => {
                allNumbers.push({
                    value: num,
                    confidence: result.confidence,
                    region: result.region,
                    frameIndex: result.frameIndex,
                    rawText: result.rawText
                });
            });
        });
        
        console.log('Debug Combined Scanner: All numbers found:', allNumbers);
        
        if (allNumbers.length === 0) {
            console.log('Debug Combined Scanner: No numbers found in any results');
            return null;
        }
        
        // Sort by length (longest first) and then by value
        const sortedNumbers = allNumbers.sort((a, b) => {
            const aDigits = a.value.toString().length;
            const bDigits = b.value.toString().length;
            if (aDigits !== bDigits) {
                return bDigits - aDigits;
            }
            return b.value - a.value;
        });
        
        console.log('Debug Combined Scanner: Sorted numbers:', sortedNumbers);
        
        // Return the longest number (most likely to be the full counter)
        const bestNumber = sortedNumbers[0];
        console.log('Debug Combined Scanner: Selected best number:', bestNumber);
        
        // More lenient validation - accept any number 3+ digits
        if (bestNumber.value >= 100) {
            return {
                value: bestNumber.value,
                confidence: bestNumber.confidence,
                region: bestNumber.region,
                rawText: bestNumber.rawText,
                frameIndex: bestNumber.frameIndex
            };
        }
        
        console.log('Debug Combined Scanner: Best number too short, no valid counter value');
        return null;
    }
    
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
            
            console.log(`Debug Combined Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
            
            const regionData = ctx.createImageData(width, height);
            
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    const sourceIndex = ((y + i) * imageData.width + (x + j)) * 4;
                    const targetIndex = (i * width + j) * 4;
                    
                    regionData.data[targetIndex] = imageData.data[sourceIndex];
                    regionData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
                    regionData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
                    regionData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
                }
            }
            
            ctx.putImageData(regionData, 0, 0);
            
            console.log(`Debug Combined Scanner: Region ${region.name} canvas created successfully`);
            return canvas;
            
        } catch (error) {
            console.error(`Debug Combined Scanner: Error extracting region ${region.name}:`, error);
            return null;
        }
    }
    
    getScanStats() {
        return {
            frameBufferSize: this.frameBuffer.length,
            maxFrameBuffer: this.maxFrameBuffer,
            isInitialized: this.isInitialized
        };
    }
    
    clearFrameBuffer() {
        this.frameBuffer = [];
        console.log('Debug Combined Scanner: Frame buffer cleared');
    }
    
    async cleanup() {
        if (this.ocrWorker) {
            try {
                await this.ocrWorker.terminate();
                this.ocrWorker = null;
                this.isInitialized = false;
                this.frameBuffer = [];
                console.log('Debug Combined Scanner: Cleanup completed');
            } catch (error) {
                console.error('Debug Combined Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const debugCombinedScanner = new DebugCombinedScanner();

// Export for global access
window.debugCombinedScanner = debugCombinedScanner; 