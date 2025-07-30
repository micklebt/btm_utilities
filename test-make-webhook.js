/**
 * Test script for Make.com webhook integration
 * Tests each location and changer combination
 */

import { makeWebhookHandler } from './js/make-webhook-handler.js';
import { locationManager } from './js/location-config.js';

// Test webhook URL - replace with your actual webhook URL
const TEST_WEBHOOK_URL = 'https://hook.make.com/your-scenario-webhook';

// Test data
const testCollector = 'Test User';
const testCounterValue = 100;

async function runTests() {
    console.log('Starting Make.com webhook tests...');
    
    // Initialize the webhook handler
    await makeWebhookHandler.init();
    
    // Set webhook URL
    makeWebhookHandler.setWebhookUrl('counterReadings', TEST_WEBHOOK_URL);
    
    // Get all locations
    const locations = locationManager.getLocations();
    
    // Test results
    const results = [];
    
    // Test each location and machine
    for (const location of locations) {
        console.log(`\nTesting location: ${location.name} (${location.id})`);
        
        const machines = locationManager.getMachines(location.id);
        
        for (const machine of machines) {
            console.log(`  Testing machine: ${machine.name} (${machine.id})`);
            
            // Prepare test data
            const testData = {
                locationId: location.id,
                machineId: machine.id,
                counterValue: testCounterValue,
                countingMode: machine.countingMode,
                collectorName: testCollector,
                comments: `Test submission for ${location.name} - ${machine.name}`
            };
            
            try {
                // Send test data to Make.com
                const result = await makeWebhookHandler.sendCounterReading(testData);
                
                // Log result
                console.log(`    Result: ${result.status === 'success' ? 'SUCCESS' : 'FAILED'}`);
                if (result.status === 'success') {
                    console.log(`    HTTP Status: ${result.data.make_response.status}`);
                } else {
                    console.log(`    Error: ${result.error}`);
                }
                
                // Store result
                results.push({
                    location: location.name,
                    machine: machine.name,
                    status: result.status,
                    httpStatus: result.status === 'success' ? result.data.make_response.status : null,
                    error: result.status === 'error' ? result.error : null
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