/**
 * Permissive OCR Scanner
 * Uses very relaxed settings to detect ANY text in the image
 */

export class PermissiveOCRScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        this.frameBuffer = [];
        this.maxFrameBuffer = 3;
        
        // VERY permissive OCR settings - detect ANY text
        this.permissiveOCRConfig = {
            lang: 'eng',
            // NO character whitelist - allow ALL characters
            tessedit_pageseg_mode: '3', // Fully automatic page segmentation
            tessedit_ocr_engine_mode: '3', // Default
            preserve_interword_spaces: '1', // Keep spaces
            // Remove all noise filtering
            textord_heavy_nr: '0',
            textord_min_linesize: '1.0',
            textord_noise_debug: '0',
            textord_noise_removal: '0', // NO noise removal
            textord_noise_sizelimit: '0',
            textord_noise_snmin: '0',
            textord_noise_sp: '0',
            textord_noise_tab: '0',
            textord_noise_uq: '0',
            textord_noise_zones: '0',
            textord_noise_zonesize: '0',
            textord_noise_zonesize2: '0',
            textord_noise_zonesize3: '0',
            textord_noise_zonesize4: '0',
            textord_noise_zonesize5: '0',
            textord_noise_zonesize6: '0',
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
            { x: 0.1, y: 0.1, width: 0.8, height: 0.8, name: 'very_large' },
            // Full image
            { x: 0.0, y: 0.0, width: 1.0, height: 1.0, name: 'full_image' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Permissive OCR Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply permissive OCR settings
                for (const [key, value] of Object.entries(this.permissiveOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Permissive OCR Scanner: Initialized successfully');
            } else {
                console.warn('Permissive OCR Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Permissive OCR Scanner: Initialization failed', error);
        }
    }
    
    addFrameToBuffer(imageData) {
        this.frameBuffer.push(imageData);
        if (this.frameBuffer.length > this.maxFrameBuffer) {
            this.frameBuffer.shift();
        }
        console.log(`Permissive OCR Scanner: Frame buffer size: ${this.frameBuffer.length}`);
    }
    
    async scanPermissive(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Permissive OCR Scanner: OCR not available');
            return null;
        }
        
        this.addFrameToBuffer(imageData);
        
        try {
            console.log('Permissive OCR Scanner: Starting permissive scan...');
            
            const results = {
                qrCode: null,
                allTextResults: [], // ALL text found
                timestamp: Date.now()
            };
            
            // Step 1: Detect QR Code
            console.log('Permissive OCR Scanner: Detecting QR code...');
            const qrResult = await this.detectQRCode(imageData);
            if (qrResult) {
                results.qrCode = qrResult;
                console.log('Permissive OCR Scanner: QR code detected:', qrResult);
            } else {
                console.log('Permissive OCR Scanner: No QR code detected');
            }
            
            // Step 2: Read ALL text (permissive)
            console.log('Permissive OCR Scanner: Reading ALL text (permissive)...');
            const textResults = await this.readAllText(imageData);
            results.allTextResults = textResults;
            
            console.log('Permissive OCR Scanner: All text results:', results.allTextResults);
            return results;
            
        } catch (error) {
            console.error('Permissive OCR Scanner: Scan error', error);
            return null;
        }
    }
    
    async detectQRCode(imageData) {
        try {
            if (typeof jsQR === 'undefined') {
                console.warn('Permissive OCR Scanner: jsQR library not available');
                return null;
            }
            
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                console.log('Permissive OCR Scanner: QR code found:', code.data);
                return {
                    data: code.data,
                    location: code.location,
                    confidence: 100
                };
            }
            
            return null;
        } catch (error) {
            console.error('Permissive OCR Scanner: QR detection error:', error);
            return null;
        }
    }
    
    async readAllText(imageData) {
        try {
            const allResults = [];
            
            // Scan each region
            for (const region of this.counterRegions) {
                console.log(`Permissive OCR Scanner: Scanning region ${region.name}...`);
                
                // Process each frame in buffer
                for (let frameIndex = 0; frameIndex < this.frameBuffer.length; frameIndex++) {
                    const frameData = this.frameBuffer[frameIndex];
                    
                    const regionCanvas = this.extractRegionCanvas(frameData, region);
                    
                    if (regionCanvas) {
                        console.log(`Permissive OCR Scanner: Region ${region.name} extracted from frame ${frameIndex + 1}`);
                        
                        try {
                            const ocrResult = await this.ocrWorker.recognize(regionCanvas);
                            
                            if (ocrResult && ocrResult.data && ocrResult.data.text) {
                                const text = ocrResult.data.text.trim();
                                console.log(`Permissive OCR Scanner: OCR result for ${region.name} (frame ${frameIndex + 1}):`, {
                                    text: text,
                                    confidence: ocrResult.data.confidence,
                                    region: region.name,
                                    frameIndex: frameIndex
                                });
                                
                                // Store ALL results, even empty ones
                                allResults.push({
                                    text: text,
                                    confidence: ocrResult.data.confidence,
                                    region: region.name,
                                    frameIndex: frameIndex,
                                    rawText: text,
                                    hasText: text.length > 0,
                                    numbers: this.extractAllNumbers(text)
                                });
                            } else {
                                console.log(`Permissive OCR Scanner: No OCR text for ${region.name} (frame ${frameIndex + 1})`);
                                allResults.push({
                                    text: '',
                                    confidence: 0,
                                    region: region.name,
                                    frameIndex: frameIndex,
                                    rawText: '',
                                    hasText: false,
                                    numbers: []
                                });
                            }
                        } catch (ocrError) {
                            console.error(`Permissive OCR Scanner: OCR error for ${region.name} (frame ${frameIndex + 1}):`, ocrError);
                            allResults.push({
                                text: '',
                                confidence: 0,
                                region: region.name,
                                frameIndex: frameIndex,
                                rawText: 'ERROR',
                                hasText: false,
                                numbers: [],
                                error: ocrError.message
                            });
                        }
                    }
                }
            }
            
            console.log('Permissive OCR Scanner: All text results collected:', allResults);
            return allResults;
            
        } catch (error) {
            console.error('Permissive OCR Scanner: Text reading error:', error);
            return [];
        }
    }
    
    extractAllNumbers(text) {
        console.log(`Permissive OCR Scanner: Processing text: "${text}"`);
        
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Permissive OCR Scanner: Cleaned text: "${cleanText}"`);
        
        const numberMatches = cleanText.match(/\d+/g);
        
        if (numberMatches && numberMatches.length > 0) {
            const numbers = numberMatches.map(num => parseInt(num, 10));
            console.log(`Permissive OCR Scanner: Found numbers:`, numbers);
            return numbers;
        }
        
        console.log('Permissive OCR Scanner: No numbers found');
        return [];
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
            
            console.log(`Permissive OCR Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
            
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
            
            console.log(`Permissive OCR Scanner: Region ${region.name} canvas created successfully`);
            return canvas;
            
        } catch (error) {
            console.error(`Permissive OCR Scanner: Error extracting region ${region.name}:`, error);
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
        console.log('Permissive OCR Scanner: Frame buffer cleared');
    }
    
    async cleanup() {
        if (this.ocrWorker) {
            try {
                await this.ocrWorker.terminate();
                this.ocrWorker = null;
                this.isInitialized = false;
                this.frameBuffer = [];
                console.log('Permissive OCR Scanner: Cleanup completed');
            } catch (error) {
                console.error('Permissive OCR Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const permissiveOCRScanner = new PermissiveOCRScanner();

// Export for global access
window.permissiveOCRScanner = permissiveOCRScanner; 