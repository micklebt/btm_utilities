/**
 * Links Manager Module for BTM Utility
 * Manages hyperlinks with server-side storage
 */
class LinksManager {
    constructor() {
        this.links = [];
        this.editingId = null;
        this.baseUrl = 'http://localhost:3001'; // Base URL for API endpoints
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

    loadLinks() {
        fetch(`${this.baseUrl}/api/links`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.links = data.links || [];
                this.renderLinks();
            } else {
                console.error('Error loading links:', data.error);
                this.showNotification('Error loading links', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Error loading links from server', 'error');
        });
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