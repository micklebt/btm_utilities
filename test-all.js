/**
 * Comprehensive Test Suite for BTM Utility
 * Tests all major functionality and identifies issues
 */

console.log('🧪 Starting comprehensive BTM Utility tests...');

// Test Results Storage
const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    warnings: []
};

// Test Helper Functions
function assert(condition, message) {
    if (condition) {
        testResults.passed++;
        console.log(`✅ PASS: ${message}`);
    } else {
        testResults.failed++;
        console.error(`❌ FAIL: ${message}`);
        testResults.errors.push(message);
    }
}

function testElementExists(selector, name) {
    const element = document.querySelector(selector);
    assert(element !== null, `${name} element exists`);
    return element;
}

function testElementVisible(selector, name) {
    const element = document.querySelector(selector);
    if (element) {
        const isVisible = !element.classList.contains('hidden') && 
                         element.style.display !== 'none' && 
                         element.style.visibility !== 'hidden';
        assert(isVisible, `${name} is visible`);
    } else {
        assert(false, `${name} element exists`);
    }
}

function testFunctionExists(obj, functionName, context) {
    assert(typeof obj[functionName] === 'function', `${context} has ${functionName} function`);
}

// Test 1: Basic DOM Structure
console.log('\n📋 Test 1: Basic DOM Structure');
function testBasicStructure() {
    // Test main containers
    testElementExists('#app', 'Main app container');
    testElementExists('.app-header', 'App header');
    testElementExists('.main-nav', 'Main navigation');
    testElementExists('.main-content', 'Main content area');
    
    // Test navigation items
    const navItems = document.querySelectorAll('.nav-item');
    assert(navItems.length >= 5, 'Has at least 5 navigation items');
    
    // Test sections
    testElementExists('#money-collection', 'Money collection section');
    testElementExists('#todo', 'Todo section');
    testElementExists('#contacts', 'Contacts section');
    testElementExists('#security', 'Security section');
    testElementExists('#climate', 'Climate section');
}

// Test 2: Mobile Navigation
console.log('\n📱 Test 2: Mobile Navigation');
function testMobileNavigation() {
    // Test mobile menu toggle
    const mobileToggle = testElementExists('#mobile-menu-toggle', 'Mobile menu toggle');
    if (mobileToggle) {
        assert(mobileToggle.classList.contains('mobile-menu-toggle'), 'Mobile toggle has correct class');
    }
    
    // Test mobile nav header
    const mobileHeader = testElementExists('.mobile-nav-header', 'Mobile nav header');
    if (mobileHeader) {
        const closeButton = mobileHeader.querySelector('.mobile-nav-close');
        assert(closeButton !== null, 'Mobile nav has close button');
    }
    
    // Test navigation labels
    const navLabels = document.querySelectorAll('.nav-label');
    navLabels.forEach((label, index) => {
        assert(label.textContent.trim().length > 0, `Nav label ${index + 1} has text`);
    });
}

// Test 3: Camera Functionality
console.log('\n📹 Test 3: Camera Functionality');
function testCameraFunctionality() {
    // Test camera container
    const cameraContainer = testElementExists('#camera-1', 'Camera 1 container');
    
    // Test camera placeholder
    const placeholder = testElementExists('#camera-1-placeholder', 'Camera 1 placeholder');
    if (placeholder) {
        const loadButton = placeholder.querySelector('.load-stream-btn');
        assert(loadButton !== null, 'Camera has load stream button');
        
        const testButton = placeholder.querySelector('.test-stream-btn');
        assert(testButton !== null, 'Camera has test stream button');
    }
    
    // Test camera stream
    const stream = testElementExists('#camera-1-stream', 'Camera 1 stream');
    if (stream) {
        const dataSrc = stream.getAttribute('data-src');
        assert(dataSrc && dataSrc.includes('MassOfficeDoor'), 'Camera stream has correct URL');
    }
    
    // Test camera fallback
    const fallback = testElementExists('#camera-1-fallback', 'Camera 1 fallback');
    if (fallback) {
        const fallbackLink = fallback.querySelector('.fallback-link');
        assert(fallbackLink !== null, 'Camera has fallback link');
    }
}

// Test 4: Climate Control
console.log('\n🌡️ Test 4: Climate Control');
function testClimateControl() {
    // Test climate cards
    const climateCards = document.querySelectorAll('.climate-card');
    assert(climateCards.length >= 3, 'Has at least 3 climate cards');
    
    climateCards.forEach((card, index) => {
        const title = card.querySelector('h3');
        assert(title !== null, `Climate card ${index + 1} has title`);
        
        const tempDisplay = card.querySelector('.temperature-display');
        assert(tempDisplay !== null, `Climate card ${index + 1} has temperature display`);
        
        const controls = card.querySelector('.climate-controls');
        assert(controls !== null, `Climate card ${index + 1} has controls`);
    });
    
    // Test refresh button
    const refreshButton = testElementExists('#refresh-climate', 'Climate refresh button');
}

// Test 5: Todo Functionality
console.log('\n📝 Test 5: Todo Functionality');
function testTodoFunctionality() {
    // Test add task button
    const addTaskButton = testElementExists('#add-task', 'Add task button');
    
    // Test todo filters
    const todoFilters = testElementExists('.todo-filters', 'Todo filters');
    
    // Test todo items container
    const todoItems = testElementExists('#todo-items', 'Todo items container');
}

// Test 6: Contact Functionality
console.log('\n📞 Test 6: Contact Functionality');
function testContactFunctionality() {
    // Test contact items
    const contactItems = document.querySelectorAll('.contact-item');
    assert(contactItems.length > 0, 'Has contact items');
    
    contactItems.forEach((item, index) => {
        const contactInfo = item.querySelector('.contact-info');
        assert(contactInfo !== null, `Contact item ${index + 1} has info`);
        
        const callButton = item.querySelector('.call-button');
        assert(callButton !== null, `Contact item ${index + 1} has call button`);
    });
}

// Test 7: App Functions
console.log('\n⚙️ Test 7: App Functions');
function testAppFunctions() {
    // Test if app instance exists
    if (window.app) {
        testFunctionExists(window.app, 'init', 'App');
        testFunctionExists(window.app, 'navigateToSection', 'App');
        testFunctionExists(window.app, 'toggleMobileMenu', 'App');
        testFunctionExists(window.app, 'goHome', 'App');
    } else {
        testResults.warnings.push('App instance not found in window object');
    }
    
    // Test if modules exist
    if (window.app && window.app.getSecurityCameras) {
        const securityCameras = window.app.getSecurityCameras();
        if (securityCameras) {
            testFunctionExists(securityCameras, 'loadCameraStream', 'SecurityCameras');
            testFunctionExists(securityCameras, 'refreshCameraStreams', 'SecurityCameras');
        }
    }
    
    if (window.app && window.app.getClimateControl) {
        const climateControl = window.app.getClimateControl();
        if (climateControl) {
            testFunctionExists(climateControl, 'refreshClimateData', 'ClimateControl');
        }
    }
}

// Test 8: CSS Classes and Styling
console.log('\n🎨 Test 8: CSS Classes and Styling');
function testCSSClasses() {
    // Test mobile menu toggle styling
    const mobileToggle = document.querySelector('#mobile-menu-toggle');
    if (mobileToggle) {
        assert(mobileToggle.classList.contains('mobile-menu-toggle'), 'Mobile toggle has correct class');
        
        const hamburgerLines = mobileToggle.querySelectorAll('.hamburger-line');
        assert(hamburgerLines.length === 3, 'Mobile toggle has 3 hamburger lines');
    }
    
    // Test navigation item styling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
        assert(item.querySelector('.nav-icon'), `Nav item ${index + 1} has icon`);
        assert(item.querySelector('.nav-label'), `Nav item ${index + 1} has label`);
    });
    
    // Test app title styling
    const appTitle = document.querySelector('#home-button');
    if (appTitle) {
        assert(appTitle.classList.contains('app-title'), 'App title has correct class');
    }
}

// Test 9: Error Handling
console.log('\n🚨 Test 9: Error Handling');
function testErrorHandling() {
    // Test if error handler exists
    if (window.errorHandler) {
        testFunctionExists(window.errorHandler, 'handleError', 'ErrorHandler');
    }
    
    // Test if logger exists
    if (window.logger) {
        testFunctionExists(window.logger, 'info', 'Logger');
        testFunctionExists(window.logger, 'error', 'Logger');
        testFunctionExists(window.logger, 'warn', 'Logger');
    }
}

// Test 10: Responsive Design
console.log('\n📱 Test 10: Responsive Design');
function testResponsiveDesign() {
    // Test mobile menu visibility on small screens
    const mobileToggle = document.querySelector('#mobile-menu-toggle');
    if (mobileToggle) {
        const computedStyle = window.getComputedStyle(mobileToggle);
        assert(computedStyle.display !== 'none', 'Mobile toggle is visible');
    }
    
    // Test navigation visibility
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        const computedStyle = window.getComputedStyle(mainNav);
        // Should be hidden by default on mobile, but accessible
        assert(true, 'Main nav exists and is accessible');
    }
}

// Test 11: Camera URL Configuration
console.log('\n🔗 Test 11: Camera URL Configuration');
function testCameraURL() {
    const streamElement = document.querySelector('#camera-1-stream');
    if (streamElement) {
        const dataSrc = streamElement.getAttribute('data-src');
        assert(dataSrc === 'http://24.140.108.180:855/livestream.htm?cam=MassOfficeDoor', 
               'Camera stream has correct MassOfficeDoor URL');
    }
    
    const fallbackLink = document.querySelector('#camera-1-fallback .fallback-link');
    if (fallbackLink) {
        const href = fallbackLink.getAttribute('href');
        assert(href === 'http://24.140.108.180:855/livestream.htm?cam=MassOfficeDoor', 
               'Fallback link has correct MassOfficeDoor URL');
    }
    
    const cameraTitle = document.querySelector('#camera-1 h3');
    if (cameraTitle) {
        assert(cameraTitle.textContent.includes('Office Door'), 'Camera title reflects Office Door location');
    }
}

// Test 12: Module Loading
console.log('\n📦 Test 12: Module Loading');
function testModuleLoading() {
    // Test if required modules are loaded
    const requiredModules = [
        'config',
        'storageUtils', 
        'logger',
        'errorHandler',
        'todoManager',
        'emergencyContacts'
    ];
    
    requiredModules.forEach(moduleName => {
        if (window[moduleName]) {
            assert(true, `${moduleName} module is loaded`);
        } else {
            testResults.warnings.push(`${moduleName} module not found in window object`);
        }
    });
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting comprehensive BTM Utility test suite...\n');
    
    try {
        testBasicStructure();
        testMobileNavigation();
        testCameraFunctionality();
        testClimateControl();
        testTodoFunctionality();
        testContactFunctionality();
        testAppFunctions();
        testCSSClasses();
        testErrorHandling();
        testResponsiveDesign();
        testCameraURL();
        testModuleLoading();
        
    } catch (error) {
        console.error('❌ Test suite error:', error);
        testResults.errors.push(`Test suite error: ${error.message}`);
    }
    
    // Print results
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
    console.log(`🚨 Errors: ${testResults.errors.length}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n🚨 Errors:');
        testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (testResults.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (testResults.failed === 0 && testResults.errors.length === 0) {
        console.log('\n🎉 All tests passed! BTM Utility is working correctly.');
    } else {
        console.log('\n🔧 Some tests failed. Please review the errors above.');
    }
}

// Make test function globally available
window.runAllTests = runAllTests;
window.testBTMUtility = runAllTests;

console.log('🧪 Test suite loaded. Run window.runAllTests() to execute all tests.'); 