// Simple dropdown fix - direct and straightforward
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simple dropdown fix: DOM loaded');
    
    const locationSelect = document.getElementById('location-select');
    const machineSelect = document.getElementById('machine-select');
    
    if (!locationSelect || !machineSelect) {
        console.error('Dropdown elements not found');
        return;
    }
    
    console.log('Dropdown elements found, setting up change listener');
    
    // Machine data for each location
    const machines = {
        'peacock': [
            { id: 'PEACOCK_CH1_HA', name: 'Changer 1 - Hopper A' },
            { id: 'PEACOCK_CH2_HA', name: 'Changer 2 - Hopper A' },
            { id: 'PEACOCK_CH3_HA', name: 'Changer 3 - Hopper A' }
        ],
        'dover': [
            { id: 'DOVER_CH1_HA', name: 'Changer 1 - Hopper A' },
            { id: 'DOVER_CH2_HA', name: 'Changer 2 - Hopper A' },
            { id: 'DOVER_CH3_HA', name: 'Changer 3 - Hopper A' }
        ],
        'massillon': [
            { id: 'MASSILLON_CH1_HA', name: 'Changer 1 - Hopper A' },
            { id: 'MASSILLON_CH1_HB', name: 'Changer 1 - Hopper B' },
            { id: 'MASSILLON_CH2_HA', name: 'Changer 2 - Hopper A' },
            { id: 'MASSILLON_CH2_HB', name: 'Changer 2 - Hopper B' }
        ]
    };
    
    // Function to populate machine dropdown
    function populateMachines(locationId) {
        console.log('Populating machines for location:', locationId);
        
        // Clear existing options
        machineSelect.innerHTML = '<option value="">Select Machine</option>';
        
        // Add machines for selected location
        if (machines[locationId]) {
            machines[locationId].forEach(machine => {
                const option = document.createElement('option');
                option.value = machine.id;
                option.textContent = machine.name;
                machineSelect.appendChild(option);
            });
            console.log(`Added ${machines[locationId].length} machines for ${locationId}`);
        }
    }
    
    // Add change listener to location dropdown
    locationSelect.addEventListener('change', function(e) {
        const selectedLocation = e.target.value;
        console.log('Location changed to:', selectedLocation);
        
        if (selectedLocation) {
            populateMachines(selectedLocation);
        } else {
            machineSelect.innerHTML = '<option value="">Select Machine</option>';
        }
    });
    
    console.log('Dropdown fix: Change listener attached successfully');
}); 