/**
 * QR Data Parser for BTM Utility
 * Parses QR code data in the format: "Location, changer X, Y = $Z"
 */

export class QRDataParser {
    constructor() {
        this.supportedLocations = ['peacock', 'dover', 'massillon'];
    }

    /**
     * Parse QR code data and extract structured information
     * @param {string} qrData - Raw QR code data
     * @returns {object} Parsed data with location, machine, and counter values
     */
    parseQRData(qrData) {
        try {
            console.log('Parsing QR data:', qrData);
            
            // Clean the input data
            const cleanData = qrData.trim();
            
            // Parse the format: "Location, changer X, Y = $Z"
            const match = cleanData.match(/^(.+),\s*changer\s+(\d+),\s*(\d+)\s*=\s*\$(\d+)$/i);
            
            if (!match) {
                throw new Error('Invalid QR code format. Expected: "Location, changer X, Y = $Z"');
            }
            
            const [, location, changerNumber, counterValue, dollarAmount] = match;
            
            // Normalize location name
            const normalizedLocation = this.normalizeLocation(location);
            
            // Validate location
            if (!this.supportedLocations.includes(normalizedLocation)) {
                throw new Error(`Unsupported location: ${location}`);
            }
            
            // Create machine ID
            const machineId = this.createMachineId(normalizedLocation, changerNumber);
            
            const parsedData = {
                location: normalizedLocation,
                locationName: location.trim(),
                changer: parseInt(changerNumber),
                counterValue: parseInt(counterValue),
                dollarAmount: parseInt(dollarAmount),
                machineId: machineId,
                rawData: qrData
            };
            
            console.log('Parsed QR data:', parsedData);
            return parsedData;
            
        } catch (error) {
            console.error('Error parsing QR data:', error);
            throw error;
        }
    }

    /**
     * Normalize location name to match our system
     * @param {string} location - Location name from QR code
     * @returns {string} Normalized location ID
     */
    normalizeLocation(location) {
        const locationMap = {
            'peacock': 'peacock',
            'dover': 'dover', 
            'massillon': 'massillon'
        };
        
        const normalized = location.trim().toLowerCase();
        return locationMap[normalized] || normalized;
    }

    /**
     * Create machine ID from location and changer number
     * @param {string} location - Location ID
     * @param {string} changerNumber - Changer number
     * @returns {string} Machine ID
     */
    createMachineId(location, changerNumber) {
        const locationPrefix = location.toUpperCase();
        return `${locationPrefix}_CH${changerNumber}_HA`;
    }

    /**
     * Validate parsed data
     * @param {object} parsedData - Parsed QR data
     * @returns {boolean} True if valid
     */
    validateParsedData(parsedData) {
        const required = ['location', 'changer', 'counterValue', 'dollarAmount'];
        
        for (const field of required) {
            if (!parsedData.hasOwnProperty(field)) {
                return false;
            }
        }
        
        if (parsedData.counterValue < 0 || parsedData.dollarAmount < 0) {
            return false;
        }
        
        if (!this.supportedLocations.includes(parsedData.location)) {
            return false;
        }
        
        return true;
    }

    /**
     * Format parsed data for display
     * @param {object} parsedData - Parsed QR data
     * @returns {string} Formatted display string
     */
    formatForDisplay(parsedData) {
        return `${parsedData.locationName}, Changer ${parsedData.changer}, Counter: ${parsedData.counterValue}, Amount: $${parsedData.dollarAmount}`;
    }

    /**
     * Get machine name for display
     * @param {object} parsedData - Parsed QR data
     * @returns {string} Machine display name
     */
    getMachineDisplayName(parsedData) {
        return `Changer ${parsedData.changer} - Hopper A`;
    }
}

// Create and export singleton instance
export const qrDataParser = new QRDataParser(); 