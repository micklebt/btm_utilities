/**
 * Development Server for BTM Utility
 * Custom Node.js server with PWA support and proper headers
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Path to shared tasks file
const TASKS_FILE = path.join(DATA_DIR, 'shared-tasks.json');

// Path to counter readings file
const READINGS_FILE = path.join(DATA_DIR, 'counter-readings.json');

// Initialize empty tasks file if it doesn't exist
if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, '[]');
}

// Initialize empty readings file if it doesn't exist
if (!fs.existsSync(READINGS_FILE)) {
    fs.writeFileSync(READINGS_FILE, '{}');
}

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.manifest': 'application/manifest+json',
    '.webmanifest': 'application/manifest+json',
};

// Security headers
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// CORS headers for development
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

// PWA headers
const PWA_HEADERS = {
    'Service-Worker-Allowed': '/',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
};

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Handle API endpoints
    if (pathname === '/api/tasks') {
        // Set CORS headers for API endpoints
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        // GET tasks
        if (req.method === 'GET') {
            try {
                const tasks = fs.readFileSync(TASKS_FILE, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(tasks);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to load tasks' }));
            }
            return;
        }
        
        // POST tasks
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const tasks = JSON.parse(body);
                    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to save tasks' }));
                }
            });
            return;
        }
    }

    // Add endpoint for getting previous counter readings
    if (pathname === '/api/previous-reading') {
        // Set CORS headers for API endpoints
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        // GET previous reading for a specific machine
        if (req.method === 'GET') {
            try {
                const query = url.parse(req.url, true).query;
                const { locationId, machineId } = query;
                
                if (!locationId || !machineId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'error', 
                        error: 'Missing locationId or machineId parameter' 
                    }));
                    return;
                }
                
                // Read the readings file
                const readings = JSON.parse(fs.readFileSync(READINGS_FILE, 'utf8'));
                const key = `${locationId}_${machineId}`;
                const previousReading = readings[key] || null;
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'success',
                    data: previousReading
                }));
            } catch (error) {
                console.error('Error retrieving previous reading:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    error: 'Failed to retrieve previous reading' 
                }));
            }
            return;
        }
    }

    // Add endpoint for submitting counter readings
    if (pathname === '/api/counter-readings') {
        // Set CORS headers for API endpoints
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        // POST a new counter reading
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { locationId, machineId, counterValue, countingMode, collectorName, comments } = data;
                    
                    if (!locationId || !machineId || !counterValue) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            status: 'error', 
                            error: 'Missing required parameters' 
                        }));
                        return;
                    }
                    
                    // Read the current readings file
                    const readings = JSON.parse(fs.readFileSync(READINGS_FILE, 'utf8'));
                    const key = `${locationId}_${machineId}`;
                    const previousReading = readings[key] || null;
                    
                    // Calculate differences and dollar amounts
                    const conversionFactor = countingMode === 'quarters' ? 0.25 : 1.0;
                    const dollarAmount = counterValue * conversionFactor;
                    
                    let counterDifference = null;
                    let dollarDifference = null;
                    
                    if (previousReading && previousReading.counterValue) {
                        counterDifference = counterValue - previousReading.counterValue;
                        dollarDifference = counterDifference * conversionFactor;
                    }
                    
                    // Create the new reading record
                    const newReading = {
                        locationId,
                        machineId,
                        counterValue: parseInt(counterValue),
                        countingMode,
                        conversionFactor,
                        dollarAmount,
                        previousValue: previousReading ? previousReading.counterValue : null,
                        counterDifference,
                        dollarDifference,
                        collectorName,
                        comments,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Update the readings file
                    readings[key] = {
                        counterValue: parseInt(counterValue),
                        countingMode,
                        conversionFactor,
                        dollarAmount,
                        timestamp: new Date().toISOString()
                    };
                    
                    fs.writeFileSync(READINGS_FILE, JSON.stringify(readings, null, 2));
                    
                    // Prepare payload for Make.com
                    const payload = {
                        ...newReading,
                        date: new Date().toLocaleString(),
                        location: data.location || locationId,
                        changer: parseInt(machineId.split('_')[1]) || machineId,
                        sheetId: data.sheetId || "1K_Mc1lgoWw5iAvvCzyyuW6fCvY3gikcs8u42mOGMbDw",
                        sheetTab: locationId.charAt(0).toUpperCase() + locationId.slice(1) // Capitalize first letter
                    };
                    
                    // Forward to Make.com if webhook URL is provided
                    if (data.webhookUrl) {
                        // Parse the webhook URL
                        const webhookUrl = data.webhookUrl;
                        const webhookUrlObj = new URL(webhookUrl);
                        const isHttps = webhookUrlObj.protocol === 'https:';
                        
                        // Choose the appropriate module based on the protocol
                        const httpModule = isHttps ? require('https') : require('http');
                        
                        // Prepare the request options
                        const requestOptions = {
                            hostname: webhookUrlObj.hostname,
                            port: webhookUrlObj.port || (isHttps ? 443 : 80),
                            path: webhookUrlObj.pathname + webhookUrlObj.search,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': Buffer.byteLength(JSON.stringify(payload))
                            }
                        };
                        
                        // Make the request to Make.com
                        const makeRequest = httpModule.request(requestOptions, (makeResponse) => {
                            const status = makeResponse.statusCode;
                            console.log(`Make.com response status: ${status}`);
                            
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                status: 'success',
                                data: newReading,
                                make: {
                                    status: (status >= 200 && status < 300) ? 'success' : 'error',
                                    httpStatus: status
                                }
                            }));
                        });
                        
                        // Handle request errors
                        makeRequest.on('error', (error) => {
                            console.error('Error forwarding request to Make.com:', error);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                status: 'partial_success',
                                data: newReading,
                                make: {
                                    status: 'error',
                                    error: error.message
                                }
                            }));
                        });
                        
                        // Send the payload
                        makeRequest.write(JSON.stringify(payload));
                        makeRequest.end();
                    } else {
                        // Just return the new reading data
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'success',
                            data: newReading
                        }));
                    }
                } catch (error) {
                    console.error('Error processing counter reading:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'error', 
                        error: `Failed to process counter reading: ${error.message}` 
                    }));
                }
            });
            return;
        }
    }

    // Add endpoint to list all stored readings
    if (pathname === '/api/all-readings') {
        // Set CORS headers for API endpoints
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        if (req.method === 'GET') {
            try {
                const readings = JSON.parse(fs.readFileSync(READINGS_FILE, 'utf8'));
                
                // Format the readings for easier consumption
                const formattedReadings = Object.entries(readings).map(([key, reading]) => {
                    const [locationId, machineId] = key.split('_');
                    return {
                        locationId,
                        machineId,
                        ...reading
                    };
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'success',
                    data: formattedReadings
                }));
            } catch (error) {
                console.error('Error retrieving all readings:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    error: 'Failed to retrieve readings' 
                }));
            }
            return;
        }
    }

    // Add endpoint to clear all counter readings
    if (pathname === '/api/clear-readings') {
        // Set CORS headers for API endpoints
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        // DELETE all readings
        if (req.method === 'DELETE') {
            try {
                // Reset to empty object
                fs.writeFileSync(READINGS_FILE, '{}');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'success',
                    message: 'All counter readings cleared',
                    timestamp: new Date().toISOString()
                }));
            } catch (error) {
                console.error('Error clearing counter readings:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    error: 'Failed to clear counter readings' 
                }));
            }
            return;
        }
    }

    // Add proxy endpoint for Make.com webhook requests
    if (pathname === '/api/webhook-proxy') {
        // Set CORS headers for API endpoints
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { webhookUrl, payload } = JSON.parse(body);
                
                if (!webhookUrl) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'error', 
                        error: 'Missing webhook URL' 
                    }));
                    return;
                }
                
                console.log(`Proxying request to: ${webhookUrl}`);
                console.log(`Payload: ${JSON.stringify(payload)}`);
                
                // Parse the webhook URL
                const webhookUrlObj = new URL(webhookUrl);
                const isHttps = webhookUrlObj.protocol === 'https:';
                
                // Choose the appropriate module based on the protocol
                const httpModule = isHttps ? require('https') : require('http');
                
                // Prepare the request options
                const requestOptions = {
                    hostname: webhookUrlObj.hostname,
                    port: webhookUrlObj.port || (isHttps ? 443 : 80),
                    path: webhookUrlObj.pathname + webhookUrlObj.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
                    }
                };
                
                // Make the request to Make.com
                const makeRequest = httpModule.request(requestOptions, (makeResponse) => {
                    const status = makeResponse.statusCode;
                    console.log(`Make.com response status: ${status}`);
                    
                    // Don't try to read the response body - just return the status code
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: (status >= 200 && status < 300) ? 'success' : 'error',
                        httpStatus: status,
                        timestamp: new Date().toISOString()
                    }));
                });
                
                // Handle request errors
                makeRequest.on('error', (error) => {
                    console.error('Error forwarding request to Make.com:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'error',
                        error: `Error forwarding request: ${error.message}`,
                        timestamp: new Date().toISOString()
                    }));
                });
                
                // Send the payload
                makeRequest.write(JSON.stringify(payload));
                makeRequest.end();
                
            } catch (error) {
                console.error('Webhook proxy error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'error',
                    error: `Proxy error: ${error.message}`,
                    timestamp: new Date().toISOString()
                }));
            }
        });
        return;
    }

    // Handle root path
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Handle service worker
    if (pathname === '/sw.js') {
        pathname = '/js/sw.js';
    }

    // Get file path
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath).toLowerCase();

    // Get MIME type
    const mimeType = MIME_TYPES[extname] || 'application/octet-stream';

    // Set headers
    res.setHeader('Content-Type', mimeType);
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Add CORS headers for development
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Add PWA headers for specific files
    if (pathname.includes('manifest.json') || pathname.includes('sw.js')) {
        Object.entries(PWA_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
    }

    // Handle OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // File not found
            if (err.code === 'ENOENT') {
                // Try serving index.html for SPA routing
                if (extname === '') {
                    const indexPath = path.join(__dirname, 'index.html');
                    fs.readFile(indexPath, (indexErr, indexData) => {
                        if (indexErr) {
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end('<h1>404 - File Not Found</h1>');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(indexData);
                        }
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - File Not Found</h1>');
                }
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
            }
        } else {
            // File found, serve it
            res.writeHead(200);
            res.end(data);
        }
    });
});

// Start server
server.listen(PORT, HOST, () => {
    console.log(`🚀 BTM Utility Development Server running at:`);
    console.log(`   Local: http://${HOST}:${PORT}`);
    console.log(`   Network: http://${getLocalIP()}:${PORT}`);
    console.log(`   PWA: http://${HOST}:${PORT}/manifest.json`);
    console.log(`   Service Worker: http://${HOST}:${PORT}/sw.js`);
    console.log(`\n📱 Mobile Testing:`);
    console.log(`   Use your device's IP address to test on mobile devices`);
    console.log(`   Make sure your device is on the same network`);
    console.log(`\n🔧 Development Tools:`);
    console.log(`   Press Ctrl+C to stop the server`);
    console.log(`   Files are served with hot reload support`);
});

// Get local IP address for network access
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    
    return 'localhost';
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down development server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log(`   Try using a different port: PORT=3001 node server.js`);
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
}); 