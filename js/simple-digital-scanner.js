/**
 * Simple Digital Counter Scanner
 * Basic OCR scanner for reading digital counter displays
 */

export class SimpleDigitalScanner {
    constructor() {
        this.ocrWorker = null;
        this.isInitialized = false;
        
        // Simple OCR settings for digital displays
        this.simpleOCRConfig = {
            lang: 'eng',
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: '7', // Single uniform block of text
            preserve_interword_spaces: '1'
        };
        
        // Simple scan regions
        this.scanRegions = [
            { x: 0.2, y: 0.3, width: 0.6, height: 0.4, name: 'center' },
            { x: 0.1, y: 0.1, width: 0.8, height: 0.3, name: 'top' },
            { x: 0.1, y: 0.6, width: 0.8, height: 0.3, name: 'bottom' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof Tesseract !== 'undefined') {
                console.log('Simple Digital Scanner: Tesseract available, initializing...');
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
                
                // Apply simple OCR settings
                for (const [key, value] of Object.entries(this.simpleOCRConfig)) {
                    await this.ocrWorker.setParameters({ [key]: value });
                }
                
                this.isInitialized = true;
                console.log('Simple Digital Scanner: Initialized successfully');
            } else {
                console.warn('Simple Digital Scanner: Tesseract not available');
            }
        } catch (error) {
            console.error('Simple Digital Scanner: Initialization failed', error);
        }
    }
    
    /**
     * Scan for digital counter values in image data
     */
    async scanDigitalCounter(imageData) {
        if (!this.isInitialized || !this.ocrWorker) {
            console.warn('Simple Digital Scanner: OCR not available');
            return null;
        }
        
        try {
            console.log('Simple Digital Scanner: Starting scan...');
            const results = [];
            
            // Scan multiple regions
            for (const region of this.scanRegions) {
                console.log(`Simple Digital Scanner: Scanning region ${region.name}...`);
                const regionData = this.extractRegion(imageData, region);
                const ocrResult = await this.ocrWorker.recognize(regionData);
                
                console.log(`Simple Digital Scanner: OCR result for ${region.name}:`, ocrResult);
                
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
                        console.log(`Simple Digital Scanner: Found value ${counterValue} in ${region.name}`);
                    }
                }
            }
            
            // Return best result (highest confidence)
            if (results.length > 0) {
                const bestResult = results.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                console.log('Simple Digital Scanner: Best result found', bestResult);
                return bestResult;
            }
            
            console.log('Simple Digital Scanner: No counter values found');
            return null;
        } catch (error) {
            console.error('Simple Digital Scanner: Scan error', error);
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
        
        console.log(`Simple Digital Scanner: Extracting region ${region.name}: ${x},${y} ${width}x${height}`);
        
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
        console.log(`Simple Digital Scanner: Processing OCR text: "${text}"`);
        
        // Clean the text - remove all non-numeric characters
        const cleanText = text.replace(/[^\d]/g, '');
        console.log(`Simple Digital Scanner: Cleaned text: "${cleanText}"`);
        
        // Look for numeric patterns
        const numberMatch = cleanText.match(/\d+/);
        
        if (numberMatch) {
            const value = parseInt(numberMatch[0], 10);
            console.log(`Simple Digital Scanner: Extracted value: ${value}`);
            
            // Validate reasonable range for counter values
            if (value >= 0 && value <= 999999) {
                return value;
            }
        }
        
        console.log('Simple Digital Scanner: No valid counter value found');
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
                console.log('Simple Digital Scanner: Cleanup completed');
            } catch (error) {
                console.error('Simple Digital Scanner: Cleanup failed', error);
            }
        }
    }
}

// Create and export singleton instance
export const simpleDigitalScanner = new SimpleDigitalScanner();

// Export for global access
window.simpleDigitalScanner = simpleDigitalScanner; 