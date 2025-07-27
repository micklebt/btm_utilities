#!/usr/bin/env node

/**
 * Development Setup Script for BTM Utility
 * Checks system requirements and sets up development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Console logging functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
    log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}`);
    log('='.repeat(message.length));
}

// Check if command exists
function commandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        try {
            execSync(`where ${command}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
}

// Get version of a command
function getVersion(command) {
    try {
        const version = execSync(`${command} --version`, { encoding: 'utf8' });
        return version.trim();
    } catch {
        return null;
    }
}

// Check system requirements
function checkSystemRequirements() {
    logHeader('Checking System Requirements');

    const requirements = {
        node: { min: '14.0.0', current: null, installed: false },
        npm: { min: '6.0.0', current: null, installed: false },
        git: { min: '2.0.0', current: null, installed: false },
    };

    // Check Node.js
    if (commandExists('node')) {
        requirements.node.installed = true;
        requirements.node.current = getVersion('node');
        if (requirements.node.current) {
            logSuccess(`Node.js: ${requirements.node.current}`);
        }
    } else {
        logError('Node.js is not installed');
        logInfo('Download from: https://nodejs.org/');
    }

    // Check npm
    if (commandExists('npm')) {
        requirements.npm.installed = true;
        requirements.npm.current = getVersion('npm');
        if (requirements.npm.current) {
            logSuccess(`npm: ${requirements.npm.current}`);
        }
    } else {
        logError('npm is not installed');
    }

    // Check Git
    if (commandExists('git')) {
        requirements.git.installed = true;
        requirements.git.current = getVersion('git');
        if (requirements.git.current) {
            logSuccess(`Git: ${requirements.git.current}`);
        }
    } else {
        logWarning('Git is not installed (optional for development)');
    }

    return requirements;
}

// Install npm dependencies
function installDependencies() {
    logHeader('Installing Dependencies');

    if (!fs.existsSync('package.json')) {
        logError('package.json not found');
        return false;
    }

    try {
        logInfo('Installing npm dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        logSuccess('Dependencies installed successfully');
        return true;
    } catch (error) {
        logError('Failed to install dependencies');
        return false;
    }
}

// Create development configuration
function createDevConfig() {
    logHeader('Creating Development Configuration');

    const devConfig = {
        development: true,
        debug: true,
        port: 3000,
        host: 'localhost',
        cors: true,
        hotReload: true,
    };

    try {
        fs.writeFileSync('dev-config.json', JSON.stringify(devConfig, null, 2));
        logSuccess('Development configuration created');
        return true;
    } catch (error) {
        logError('Failed to create development configuration');
        return false;
    }
}

// Check project structure
function checkProjectStructure() {
    logHeader('Checking Project Structure');

    const requiredFiles = [
        'index.html',
        'manifest.json',
        'package.json',
        'css/reset.css',
        'css/base.css',
        'css/components.css',
        'css/layout.css',
        'css/utilities.css',
        'js/config.js',
        'js/utils.js',
        'js/storage.js',
        'js/logger.js',
        'js/error-handler.js',
        'js/app.js',
    ];

    const requiredDirs = [
        'css',
        'js',
        'data',
    ];

    let allGood = true;

    // Check directories
    for (const dir of requiredDirs) {
        if (fs.existsSync(dir)) {
            logSuccess(`Directory: ${dir}/`);
        } else {
            logError(`Missing directory: ${dir}/`);
            allGood = false;
        }
    }

    // Check files
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            logSuccess(`File: ${file}`);
        } else {
            logError(`Missing file: ${file}`);
            allGood = false;
        }
    }

    return allGood;
}

// Create development scripts
function createDevScripts() {
    logHeader('Creating Development Scripts');

    const scripts = {
        'start-dev.bat': '@echo off\necho Starting BTM Utility Development Server...\nnode server.js',
        'start-dev.sh': '#!/bin/bash\necho "Starting BTM Utility Development Server..."\nnode server.js',
        'dev-setup.bat': '@echo off\necho Setting up BTM Utility Development Environment...\nnode setup-dev.js',
        'dev-setup.sh': '#!/bin/bash\necho "Setting up BTM Utility Development Environment..."\nnode setup-dev.js',
    };

    for (const [filename, content] of Object.entries(scripts)) {
        try {
            fs.writeFileSync(filename, content);
            // Make shell scripts executable on Unix systems
            if (filename.endsWith('.sh')) {
                fs.chmodSync(filename, '755');
            }
            logSuccess(`Created: ${filename}`);
        } catch (error) {
            logError(`Failed to create: ${filename}`);
        }
    }
}

// Test development server
function testServer() {
    logHeader('Testing Development Server');

    return new Promise((resolve) => {
        const server = spawn('node', ['server.js'], {
            stdio: 'pipe',
            detached: true,
        });

        let output = '';
        let timeout;

        server.stdout.on('data', (data) => {
            output += data.toString();
            if (output.includes('Development Server running at:')) {
                clearTimeout(timeout);
                server.kill();
                logSuccess('Development server test passed');
                resolve(true);
            }
        });

        server.stderr.on('data', (data) => {
            logError(`Server error: ${data.toString()}`);
        });

        timeout = setTimeout(() => {
            server.kill();
            logError('Server test timed out');
            resolve(false);
        }, 5000);

        server.on('close', (code) => {
            if (code !== 0 && !output.includes('Development Server running at:')) {
                logError(`Server exited with code ${code}`);
                resolve(false);
            }
        });
    });
}

// Main setup function
async function main() {
    logHeader('BTM Utility Development Environment Setup');
    logInfo('This script will set up your development environment for BTM Utility');

    // Check system requirements
    const requirements = checkSystemRequirements();

    // Check project structure
    const structureOk = checkProjectStructure();

    if (!structureOk) {
        logError('Project structure check failed. Please ensure all required files exist.');
        process.exit(1);
    }

    // Install dependencies
    const depsInstalled = installDependencies();

    if (!depsInstalled) {
        logError('Failed to install dependencies. Please check your npm installation.');
        process.exit(1);
    }

    // Create development configuration
    createDevConfig();

    // Create development scripts
    createDevScripts();

    // Test server
    logInfo('Testing development server...');
    const serverTest = await testServer();

    if (!serverTest) {
        logWarning('Server test failed, but setup can continue');
    }

    // Final summary
    logHeader('Setup Complete');
    logSuccess('BTM Utility development environment is ready!');
    logInfo('\nNext steps:');
    logInfo('1. Run: npm start (or node server.js)');
    logInfo('2. Open: http://localhost:3000');
    logInfo('3. For mobile testing, use your network IP address');
    logInfo('\nAvailable commands:');
    logInfo('- npm start: Start development server');
    logInfo('- npm run dev: Start with CORS enabled');
    logInfo('- npm run serve-live: Start with live reload');
    logInfo('- node server.js: Start custom server');
}

// Run setup
if (require.main === module) {
    main().catch((error) => {
        logError(`Setup failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    checkSystemRequirements,
    installDependencies,
    createDevConfig,
    checkProjectStructure,
    createDevScripts,
    testServer,
}; 