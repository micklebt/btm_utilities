/**
 * Module Diagnostic Script
 * Tests each module import individually to identify loading issues
 */

console.log('Module diagnostic starting...');

// List of modules to test
const modulesToTest = [
    { name: 'config.js', path: './js/config.js?v=1.0.2' },
    { name: 'storage.js', path: './js/storage.js?v=1.0.2' },
    { name: 'utils.js', path: './js/utils.js?v=1.0.2' },
    { name: 'logger.js', path: './js/logger.js?v=1.0.2' },
    { name: 'error-handler.js', path: './js/error-handler.js?v=1.0.2' },
    { name: 'secure-storage.js', path: './js/secure-storage.js?v=1.0.2' },
    { name: 'config-manager.js', path: './js/config-manager.js?v=1.0.2' },
    { name: 'environment-manager.js', path: './js/environment-manager.js?v=1.0.2' },
    { name: 'api-key-manager.js', path: './js/api-key-manager.js?v=1.0.2' },
    { name: 'qr-scanner.js', path: './js/qr-scanner.js?v=1.0.3' },
    { name: 'emergency-contacts.js', path: './js/emergency-contacts.js?v=1.0.2' },
    { name: 'security-cameras.js', path: './js/security-cameras.js?v=1.0.9' },
    { name: 'climate-control-fixed.js', path: './js/climate-control-fixed.js?v=1.0.1' },
    { name: 'location-config.js', path: './js/location-config.js?v=1.0.1' },
    { name: 'robust-qr-scanner.js', path: './js/robust-qr-scanner.js?v=1.0.1' }
];

// Test results
const testResults = {
    passed: [],
    failed: []
};

// Test a single module
async function testModule(moduleInfo) {
    const startTime = performance.now();
    
    try {
        console.log(`Testing ${moduleInfo.name}...`);
        const module = await import(moduleInfo.path);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`✅ ${moduleInfo.name} loaded successfully (${duration.toFixed(2)}ms)`);
        testResults.passed.push({
            name: moduleInfo.name,
            duration: duration,
            exports: Object.keys(module)
        });
        
        return true;
    } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.error(`❌ ${moduleInfo.name} failed to load (${duration.toFixed(2)}ms):`, error);
        testResults.failed.push({
            name: moduleInfo.name,
            error: error.message,
            duration: duration
        });
        
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting module diagnostic tests...');
    console.log(`Testing ${modulesToTest.length} modules...`);
    
    const startTime = performance.now();
    
    for (const moduleInfo of modulesToTest) {
        await testModule(moduleInfo);
    }
    
    const totalTime = performance.now() - startTime;
    
    // Display results
    console.log('\n=== MODULE DIAGNOSTIC RESULTS ===');
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Passed: ${testResults.passed.length}`);
    console.log(`Failed: ${testResults.failed.length}`);
    
    if (testResults.passed.length > 0) {
        console.log('\n✅ PASSED MODULES:');
        testResults.passed.forEach(result => {
            console.log(`  - ${result.name} (${result.duration.toFixed(2)}ms)`);
        });
    }
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ FAILED MODULES:');
        testResults.failed.forEach(result => {
            console.log(`  - ${result.name}: ${result.error}`);
        });
    }
    
    // Make results available globally
    window.moduleTestResults = testResults;
    
    return testResults;
}

// Export for use in other scripts
export { runAllTests, testModule, testResults };

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
    // Wait a bit for the page to load, then run tests
    setTimeout(() => {
        runAllTests();
    }, 1000);
}