/**
 * Make.com Webhook Handler
 * Sends counter reading data to Make.com which then updates Google Sheets
 */

import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { googleSheetsWebhook } from './google-sheets-webhook.js';

export class MakeWebhookHandler {
    constructor() {
        // Default webhook URLs with the correct domain
        this.webhookUrls = {
            counterReadings: 'https://hook.us1.make.com/wcm4q9426xxomcinbl1esqxfqmojeynh',
            alerts: 'https://hook.us1.make.com/wcm4q9426xxomcinbl1esqxfqmojeynh'
        };
        this.initialized = false;
    }

    /**
     * Initialize the Make.com webhook handler
     */
    async init() {
        try {
            logger.info('Initializing Make.com webhook handler');
            this.initialized = true;
            logger.info('Make.com webhook handler initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Make.com webhook handler', null, error);
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'make-webhook-init'
            });
            return false;
        }
    }

    /**
     * Send counter reading data to Make.com
     * @param {Object} data - Counter reading data
     * @returns {Promise<Object>} - Result of the webhook call
     */
    async sendCounterReading(data) {
        try {
            logger.info('Sending counter reading to Make.com', data);

            if (!this.initialized) {
                await this.init();
            }

            // First, process the data through our Google Sheets webhook handler
            // This ensures we have all the calculations and previous values
            const processedData = await googleSheetsWebhook.submitCounterReading(data);
            
            if (processedData.status !== 'success') {
                throw new Error(`Failed to process counter reading: ${processedData.error}`);
            }

            // Prepare payload for Make.com
            const payload = this.formatPayloadForMake(processedData.data);

            // Send to Make.com
            const result = await this.sendToMake(this.webhookUrls.counterReadings, payload);

            logger.info('Counter reading sent to Make.com successfully', { result });
            return {
                status: 'success',
                httpStatus: result.status,
                data: {
                    webhook_id: `MAKE_${Date.now()}`,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('Failed to send counter reading to Make.com', data, error);
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'make-webhook-send'
            });
            
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Format payload for Make.com
     * @param {Object} data - Processed counter reading data
     * @returns {Object} - Formatted payload
     */
    formatPayloadForMake(data) {
        return {
            // Basic info
            timestamp: data.timestamp,
            date: data.date,
            
            // Location and machine info
            location: data.location,
            locationId: data.locationId,
            changer: data.changer,
            hopper: data.hopper,
            machineId: data.machineId,
            
            // Counter values
            counterValue: data.counterValue,
            previousValue: data.previousValue || null,
            counterDifference: data.counterDifference || null,
            
            // Money calculations
            countingMode: data.countingMode,
            conversionFactor: data.conversionFactor,
            dollarAmount: data.dollarAmount,
            dollarDifference: data.dollarDifference || null,
            
            // Additional info
            collectorName: data.collectorName,
            comments: data.comments,
            
            // Google Sheets info
            sheetId: googleSheetsWebhook.getSheetId(),
            sheetTab: data.locationId.charAt(0).toUpperCase() + data.locationId.slice(1)
        };
    }

    /**
     * Send data to Make.com webhook
     * @param {string} webhookUrl - Make.com webhook URL
     * @param {Object} payload - Data to send
     * @returns {Promise<Object>} - Result of the webhook call
     */
    async sendToMake(webhookUrl, payload) {
        try {
            console.log(`Sending data to Make.com webhook: ${webhookUrl}`, payload);
            
            // Use server-side proxy to avoid CORS issues
            const proxyResponse = await fetch('/api/webhook-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhookUrl,
                    payload
                })
            });
            
            console.log('Proxy response status:', proxyResponse.status);
            
            // Handle the response safely
            let proxyResult;
            
            try {
                // Try to parse the response as JSON
                const text = await proxyResponse.text();
                console.log('Proxy response text:', text);
                
                // Only try to parse as JSON if there's actual content
                if (text && text.trim()) {
                    proxyResult = JSON.parse(text);
                    console.log('Parsed proxy result:', proxyResult);
                } else {
                    proxyResult = { 
                        status: proxyResponse.ok ? 'success' : 'error',
                        httpStatus: proxyResponse.status 
                    };
                    console.log('Empty response, using default result:', proxyResult);
                }
            } catch (parseError) {
                // If JSON parsing fails, create a simple result object based on the response status
                console.warn('Failed to parse proxy response as JSON:', parseError);
                proxyResult = {
                    status: proxyResponse.ok ? 'success' : 'error',
                    httpStatus: proxyResponse.status,
                    parseError: parseError.message
                };
            }
            
            if (!proxyResponse.ok) {
                throw new Error(`Proxy request failed: ${proxyResult.error || 'Unknown error'}`);
            }
            
            console.log(`Make.com webhook response via proxy: ${proxyResult.httpStatus || proxyResponse.status || 'Unknown status'}`, proxyResult);
            
            return {
                success: proxyResult.status === 'success' || proxyResponse.ok,
                status: proxyResult.httpStatus || proxyResponse.status || 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error sending data to Make.com:', error);
            throw new Error(`Failed to send data to Make.com: ${error.message}`);
        }
    }

    /**
     * Send alert to Make.com
     * @param {Object} data - Alert data
     * @returns {Promise<Object>} - Result of the webhook call
     */
    async sendAlert(data) {
        try {
            logger.info('Sending alert to Make.com', data);

            if (!this.initialized) {
                await this.init();
            }

            // Format alert data
            const payload = {
                alertType: data.type || 'info',
                message: data.message,
                source: data.source || 'BTM Utility',
                timestamp: new Date().toISOString(),
                details: data.details || {}
            };

            // Send to Make.com
            const result = await this.sendToMake(this.webhookUrls.alerts, payload);

            logger.info('Alert sent to Make.com successfully', { result });
            return {
                status: 'success',
                httpStatus: result.status,
                data: {
                    alert_id: `ALERT_${Date.now()}`,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('Failed to send alert to Make.com', data, error);
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Set webhook URL
     * @param {string} type - Webhook type ('counterReadings' or 'alerts')
     * @param {string} url - Make.com webhook URL
     */
    setWebhookUrl(type, url) {
        if (!this.webhookUrls[type]) {
            throw new Error(`Invalid webhook type: ${type}`);
        }
        
        this.webhookUrls[type] = url;
        logger.info(`Make.com webhook URL updated for ${type}: ${url}`);
    }

    /**
     * Get webhook URL
     * @param {string} type - Webhook type ('counterReadings' or 'alerts')
     * @returns {string} - Make.com webhook URL
     */
    getWebhookUrl(type) {
        if (!this.webhookUrls[type]) {
            throw new Error(`Invalid webhook type: ${type}`);
        }
        
        return this.webhookUrls[type];
    }
}

// Create and export singleton instance
export const makeWebhookHandler = new MakeWebhookHandler();

export default makeWebhookHandler;