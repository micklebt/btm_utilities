/**
 * Development Server for BTM Utility with API Extensions
 * Custom Node.js server with PWA support and proper headers
 * Includes API endpoints for tasks, links, and contacts
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3001;
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

// Path to links file
const LINKS_FILE = path.join(DATA_DIR, 'links.json');

// Path to contacts file
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Initialize empty tasks file if it doesn't exist
if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, '[]');
}

// Initialize empty links file if it doesn't exist
if (!fs.existsSync(LINKS_FILE)) {
    fs.writeFileSync(LINKS_FILE, '[]');
}

// Initialize empty contacts file if it doesn't exist
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, '[]');
}

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.webmanifest': 'application/manifest+json'
};

// CORS headers for API endpoints
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
};

// Create the server
const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Normalize pathname to prevent directory traversal attacks
    pathname = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    
    // Handle OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
        // Add CORS headers to all responses
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Add CORS headers to all responses
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    
    // Handle API endpoints
    if (pathname.startsWith('/api/')) {
        // Handle tasks API
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
        
        // Handle links API
        if (pathname === '/api/links') {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            // GET links
            if (req.method === 'GET') {
                try {
                    let links = [];
                    if (fs.existsSync(LINKS_FILE)) {
                        links = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true,
                        links: links
                    }));
                    return;
                } catch (error) {
                    console.error('Error reading links:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Failed to read links'
                    }));
                    return;
                }
            }
        }
        
        // GET, PUT, DELETE single link by ID
        if (pathname.match(/^\/api\/links\/[a-zA-Z0-9_-]+$/)) {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            const linkId = pathname.split('/').pop();
            
            // GET a single link
            if (req.method === 'GET') {
                try {
                    let links = [];
                    if (fs.existsSync(LINKS_FILE)) {
                        links = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
                    }
                    
                    const link = links.find(l => l.id === linkId);
                    
                    if (link) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true,
                            link: link
                        }));
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false,
                            error: 'Link not found'
                        }));
                    }
                    return;
                } catch (error) {
                    console.error('Error reading link:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Failed to read link'
                    }));
                    return;
                }
            }
            
            // POST links (add, update, delete)
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', () => {
                    try {
                        const input = JSON.parse(body);
                        
                        if (!input || !input.action) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Invalid request' 
                            }));
                            return;
                        }
                        
                        // Read current links
                        let links = [];
                        if (fs.existsSync(LINKS_FILE)) {
                            links = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
                        }
                        
                        switch (input.action) {
                            case 'add':
                                if (!input.link) {
                                    res.writeHead(400, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ 
                                        success: false,
                                        error: 'Missing link data' 
                                    }));
                                    return;
                                }
                                
                                // Sanitize link data
                                const newLink = {
                                    id: input.link.id,
                                    title: input.link.title,
                                    url: input.link.url
                                };
                                
                                links.push(newLink);
                                
                                fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                                break;
                                
                            case 'update':
                                if (!input.id || !input.title || !input.url) {
                                    res.writeHead(400, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ 
                                        success: false,
                                        error: 'Missing data' 
                                    }));
                                    return;
                                }
                                
                                let updated = false;
                                for (let i = 0; i < links.length; i++) {
                                    if (links[i].id == input.id) {
                                        links[i].title = input.title;
                                        links[i].url = input.url;
                                        updated = true;
                                        break;
                                    }
                                }
                                
                                if (updated) {
                                    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: true }));
                                } else {
                                    res.writeHead(404, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ 
                                        success: false,
                                        error: 'Link not found' 
                                    }));
                                }
                                break;
                                
                            case 'delete':
                                if (!input.id) {
                                    res.writeHead(400, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ 
                                        success: false,
                                        error: 'Missing ID' 
                                    }));
                                    return;
                                }
                                
                                const filteredLinks = links.filter(link => link.id != input.id);
                                
                                if (filteredLinks.length < links.length) {
                                    fs.writeFileSync(LINKS_FILE, JSON.stringify(filteredLinks, null, 2));
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: true }));
                                } else {
                                    res.writeHead(404, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ 
                                        success: false,
                                        error: 'Link not found' 
                                    }));
                                }
                                break;
                                
                            default:
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: 'Unknown action' 
                                }));
                        }
                    } catch (error) {
                        console.error('Error processing links request:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false,
                            error: 'Failed to process request' 
                        }));
                    }
                });
                return;
            }
        }
        
        // Handle contacts API
        if (pathname === '/api/contacts') {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            // GET all contacts
            if (req.method === 'GET') {
                try {
                    let contacts = [];
                    if (fs.existsSync(CONTACTS_FILE)) {
                        contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
                    }
                    
                    // Parse query parameters for filtering
                    const queryParams = new URLSearchParams(parsedUrl.query);
                    const category = queryParams.get('category');
                    const search = queryParams.get('search');
                    
                    // Apply filters if provided
                    if (category) {
                        contacts = contacts.filter(contact => contact.category === category);
                    }
                    
                    if (search) {
                        const searchLower = search.toLowerCase();
                        contacts = contacts.filter(contact => 
                            contact.name.toLowerCase().includes(searchLower) || 
                            (contact.organization && contact.organization.toLowerCase().includes(searchLower)) ||
                            contact.phone.includes(search)
                        );
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true,
                        contacts: contacts
                    }));
                    return;
                } catch (error) {
                    console.error('Error reading contacts:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Failed to read contacts'
                    }));
                    return;
                }
            }
        }
        
        // GET a single contact by ID
        if (req.method === 'GET' && pathname.match(/^\/api\/contacts\/[a-zA-Z0-9_-]+$/)) {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            try {
                const contactId = pathname.split('/').pop();
                
                let contacts = [];
                if (fs.existsSync(CONTACTS_FILE)) {
                    contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
                }
                
                const contact = contacts.find(c => c.id === contactId);
                
                if (contact) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true,
                        contact: contact
                    }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Contact not found'
                    }));
                }
                return;
            } catch (error) {
                console.error('Error reading contact:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false,
                    error: 'Failed to read contact'
                }));
                return;
            }
        }
            
            // POST - Create a new contact
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', () => {
                    try {
                        const contactData = JSON.parse(body);
                        
                        // Validate required fields
                        if (!contactData.name || !contactData.phone || !contactData.category) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                success: false,
                                error: 'Name, phone, and category are required'
                            }));
                            return;
                        }
                        
                        // Read existing contacts
                        let contacts = [];
                        if (fs.existsSync(CONTACTS_FILE)) {
                            contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
                        }
                        
                        // Generate unique ID if not provided
                        if (!contactData.id) {
                            contactData.id = 'contact_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                        }
                        
                        // Add timestamps
                        contactData.createdAt = new Date().toISOString();
                        contactData.updatedAt = new Date().toISOString();
                        
                        // If this is a primary contact, unset other primary contacts in the same category
                        if (contactData.primary) {
                            contacts.forEach(contact => {
                                if (contact.category === contactData.category) {
                                    contact.primary = false;
                                }
                            });
                        }
                        
                        // Add new contact
                        contacts.push(contactData);
                        
                        // Save to file
                        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
                        
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true,
                            contact: contactData
                        }));
                    } catch (error) {
                        console.error('Error creating contact:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false,
                            error: 'Failed to create contact'
                        }));
                    }
                });
                return;
            }
            
        // PUT - Update an existing contact
        if (req.method === 'PUT' && pathname.match(/^\/api\/contacts\/[a-zA-Z0-9_-]+$/)) {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            const contactId = pathname.split('/').pop();
            
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const contactData = JSON.parse(body);
                    
                    // Validate required fields
                    if (!contactData.name || !contactData.phone || !contactData.category) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false,
                            error: 'Name, phone, and category are required'
                        }));
                        return;
                    }
                    
                    // Read existing contacts
                    let contacts = [];
                    if (fs.existsSync(CONTACTS_FILE)) {
                        contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
                    }
                    
                    // Find contact index
                    const contactIndex = contacts.findIndex(c => c.id === contactId);
                    
                    if (contactIndex === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false,
                            error: 'Contact not found'
                        }));
                        return;
                    }
                    
                    // Update timestamp
                    contactData.updatedAt = new Date().toISOString();
                    
                    // If this is a primary contact, unset other primary contacts in the same category
                    if (contactData.primary) {
                        contacts.forEach((contact, index) => {
                            if (contact.category === contactData.category && index !== contactIndex) {
                                contact.primary = false;
                            }
                        });
                    }
                    
                    // Preserve creation date
                    contactData.createdAt = contacts[contactIndex].createdAt;
                    
                    // Update contact
                    contacts[contactIndex] = contactData;
                    
                    // Save to file
                    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true,
                        contact: contactData
                    }));
                } catch (error) {
                    console.error('Error updating contact:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Failed to update contact'
                    }));
                }
            });
            return;
        }
        
        // DELETE - Remove a contact
        if (req.method === 'DELETE' && pathname.match(/^\/api\/contacts\/[a-zA-Z0-9_-]+$/)) {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            try {
                const contactId = pathname.split('/').pop();
                
                // Read existing contacts
                let contacts = [];
                if (fs.existsSync(CONTACTS_FILE)) {
                    contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
                }
                
                // Find contact index
                const contactIndex = contacts.findIndex(c => c.id === contactId);
                
                if (contactIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Contact not found'
                    }));
                    return;
                }
                
                // Remove contact
                contacts.splice(contactIndex, 1);
                
                // Save to file
                fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true,
                    message: 'Contact deleted successfully'
                }));
            } catch (error) {
                console.error('Error deleting contact:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false,
                    error: 'Failed to delete contact'
                }));
            }
            return;
        }
        
        // Handle counter readings API
        if (pathname === '/api/previous-reading') {
            // Set CORS headers for API endpoints
            Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            
            // GET previous reading for a specific machine
            if (req.method === 'GET') {
                try {
                    // Parse query parameters
                    const queryParams = new URLSearchParams(parsedUrl.query);
                    const machineId = queryParams.get('machineId');
                    
                    if (!machineId) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Machine ID is required' }));
                        return;
                    }
                    
                    // Read counter readings file
                    let readings = [];
                    if (fs.existsSync(READINGS_FILE)) {
                        readings = JSON.parse(fs.readFileSync(READINGS_FILE, 'utf8'));
                    }
                    
                    // Find readings for the specified machine
                    const machineReadings = readings.filter(reading => reading.machineId === machineId);
                    
                    // Sort by date (newest first)
                    machineReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    // Return the most recent reading
                    const latestReading = machineReadings.length > 0 ? machineReadings[0] : null;
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true,
                        reading: latestReading
                    }));
                } catch (error) {
                    console.error('Error retrieving previous reading:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        error: 'Failed to retrieve previous reading'
                    }));
                }
                return;
            }
        }
    }
    
    // Handle file requests
    let filePath;
    if (pathname === '/') {
        filePath = path.join(__dirname, 'index.html');
    } else {
        filePath = path.join(__dirname, pathname);
    }
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Check if file exists
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    if (err) {
                        // No custom 404 page
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('<h1>404 Not Found</h1><p>The page you requested could not be found.</p>');
                    } else {
                        // Custom 404 page
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content);
                    }
                });
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>500 Internal Server Error</h1><p>${error.code}</p>`);
            }
        } else {
            // Add security headers
            const headers = {
                'Content-Type': contentType,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'SAMEORIGIN',
                'X-XSS-Protection': '1; mode=block',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            
            // Add CORS headers for API endpoints
            if (pathname.startsWith('/api/')) {
                Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                    headers[key] = value;
                });
            }
            
            // Success response
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
    console.log(`Local IP: ${getLocalIP()}`);
});

// Helper function to get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    
    return 'localhost';
} 