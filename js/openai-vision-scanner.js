/**
 * OpenAI Vision API Scanner
 * Captures QR codes and sends images to OpenAI for OCR and parsing
 */

import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { getAPIKey } from './api-key-manager.js';

export class OpenAIVisionScanner {
    constructor() {
        this.isInitialized = false;
        this.frameBuffer = [];
        this.maxFrameBuffer = 3;
        this.lastScanTime = 0;
        this.scanCooldown = 3000; // 3 seconds between scans
        
        this.initialize();
    }
    
    async initialize() {
        try {
            if (typeof jsQR === 'undefined') {
                logger.warn('OpenAI Vision Scanner: jsQR library not available');
                return;
            }
            
            this.isInitialized = true;
            logger.info('OpenAI Vision Scanner: Initialized successfully');
        } catch (error) {
            logger.error('OpenAI Vision Scanner: Initialization failed', error);
        }
    }
    
    addFrameToBuffer(imageData) {
        this.frameBuffer.push(imageData);
        if (this.frameBuffer.length > this.maxFrameBuffer) {
            this.frameBuffer.shift();
        }
        logger.info(`OpenAI Vision Scanner: Frame buffer size: ${this.frameBuffer.length}`);
    }
    
    async scanWithOpenAI(imageData) {
        if (!this.isInitialized) {
            logger.warn('OpenAI Vision Scanner: Not initialized');
            return null;
        }
        
        // Check cooldown
        const now = Date.now();
        if (now - this.lastScanTime < this.scanCooldown) {
            logger.info('OpenAI Vision Scanner: Scan cooldown active');
            return null;
        }
        
        this.addFrameToBuffer(imageData);
        
        try {
            logger.info('OpenAI Vision Scanner: Starting OpenAI Vision scan...');
            
            const results = {
                qrCode: null,
                visionResult: null,
                timestamp: Date.now()
            };
            
            // Step 1: Detect QR Code
            logger.info('OpenAI Vision Scanner: Detecting QR code...');
            const qrResult = await this.detectQRCode(imageData);
            if (qrResult) {
                results.qrCode = qrResult;
                logger.info('OpenAI Vision Scanner: QR code detected:', qrResult);
            } else {
                logger.info('OpenAI Vision Scanner: No QR code detected');
            }
            
            // Step 2: Send image to OpenAI Vision API
            logger.info('OpenAI Vision Scanner: Sending image to OpenAI Vision API...');
            const visionResult = await this.sendToOpenAIVision(imageData);
            if (visionResult) {
                results.visionResult = visionResult;
                logger.info('OpenAI Vision Scanner: OpenAI Vision result:', visionResult);
            } else {
                logger.info('OpenAI Vision Scanner: No OpenAI Vision result');
            }
            
            this.lastScanTime = now;
            logger.info('OpenAI Vision Scanner: Scan completed:', results);
            return results;
            
        } catch (error) {
            logger.error('OpenAI Vision Scanner: Scan error', error);
            return {
                error: error.message,
                qrCode: null,
                visionResult: null,
                timestamp: Date.now()
            };
        }
    }
    
    async detectQRCode(imageData) {
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                logger.info('OpenAI Vision Scanner: QR code found:', code.data);
                return {
                    data: code.data,
                    location: code.location,
                    confidence: 100
                };
            }
            
            return null;
        } catch (error) {
            logger.error('OpenAI Vision Scanner: QR detection error:', error);
            return null;
        }
    }
    
    async sendToOpenAIVision(imageData) {
        try {
            // Get OpenAI API key
            const apiKey = await getAPIKey('openai');
            if (!apiKey) {
                throw new Error('No OpenAI API key configured');
            }
            
            // Convert image data to base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            // Create new image data and put it on canvas
            const newImageData = ctx.createImageData(imageData.width, imageData.height);
            newImageData.data.set(imageData.data);
            ctx.putImageData(newImageData, 0, 0);
            
            // Convert to base64
            const base64Image = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = base64Image.split(',')[1]; // Remove data URL prefix
            
            logger.info('OpenAI Vision Scanner: Image converted to base64, size:', base64Data.length);
            
            // Prepare the request to OpenAI Vision API
            const requestBody = {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this image and extract the following information in JSON format:
                                
1. QR Code Data: If there's a QR code visible, extract its data
2. Digital Counter Value: Look for any digital display showing numbers (like 963373)
3. Location Information: Extract any location names or identifiers
4. Machine Information: Extract any machine/changer identifiers
5. Monetary Values: Extract any dollar amounts or currency values

Return the result as a JSON object with these fields:
{
  "qrCodeData": "extracted QR code data or null",
  "digitalCounter": "extracted counter value or null", 
  "location": "extracted location or null",
  "machine": "extracted machine identifier or null",
  "monetaryValue": "extracted dollar amount or null",
  "confidence": "high/medium/low based on clarity",
  "rawText": "all text visible in the image"
}`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Data}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500,
                temperature: 0.1
            };
            
            logger.info('OpenAI Vision Scanner: Sending request to OpenAI...');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                logger.error('OpenAI Vision Scanner: API request failed:', response.status, errorText);
                throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
            }
            
            const responseData = await response.json();
            logger.info('OpenAI Vision Scanner: Raw OpenAI response:', responseData);
            
            if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
                const content = responseData.choices[0].message.content;
                logger.info('OpenAI Vision Scanner: OpenAI content:', content);
                
                // Try to parse the JSON response
                try {
                    const parsedResult = JSON.parse(content);
                    logger.info('OpenAI Vision Scanner: Parsed result:', parsedResult);
                    return parsedResult;
                } catch (parseError) {
                    logger.error('OpenAI Vision Scanner: Failed to parse JSON response:', parseError);
                    return {
                        error: 'Failed to parse OpenAI response',
                        rawResponse: content
                    };
                }
            } else {
                logger.error('OpenAI Vision Scanner: Unexpected response format:', responseData);
                return {
                    error: 'Unexpected response format from OpenAI',
                    rawResponse: responseData
                };
            }
            
        } catch (error) {
            logger.error('OpenAI Vision Scanner: OpenAI Vision API error:', error);
            return {
                error: error.message
            };
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
        logger.info('OpenAI Vision Scanner: Frame buffer cleared');
    }
    
    async testApiKey() {
        try {
            const apiKey = await getAPIKey('openai');
            if (!apiKey) {
                return { success: false, error: 'No API key set' };
            }
            
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (response.ok) {
                return { success: true, message: 'API key is valid' };
            } else {
                return { success: false, error: `API key test failed: ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
export const openAIVisionScanner = new OpenAIVisionScanner();

// Export for global access
window.openAIVisionScanner = openAIVisionScanner; 