/**
 * Node.js compatible test script for Make.com webhook integration
 * Tests each location and changer combination
 */

// Import required modules
const fetch = require('node-fetch');

// Location configuration
const locationConfig = {
    locations: [
        { id: 'peacock', name: 'Peacock' },
        { id: 'dover', name: 'Dover' },
        { id: 'massillon', name: 'Massillon' }
    ],
    machines: {
        peacock: [
            { id: 'PEACOCK_CH1', name: 'Changer 1', changer: 1, countingMode: 'quarters' },
            { id: 'PEACOCK_CH2', name: 'Changer 2', changer: 2, countingMode: 'quarters' },
            { id: 'PEACOCK_CH3', name: 'Changer 3', changer: 3, countingMode: 'dollars' }
        ],
        dover: [
            { id: 'DOVER_CH1', name: 'Changer 1', changer: 1, countingMode: 'dollars' },
            { id: 'DOVER_CH2', name: 'Changer 2', changer: 2, countingMode: 'dollars' },
            { id: 'DOVER_CH3', name: 'Changer 3', changer: 3, countingMode: 'dollars' }
        ],
        massillon: [
            { id: 'MASSILLON_CH1', name: 'Changer 1', changer: 1, countingMode: 'quarters' },
            { id: 'MASSILLON_CH2', name: 'Changer 2', changer: 2, countingMode: 'quarters' },
            { id: 'MASSILLON_CH3', name: 'Changer 3', changer: 3, countingMode: 'dollars' },
            { id: 'MASSILLON_CH4', name: 'Changer 4', changer: 4, countingMode: 'dollars' }
        ]
    }
};

// Test webhook URL - replace with your actual webhook URL
const TEST_WEBHOOK_URL = process.argv[2] || 'https://hook.make.com/your-scenario-webhook';

// Test data
const testCollector = 'Test User';
const testCounterValue = 100;

// Helper function to send data to Make.com webhook
async function sendToMake(webhookUrl, payload) {
    try {
        console.log(`Sending data to Make.com webhook: ${webhookUrl}`);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const responseStatus = response.status;
        let responseData = null;
        
        // Don't try to parse the response body, just get the status
        console.log(`Make.com webhook response status: ${responseStatus}`);
        
        return {
            success: response.ok,
            status: responseStatus,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error sending data to Make.com:', error);
        throw new Error(`Failed to send data to Make.com: ${error.message}`);
    }
}

// Helper function to format counter reading data
function formatCounterReadingData(data) {
    // Calculate conversion factor based on counting mode
    const conversionFactor = data.countingMode === 'quarters' ? 0.25 : 1.0;
    
    // Calculate dollar amount
    const dollarAmount = data.counterValue * conversionFactor;
    
    return {
        // Basic info
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        
        // Location and machine info
        location: data.locationName,
        locationId: data.locationId,
        changer: data.changer,
        machineId: data.machineId,
        
        // Counter values
        counterValue: data.counterValue,
        previousValue: null,
        counterDifference: null,
        
        // Money calculations
        countingMode: data.countingMode,
        conversionFactor: conversionFactor,
        dollarAmount: dollarAmount,
        dollarDifference: null,
        
        // Additional info
        collectorName: data.collectorName,
        comments: data.comments,
        
        // Google Sheets info
        sheetId: '1K_Mc1lgoWw5iAvvCzyyuW6fCvY3gikcs8u42mOGMbDw',
        sheetTab: data.locationId.charAt(0).toUpperCase() + data.locationId.slice(1)
    };
}

async function runTests() {
    console.log('Starting Make.com webhook tests...');
    console.log(`Using webhook URL: ${TEST_WEBHOOK_URL}`);
    
    if (TEST_WEBHOOK_URL === 'https://hook.make.com/your-scenario-webhook') {
        console.error('Please provide a valid webhook URL as a command line argument');
        console.error('Usage: node test-make-webhook-node.js YOUR_WEBHOOK_URL');
        process.exit(1);
    }
    
    // Test results
    const results = [];
    
    // Test each location and machine
    for (const location of locationConfig.locations) {
        console.log(`\nTesting location: ${location.name} (${location.id})`);
        
        const machines = locationConfig.machines[location.id];
        
        for (const machine of machines) {
            console.log(`  Testing machine: ${machine.name} (${machine.id})`);
            
            // Prepare test data
            const testData = {
                locationId: location.id,
                locationName: location.name,
                machineId: machine.id,
                changer: machine.changer,
                counterValue: testCounterValue,
                countingMode: machine.countingMode,
                collectorName: testCollector,
                comments: `Test submission for ${location.name} - ${machine.name}`
            };
            
            try {
                // Format data for Make.com
                const payload = formatCounterReadingData(testData);
                
                // Send test data to Make.com
                const result = await sendToMake(TEST_WEBHOOK_URL, payload);
                
                // Log result
                console.log(`    Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
                console.log(`    HTTP Status: ${result.status}`);
                
                // Store result
                results.push({
                    location: location.name,
                    machine: machine.name,
                    status: result.success ? 'success' : 'error',
                    httpStatus: result.status,
                    error: !result.success ? 'Failed request' : null
                });
            } catch (error) {
                console.error(`    Error testing ${location.name} - ${machine.name}:`, error);
                
                // Store error
                results.push({
                    location: location.name,
                    machine: machine.name,
                    status: 'error',
                    httpStatus: null,
                    error: error.message
                });
            }
            
            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Print summary
    console.log('\n\n=== TEST SUMMARY ===');
    console.log(`Total tests: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'error').length}`);
    
    console.log('\nDetailed Results:');
    console.table(results);
}

// Run tests
runTests().catch(error => {
    console.error('Test execution failed:', error);
});