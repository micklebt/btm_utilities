/**
 * Google Sheets Webhook Handler
 * Handles sending counter reading data to Google Sheets
 * Supports both quarter and dollar counting modes
 */

import { logger } from './logger.js';
import { locationManager } from './location-config.js';
import { errorHandler } from './error-handler.js';
import { formatDate, formatCurrency } from './utils.js';

export class GoogleSheetsWebhook {
    constructor() {
        this.sheetId = '1K_Mc1lgoWw5iAvvCzyyuW6fCvY3gikcs8u42mOGMbDw';
        this.initialized = false;
        this.countingModes = {
            quarters: { id: 'quarters', name: 'Quarters', conversionFactor: 0.25 }, // 4 ticks = $1
            dollars: { id: 'dollars', name: 'Dollars', conversionFactor: 1.0 }      // 1 tick = $1
        };
        
        // In-memory cache of previous counter readings
        // This will be synced with the server
        this.previousReadings = {};
    }

    /**
     * Initialize the webhook handler
     */
    async init() {
        try {
            logger.info('Initializing Google Sheets webhook handler');
            
            // Load previous readings from server
            await this.loadPreviousReadings();
            
            this.initialized = true;
            logger.info('Google Sheets webhook handler initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Google Sheets webhook handler', null, error);
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'google-sheets-webhook-init'
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
     * Fetch previous reading for a specific location/machine from server
     * @param {string} locationId - Location ID
     * @param {string} machineId - Machine ID
     * @returns {Promise<Object|null>} - Previous reading or null
     */
    async fetchPreviousReading(locationId, machineId) {
        try {
            const response = await fetch(`/api/previous-reading?locationId=${locationId}&machineId=${machineId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch previous reading: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.error || 'Unknown error fetching previous reading');
            }
            
            // Update our in-memory cache
            if (result.data) {
                const key = `${locationId}_${machineId}`;
                this.previousReadings[key] = result.data;
            }
            
            return result.data;
        } catch (error) {
            logger.warn(`Failed to fetch previous reading for ${locationId}/${machineId}`, null, error);
            return null;
        }
    }

    /**
     * Submit counter reading to Google Sheets
     * @param {Object} data - Counter reading data
     * @param {string} data.locationId - Location ID (peacock, dover, massillon)
     * @param {string} data.machineId - Machine ID
     * @param {number} data.counterValue - Current counter value
     * @param {string} data.countingMode - 'quarters' or 'dollars'
     * @param {string} data.collectorName - Name of the person collecting
     * @param {string} data.comments - Optional comments
     * @returns {Promise<Object>} - Result of the submission
     */
    async submitCounterReading(data) {
        try {
            logger.info('Submitting counter reading to Google Sheets', data);

            if (!this.initialized) {
                await this.init();
            }

            // Validate data
            this.validateSubmissionData(data);

            // Get machine details
            const machine = locationManager.getMachineById(data.machineId);
            
            // Use the server API to submit the reading
            // This will handle storing the previous reading and calculating differences
            const response = await fetch('/api/counter-readings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    webhookUrl: data.webhookUrl || 'https://hook.us1.make.com/wcm4q9426xxomcinbl1esqxfqmojeynh',
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
                context: 'google-sheets-webhook-submit'
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
     * @returns {Object|null} - Previous reading or null
     */
    async getPreviousReading(locationId, machineId) {
        const key = `${locationId}_${machineId}`;
        
        // Check if we have it in memory first
        if (this.previousReadings[key]) {
            return this.previousReadings[key];
        }
        
        // Otherwise fetch from server
        return await this.fetchPreviousReading(locationId, machineId);
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
        
        if (!data.countingMode) {
            throw new Error('Counting mode is required');
        }
        
        if (!this.countingModes[data.countingMode]) {
            throw new Error(`Invalid counting mode: ${data.countingMode}`);
        }
        
        if (!data.collectorName) {
            throw new Error('Collector name is required');
        }
    }

    /**
     * Format data for Google Sheets
     * @param {Object} data - Raw submission data
     * @param {Object} machine - Machine details
     * @param {number|null} previousValue - Previous counter value
     * @param {number|null} difference - Calculated difference
     * @returns {Object} - Formatted data
     */
    formatDataForSheets(data, machine, previousValue = null, difference = null) {
        // Get conversion factor based on counting mode
        const countingMode = this.countingModes[data.countingMode];
        const conversionFactor = countingMode.conversionFactor;
        
        // Calculate dollar amount from counter value
        const dollarAmount = data.counterValue * conversionFactor;
        
        // Format for Google Sheets
        const formatted = {
            timestamp: new Date().toISOString(),
            date: formatDate(new Date()),
            location: locationManager.getLocation(data.locationId).name,
            locationId: data.locationId,
            changer: machine.changer,
            hopper: machine.hopper,
            counterValue: data.counterValue,
            countingMode: data.countingMode,
            conversionFactor: conversionFactor,
            dollarAmount: dollarAmount,
            formattedAmount: formatCurrency(dollarAmount),
            collectorName: data.collectorName || 'Unknown',
            comments: data.comments || ''
        };
        
        // Add previous value and difference if available
        if (previousValue !== null) {
            formatted.previousValue = previousValue;
            formatted.counterDifference = data.counterValue - previousValue;
        }
        
        if (difference !== null) {
            formatted.dollarDifference = difference;
            formatted.formattedDifference = formatCurrency(difference);
        }
        
        return formatted;
    }

    /**
     * Send data to Google Sheets via webhook
     * @param {Object} formattedData - Data formatted for Google Sheets
     * @returns {Promise<Object>} - Result of the webhook call
     */
    async sendToGoogleSheets(formattedData) {
        try {
            logger.info('Sending data to Google Sheets', { formattedData });
            
            // Determine which sheet tab to use based on location
            const sheetTab = formattedData.locationId.charAt(0).toUpperCase() + formattedData.locationId.slice(1);
            
            // Prepare data for Google Sheets API
            const payload = {
                sheetId: this.sheetId,
                tabName: sheetTab,
                data: [
                    [
                        formattedData.date,
                        formattedData.timestamp,
                        `Changer ${formattedData.changer}`,
                        `Hopper ${formattedData.hopper}`,
                        formattedData.counterValue,
                        formattedData.previousValue || '',
                        formattedData.counterDifference || '',
                        formattedData.countingMode === 'quarters' ? 'Quarters' : 'Dollars',
                        formattedData.dollarDifference ? formattedData.formattedDifference : '',
                        formattedData.collectorName,
                        formattedData.comments
                    ]
                ]
            };
            
            // In a real implementation, this would make an actual API call
            // For now, we'll simulate the API call with a console log and a promise
            console.log('Sending to Google Sheets:', payload);
            
            // Simulate API call with a delay
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: 'Data sent to Google Sheets',
                        timestamp: new Date().toISOString(),
                        rowsAdded: 1
                    });
                }, 500);
            });
        } catch (error) {
            logger.error('Error sending data to Google Sheets', null, error);
            throw new Error(`Failed to send data to Google Sheets: ${error.message}`);
        }
    }

    /**
     * Calculate the difference between current and previous counter values
     * and convert to dollar amount based on counting mode
     * @param {number} currentValue - Current counter value
     * @param {number} previousValue - Previous counter value
     * @param {string} countingMode - 'quarters' or 'dollars'
     * @returns {number} - Dollar amount difference
     */
    calculateDifference(currentValue, previousValue, countingMode) {
        // Calculate the difference in counter ticks
        const tickDifference = currentValue - previousValue;
        
        // Apply conversion factor based on counting mode
        const conversionFactor = this.countingModes[countingMode].conversionFactor;
        const dollarDifference = tickDifference * conversionFactor;
        
        return dollarDifference;
    }

    /**
     * Get sheet ID
     * @returns {string} - Google Sheet ID
     */
    getSheetId() {
        return this.sheetId;
    }

    /**
     * Set sheet ID
     * @param {string} id - Google Sheet ID
     */
    setSheetId(id) {
        if (id && id.trim()) {
            this.sheetId = id.trim();
            logger.info(`Set Google Sheet ID to: ${this.sheetId}`);
        }
    }

    /**
     * Clear all previous readings
     */
    async clearPreviousReadings() {
        try {
            // This would need a server endpoint to clear all readings
            // For now, we'll just clear our local cache
            this.previousReadings = {};
            logger.info('Cleared all previous counter readings');
            return true;
        } catch (error) {
            logger.error('Failed to clear previous counter readings', null, error);
            return false;
        }
    }
}

// Create and export singleton instance
export const googleSheetsWebhook = new GoogleSheetsWebhook();

export default googleSheetsWebhook;