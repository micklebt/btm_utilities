/**
 * Counter Webhook Handler
 * Handles counter readings and webhook submissions to Make.com
 */

import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { locationManager } from './location-config.js';

export class CounterWebhookHandler {
    constructor() {
        this.webhookUrl = 'https://hook.us1.make.com/wcm4q9426xxomcinbl1esqxfqmojeynh';
        this.sheetId = '1K_Mc1lgoWw5iAvvCzyyuW6fCvY3gikcs8u42mOGMbDw';
        this.countingModes = {
            quarters: { id: 'quarters', name: 'Quarters', conversionFactor: 0.25 }, // 4 ticks = $1
            dollars: { id: 'dollars', name: 'Dollars', conversionFactor: 1.0 }      // 1 tick = $1
        };
        this.initialized = false;
        this.previousReadings = {};
    }

    /**
     * Initialize the counter webhook handler
     */
    async init() {
        try {
            logger.info('Initializing Counter Webhook Handler');
            
            // Load previous readings from server
            await this.loadPreviousReadings();
            
            this.initialized = true;
            logger.info('Counter Webhook Handler initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Counter Webhook Handler', null, error);
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'counter-webhook-init'
            });
            return false;
        }
    }

    /**
     * Load previous readings from server
     */
    async loadPreviousReadings() {
        try {
            // Fetch all readings from the server
            const response = await fetch('/api/all-readings');
            if (!response.ok) {
                throw new Error(`Failed to fetch readings: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.error || 'Unknown error fetching readings');
            }
            
            // Convert the array of readings to our key-value format
            this.previousReadings = {};
            result.data.forEach(reading => {
                const key = `${reading.locationId}_${reading.machineId}`;
                this.previousReadings[key] = {
                    counterValue: reading.counterValue,
                    countingMode: reading.countingMode,
                    conversionFactor: reading.conversionFactor,
                    dollarAmount: reading.dollarAmount,
                    timestamp: reading.timestamp
                };
            });
            
            logger.info(`Loaded ${Object.keys(this.previousReadings).length} previous counter readings from server`);
            return this.previousReadings;
        } catch (error) {
            logger.warn('Failed to load previous counter readings from server', null, error);
            this.previousReadings = {};
            return {};
        }
    }

    /**
     * Submit a counter reading
     * @param {Object} data - Counter reading data
     * @returns {Promise<Object>} - Result of the submission
     */
    async submitCounterReading(data) {
        try {
            logger.info('Submitting counter reading', data);

            if (!this.initialized) {
                await this.init();
            }

            // Validate data
            this.validateSubmissionData(data);
            
            // Get machine details and set counting mode
            const machine = locationManager.getMachineById(data.machineId);
            if (machine && machine.countingMode) {
                data.countingMode = machine.countingMode;
            }
            
            // Use the server API to submit the reading
            const response = await fetch('/api/counter-readings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    webhookUrl: this.webhookUrl,
                    sheetId: this.sheetId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to submit reading: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status !== 'success' && result.status !== 'partial_success') {
                throw new Error(result.error || 'Unknown error submitting reading');
            }
            
            // Update our in-memory cache with the new reading
            const key = `${data.locationId}_${data.machineId}`;
            this.previousReadings[key] = {
                counterValue: parseInt(data.counterValue),
                countingMode: data.countingMode,
                conversionFactor: this.countingModes[data.countingMode].conversionFactor,
                dollarAmount: parseInt(data.counterValue) * this.countingModes[data.countingMode].conversionFactor,
                timestamp: new Date().toISOString()
            };
            
            return {
                status: 'success',
                data: result.data,
                make: result.make
            };
        } catch (error) {
            logger.error('Failed to submit counter reading', data, error);
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'counter-webhook-submit'
            });
            
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Get previous reading for a machine
     * @param {string} locationId - Location ID
     * @param {string} machineId - Machine ID
     * @returns {Promise<Object|null>} - Previous reading or null
     */
    async getPreviousReading(locationId, machineId) {
        try {
            const response = await fetch(`/api/previous-reading?locationId=${locationId}&machineId=${machineId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch previous reading: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.error || 'Unknown error fetching previous reading');
            }
            
            return result.data;
        } catch (error) {
            logger.warn(`Failed to fetch previous reading for ${locationId}/${machineId}`, null, error);
            return null;
        }
    }

    /**
     * Get all readings
     * @returns {Promise<Array>} - Array of readings
     */
    async getAllReadings() {
        try {
            const response = await fetch('/api/all-readings');
            if (!response.ok) {
                throw new Error(`Failed to fetch readings: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.error || 'Unknown error fetching readings');
            }
            
            return result.data;
        } catch (error) {
            logger.error('Failed to fetch all readings', null, error);
            return [];
        }
    }

    /**
     * Clear all counter readings
     * @returns {Promise<Object>} - Result of the operation
     */
    async clearAllReadings() {
        try {
            const response = await fetch('/api/clear-readings', {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to clear readings: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.error || 'Unknown error clearing readings');
            }
            
            // Clear local cache
            this.previousReadings = {};
            
            logger.info('All counter readings cleared');
            return {
                status: 'success',
                message: 'All counter readings cleared'
            };
        } catch (error) {
            logger.error('Failed to clear counter readings', null, error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Validate submission data
     * @param {Object} data - Data to validate
     * @throws {Error} - If data is invalid
     */
    validateSubmissionData(data) {
        if (!data) {
            throw new Error('No data provided');
        }
        
        if (!data.locationId) {
            throw new Error('Location ID is required');
        }
        
        if (!data.machineId) {
            throw new Error('Machine ID is required');
        }
        
        if (!data.counterValue && data.counterValue !== 0) {
            throw new Error('Counter value is required');
        }
        
        if (isNaN(parseInt(data.counterValue))) {
            throw new Error('Counter value must be a number');
        }
        
        if (!data.collectorName) {
            throw new Error('Collector name is required');
        }
    }

    /**
     * Set webhook URL
     * @param {string} url - Webhook URL
     */
    setWebhookUrl(url) {
        if (url && url.trim()) {
            this.webhookUrl = url.trim();
            logger.info(`Set webhook URL to: ${this.webhookUrl}`);
        }
    }

    /**
     * Set Google Sheet ID
     * @param {string} id - Sheet ID
     */
    setSheetId(id) {
        if (id && id.trim()) {
            this.sheetId = id.trim();
            logger.info(`Set Google Sheet ID to: ${this.sheetId}`);
        }
    }

    /**
     * Get webhook URL
     * @returns {string} - Webhook URL
     */
    getWebhookUrl() {
        return this.webhookUrl;
    }

    /**
     * Get sheet ID
     * @returns {string} - Google Sheet ID
     */
    getSheetId() {
        return this.sheetId;
    }
}

// Create and export a singleton instance
export const counterWebhookHandler = new CounterWebhookHandler();