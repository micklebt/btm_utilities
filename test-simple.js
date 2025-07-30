/**
 * Simple Test Suite for BTM Utility
 * Basic functionality verification
 */

console.log('🧪 Starting simple BTM Utility tests...');

// Simple test results
let testPassed = 0;
let testFailed = 0;
let errors = [];

function simpleTest(condition, message) {
    if (condition) {
        testPassed++;
        console.log(`✅ PASS: ${message}`);
    } else {
        testFailed++;
        console.error(`❌ FAIL: ${message}`);
        errors.push(message);
    }
}

// Test 1: Check if app loads
console.log('\n📋 Test 1: Application Loading');
function testAppLoading() {
    // Check if main elements exist
    simpleTest(document.getElementById('app'), 'Main app container exists');
    simpleTest(document.getElementById('money-collection'), 'Money collection section exists');

    simpleTest(document.getElementById('contacts'), 'Contacts section exists');
    simpleTest(document.getElementById('security'), 'Security section exists');
    simpleTest(document.getElementById('climate'), 'Climate section exists');
}

// Test 2: Check mobile navigation
console.log('\n📱 Test 2: Mobile Navigation');
function testMobileNav() {
    simpleTest(document.getElementById('mobile-menu-toggle'), 'Mobile menu toggle exists');
    simpleTest(document.querySelector('.mobile-nav-header'), 'Mobile nav header exists');
    simpleTest(document.querySelector('.mobile-nav-close'), 'Mobile nav close button exists');
    
    // Check navigation items
    const navItems = document.querySelectorAll('.nav-item');
    simpleTest(navItems.length >= 5, `Has ${navItems.length} navigation items`);
    
    // Check navigation labels
    const navLabels = document.querySelectorAll('.nav-label');
    navLabels.forEach((label, index) => {
        simpleTest(label.textContent.trim().length > 0, `Nav label ${index + 1} has text: "${label.textContent.trim()}"`);
    });
}

// Test 3: Check camera functionality
console.log('\n📹 Test 3: Camera Functionality');
function testCameraFunctionality() {
    simpleTest(document.getElementById('camera-1'), 'Camera 1 container exists');
    simpleTest(document.getElementById('camera-1-placeholder'), 'Camera 1 placeholder exists');
    simpleTest(document.getElementById('camera-1-stream'), 'Camera 1 stream exists');
    simpleTest(document.getElementById('camera-1-fallback'), 'Camera 1 fallback exists');
    
    // Check camera URL
    const streamElement = document.getElementById('camera-1-stream');
    if (streamElement) {
        const dataSrc = streamElement.getAttribute('data-src');
        simpleTest(dataSrc && dataSrc.includes('MassOfficeDoor'), `Camera stream has correct URL: ${dataSrc}`);
    }
    
    // Check camera title
    const cameraTitle = document.querySelector('#camera-1 h3');
    if (cameraTitle) {
        simpleTest(cameraTitle.textContent.includes('Office Door'), `Camera title reflects location: "${cameraTitle.textContent}"`);
    }
}

// Test 4: Check climate control
console.log('\n🌡️ Test 4: Climate Control');
function testClimateControl() {
    const climateCards = document.querySelectorAll('.climate-card');
    simpleTest(climateCards.length >= 3, `Has ${climateCards.length} climate cards`);
    
    simpleTest(document.getElementById('refresh-climate'), 'Climate refresh button exists');
}



// Test 6: Check contact functionality
console.log('\n📞 Test 6: Contact Functionality');
function testContactFunctionality() {
    const contactItems = document.querySelectorAll('.contact-item');
    simpleTest(contactItems.length > 0, `Has ${contactItems.length} contact items`);
    
    contactItems.forEach((item, index) => {
        simpleTest(item.querySelector('.contact-info'), `Contact item ${index + 1} has info`);
        simpleTest(item.querySelector('.call-button'), `Contact item ${index + 1} has call button`);
    });
}

// Test 7: Check app functions
console.log('\n⚙️ Test 7: App Functions');
function testAppFunctions() {
    if (window.app) {
        simpleTest(typeof window.app.init === 'function', 'App has init function');
        simpleTest(typeof window.app.navigateToSection === 'function', 'App has navigateToSection function');
        simpleTest(typeof window.app.toggleMobileMenu === 'function', 'App has toggleMobileMenu function');
        simpleTest(typeof window.app.goHome === 'function', 'App has goHome function');
    } else {
        simpleTest(false, 'App instance not found in window object');
    }
}

// Test 8: Check CSS classes
console.log('\n🎨 Test 8: CSS Classes');
function testCSSClasses() {
    const mobileToggle = document.querySelector('#mobile-menu-toggle');
    if (mobileToggle) {
        simpleTest(mobileToggle.classList.contains('mobile-menu-toggle'), 'Mobile toggle has correct class');
        
        const hamburgerLines = mobileToggle.querySelectorAll('.hamburger-line');
        simpleTest(hamburgerLines.length === 3, `Mobile toggle has ${hamburgerLines.length} hamburger lines`);
    }
    
    const appTitle = document.querySelector('#home-button');
    if (appTitle) {
        simpleTest(appTitle.classList.contains('app-title'), 'App title has correct class');
    }
}

// Test 9: Check for console errors
console.log('\n🚨 Test 9: Error Checking');
function testErrorChecking() {
    // Check if error handler exists
    if (window.errorHandler) {
        simpleTest(typeof window.errorHandler.handleError === 'function', 'Error handler has handleError function');
    }
    
    // Check if logger exists
    if (window.logger) {
        simpleTest(typeof window.logger.info === 'function', 'Logger has info function');
        simpleTest(typeof window.logger.error === 'function', 'Logger has error function');
    }
}

// Run all simple tests
function runSimpleTests() {
    console.log('🚀 Starting simple BTM Utility test suite...\n');
    
    try {
        testAppLoading();
        testMobileNav();
        testCameraFunctionality();
        testClimateControl();

        testContactFunctionality();
        testAppFunctions();
        testCSSClasses();
        testErrorChecking();
        
    } catch (error) {
        console.error('❌ Test suite error:', error);
        errors.push(`Test suite error: ${error.message}`);
    }
    
    // Print results
    console.log('\n📊 Simple Test Results Summary:');
    console.log(`✅ Passed: ${testPassed}`);
    console.log(`❌ Failed: ${testFailed}`);
    console.log(`🚨 Errors: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\n🚨 Errors:');
        errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (testFailed === 0 && errors.length === 0) {
        console.log('\n🎉 All simple tests passed! BTM Utility is working correctly.');
    } else {
        console.log('\n🔧 Some simple tests failed. Please review the errors above.');
    }
}

// Make test function globally available
window.runSimpleTests = runSimpleTests;
window.testBTMSimple = runSimpleTests;

console.log('🧪 Simple test suite loaded. Run window.runSimpleTests() to execute simple tests.'); 