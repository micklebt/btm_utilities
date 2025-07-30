/**
 * Location Configuration Module
 * Centralized location and machine data for BTM Utility application
 * Updated to match actual machine configuration
 */

export const locationConfig = {
    // Available locations
    locations: [
        {
            id: 'peacock',
            name: 'Peacock',
            address: '622 2nd Street Northwest',
            changers: 3,
            cameras: 2,
            temperatureSensors: true
        },
        {
            id: 'dover',
            name: 'Dover',
            address: '931 North Worcester Ave',
            changers: 3,
            cameras: 2,
            temperatureSensors: true
        },
        {
            id: 'massillon',
            name: 'Massillon',
            address: '2348 Lincoln Way East',
            changers: 4,
            cameras: 2,
            temperatureSensors: true
        }
    ],

    // Machine configurations by location (updated to match actual setup)
    machines: {
        peacock: [
            // Changer 1 - quarters mode (4 = $1)
            { id: 'PEACOCK_CH1', name: 'Changer 1', changer: 1, countingMode: 'quarters' },
            // Changer 2 - quarters mode (4 = $1)
            { id: 'PEACOCK_CH2', name: 'Changer 2', changer: 2, countingMode: 'quarters' },
            // Changer 3 - dollars mode (1 = $1)
            { id: 'PEACOCK_CH3', name: 'Changer 3', changer: 3, countingMode: 'dollars' }
        ],
        dover: [
            // Changer 1 - dollars mode (1 = $1)
            { id: 'DOVER_CH1', name: 'Changer 1', changer: 1, countingMode: 'dollars' },
            // Changer 2 - dollars mode (1 = $1)
            { id: 'DOVER_CH2', name: 'Changer 2', changer: 2, countingMode: 'dollars' },
            // Changer 3 - dollars mode (1 = $1)
            { id: 'DOVER_CH3', name: 'Changer 3', changer: 3, countingMode: 'dollars' }
        ],
        massillon: [
            // Changer 1 - quarters mode (4 = $1)
            { id: 'MASSILLON_CH1', name: 'Changer 1', changer: 1, countingMode: 'quarters' },
            // Changer 2 - quarters mode (4 = $1)
            { id: 'MASSILLON_CH2', name: 'Changer 2', changer: 2, countingMode: 'quarters' },
            // Changer 3 - dollars mode (1 = $1)
            { id: 'MASSILLON_CH3', name: 'Changer 3', changer: 3, countingMode: 'dollars' },
            // Changer 4 - dollars mode (1 = $1)
            { id: 'MASSILLON_CH4', name: 'Changer 4', changer: 4, countingMode: 'dollars' }
        ]
    },

    // Camera configurations
    cameras: {
        peacock: [
            { id: 'PEACOCK_CAM_01', name: 'Peacock - Camera 1', streamUrl: 'http://24.140.108.180:855/livestream.htm?cam=PeacockCam1' },
            { id: 'PEACOCK_CAM_02', name: 'Peacock - Camera 2', streamUrl: 'http://24.140.108.180:855/livestream.htm?cam=PeacockCam2' }
        ],
        dover: [
            { id: 'DOVER_CAM_01', name: 'Dover - Camera 1', streamUrl: 'http://24.140.108.180:855/livestream.htm?cam=DoverCam1' },
            { id: 'DOVER_CAM_02', name: 'Dover - Camera 2', streamUrl: 'http://24.140.108.180:855/livestream.htm?cam=DoverCam2' }
        ],
        massillon: [
            { id: 'MASSILLON_CAM_01', name: 'Massillon - Office Door', streamUrl: 'http://24.140.108.180:855/livestream.htm?cam=MassOfficeDoor' },
            { id: 'MASSILLON_CAM_02', name: 'Massillon - Camera 2', streamUrl: 'http://24.140.108.180:855/livestream.htm?cam=MassCam2' }
        ]
    },

    // Temperature sensor configurations
    temperatureSensors: {
        peacock: { id: 'PEACOCK_TEMP_01', name: 'Peacock Temperature' },
        dover: { id: 'DOVER_TEMP_01', name: 'Dover Temperature' },
        massillon: { id: 'MASSILLON_TEMP_01', name: 'Massillon Temperature' }
    }
};

// Utility functions
export class LocationManager {
    constructor() {
        this.config = locationConfig;
    }

    // Get all locations
    getLocations() {
        return this.config.locations;
    }

    // Get location by ID
    getLocation(locationId) {
        return this.config.locations.find(loc => loc.id === locationId);
    }

    // Get machines for a location
    getMachines(locationId) {
        return this.config.machines[locationId] || [];
    }

    // Get cameras for a location
    getCameras(locationId) {
        return this.config.cameras[locationId] || [];
    }

    // Get temperature sensor for a location
    getTemperatureSensor(locationId) {
        return this.config.temperatureSensors[locationId];
    }

    // Get QR codes for a location
    getQRCodes(locationId) {
        const location = this.getLocation(locationId);
        return location ? location.qrCodes : [];
    }

    // Populate location dropdown
    populateLocationDropdown(selectElement) {
        if (!selectElement) return;

        // Clear existing options except the first one
        const firstOption = selectElement.querySelector('option[value=""]');
        selectElement.innerHTML = '';
        if (firstOption) {
            selectElement.appendChild(firstOption);
        }

        // Add location options
        this.config.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            selectElement.appendChild(option);
        });
    }

    // Populate machine dropdown based on selected location
    populateMachineDropdown(selectElement, locationId) {
        if (!selectElement) return;

        // Clear existing options except the first one
        const firstOption = selectElement.querySelector('option[value=""]');
        selectElement.innerHTML = '';
        if (firstOption) {
            selectElement.appendChild(firstOption);
        }

        // Add machine options for the selected location
        const machines = this.getMachines(locationId);
        machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine.id;
            option.textContent = machine.name;
            selectElement.appendChild(option);
        });
    }

    // Get machine details by ID
    getMachineById(machineId) {
        for (const locationId in this.config.machines) {
            const machine = this.config.machines[locationId].find(m => m.id === machineId);
            if (machine) {
                return { ...machine, locationId };
            }
        }
        return null;
    }

    // Validate location and machine combination
    validateLocationMachine(locationId, machineId) {
        const machines = this.getMachines(locationId);
        return machines.some(machine => machine.id === machineId);
    }
}

// Create and export a singleton instance
export const locationManager = new LocationManager();

export default locationManager; 