/**
 * Links Manager Module for BTM Utility
 * Manages hyperlinks with server-side storage
 */
class LinksManager {
    constructor() {
        this.links = [];
        this.editingId = null;
        // Use current origin for API endpoints or fallback to localhost:3001
        // Always use the same hostname (localhost or 127.0.0.1) that the page is loaded from
        // Ensure we have a valid base URL that works with both localhost and 127.0.0.1
        this.baseUrl = `${window.location.protocol}//${window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:3001`;
        this.init();
    }

    init() {
        // Initialize the form and event listeners
        this.setupEventListeners();
        
        // Load links from server
        this.loadLinks();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('linkForm');
        const submitBtn = document.getElementById('submitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const refreshBtn = document.getElementById('refresh-links');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('rotating');
                this.loadLinks();
                setTimeout(() => {
                    refreshBtn.classList.remove('rotating');
                }, 1000);
            });
        }
    }

    handleFormSubmit() {
        const titleInput = document.getElementById('title');
        const urlInput = document.getElementById('url');
        
        if (!titleInput || !urlInput) return;
        
        const title = titleInput.value.trim();
        let url = urlInput.value.trim();
        
        if (!title || !url) {
            this.showNotification('Please fill in both title and URL', 'error');
            return;
        }
        
        // Add https:// if no protocol is specified
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
        }
        
        if (this.editingId) {
            // Update existing link
            this.updateLink(this.editingId, title, url);
        } else {
            // Add new link
            this.addLink(title, url);
        }
    }

    addLink(title, url) {
        const newLink = {
            id: Date.now(), // Use timestamp as simple ID
            title: title,
            url: url
        };
        
        fetch(`${this.baseUrl}/api/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'add',
                link: newLink
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.resetForm();
                this.loadLinks();
                this.showNotification('Link added successfully', 'success');
            } else {
                this.showNotification('Error adding link: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Error adding link', 'error');
        });
    }

    updateLink(id, title, url) {
        fetch(`${this.baseUrl}/api/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update',
                id: id,
                title: title,
                url: url
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.editingId = null;
                this.resetForm();
                this.loadLinks();
                this.showNotification('Link updated successfully', 'success');
            } else {
                this.showNotification('Error updating link: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Error updating link', 'error');
        });
    }

    deleteLink(id) {
        if (confirm('Are you sure you want to delete this link?')) {
            fetch(`${this.baseUrl}/api/links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.loadLinks();
                    this.showNotification('Link deleted successfully', 'success');
                } else {
                    this.showNotification('Error deleting link: ' + data.error, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.showNotification('Error deleting link', 'error');
            });
        }
    }

    loadLinks(retryCount = 0) {
        // Show loading indicator
        const linksList = document.getElementById('linksList');
        if (linksList) {
            linksList.innerHTML = '<div class="loading-indicator">Loading links...</div>';
        }
        
        // Maximum number of retries
        const MAX_RETRIES = 3;
        
        fetch(`${this.baseUrl}/api/links`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.links = data.links || [];
                
                // Cache the links in localStorage for offline use
                try {
                    localStorage.setItem('cached_links', JSON.stringify(this.links));
                } catch (cacheError) {
                    console.warn('Failed to cache links:', cacheError);
                }
                
                this.renderLinks();
                
                // Clear any error notifications if successful
                const errorNotification = document.querySelector('.notification.error');
                if (errorNotification) {
                    errorNotification.remove();
                }
            } else {
                console.error('Error loading links:', data.error);
                this.showNotification('Error loading links', 'error');
                this.renderFallbackLinks();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            if (retryCount < MAX_RETRIES) {
                // Retry with exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                
                setTimeout(() => {
                    this.loadLinks(retryCount + 1);
                }, delay);
            } else {
                this.showNotification('Error connecting to server. Using cached data if available.', 'error');
                this.renderFallbackLinks();
            }
        });
    }
    
    // Render fallback links from localStorage if available
    renderFallbackLinks() {
        try {
            const cachedLinks = localStorage.getItem('cached_links');
            if (cachedLinks) {
                this.links = JSON.parse(cachedLinks);
                this.renderLinks();
                console.log('Using cached links from localStorage');
            } else {
                // No cached data available
                const linksList = document.getElementById('linksList');
                if (linksList) {
                    linksList.innerHTML = '<div class="empty-state">Unable to load links. Please check your connection and try again.</div>';
                }
            }
        } catch (error) {
            console.error('Error loading cached links:', error);
            const linksList = document.getElementById('linksList');
            if (linksList) {
                linksList.innerHTML = '<div class="empty-state">Unable to load links. Please check your connection and try again.</div>';
            }
        }
    }

    renderLinks() {
        const linksList = document.getElementById('linksList');
        if (!linksList) return;
        
        if (this.links.length === 0) {
            linksList.innerHTML = '<div class="empty-state">No links added yet. Create your first link below.</div>';
            return;
        }
        
        // Sort links alphabetically by title
        const sortedLinks = [...this.links].sort((a, b) => 
            a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );
        
        const html = sortedLinks.map(link => `
            <div class="link-item">
                <div class="link-info">
                    <a href="${this.escapeHtml(link.url)}" target="_blank" class="link-title">${this.escapeHtml(link.title)}</a>
                    <div class="link-url">${this.escapeHtml(link.url)}</div>
                </div>
                <div class="link-actions">
                    <button class="btn-small btn-edit" onclick="linksManager.editLink(${link.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="linksManager.deleteLink(${link.id})">Delete</button>
                </div>
            </div>
        `).join('');
        
        linksList.innerHTML = html;
    }

    editLink(id) {
        const link = this.links.find(l => l.id == id);
        if (link) {
            const titleInput = document.getElementById('title');
            const urlInput = document.getElementById('url');
            const submitBtn = document.getElementById('submitBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            
            if (titleInput && urlInput && submitBtn && cancelBtn) {
                titleInput.value = link.title;
                urlInput.value = link.url.replace(/^https?:\/\//, '');
                this.editingId = id;
                submitBtn.innerHTML = '<span class="button-icon">✏️</span> Update Link';
                cancelBtn.style.display = 'inline-block';
                titleInput.focus();
            }
        }
    }

    resetForm() {
        const titleInput = document.getElementById('title');
        const urlInput = document.getElementById('url');
        const submitBtn = document.getElementById('submitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (titleInput && urlInput && submitBtn && cancelBtn) {
            titleInput.value = '';
            urlInput.value = '';
            this.editingId = null;
            submitBtn.innerHTML = '<span class="button-icon">➕</span> Add Link';
            cancelBtn.style.display = 'none';
            titleInput.focus();
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the Links Manager
const linksManager = new LinksManager();

// Make it globally accessible for onclick handlers
window.linksManager = linksManager; 