// Todo App Module for BTM Utility
class TodoApp {
    constructor(containerId) {
        this.containerId = containerId;
        this.tasks = [];
        this.storageKey = 'btm-todo-tasks-v2'; // Kept for fallback
        this.init();
    }

    init() {
        // Load tasks from server
        this.loadTasks();
        
        // Start auto-refresh for real-time updates
        this.startAutoRefresh();
    }

    loadTasks() {
        // Show loading indicator
        this.showLoadingState();
        
        // Fetch tasks from server API
        fetch('/api/tasks')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                this.tasks = Array.isArray(data) ? data : [];
                // Filter out any empty tasks
                this.tasks = this.tasks.filter(task => task && task.text && task.text.trim() !== '');
                this.render();
            })
            .catch(error => {
                console.error('Error loading tasks from server:', error);
                // Fallback to localStorage if server fails
                this.loadFromLocalStorage();
                this.render();
            });
    }

    loadFromLocalStorage() {
        const savedTasks = localStorage.getItem(this.storageKey);
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
                // Filter out any empty tasks
                this.tasks = this.tasks.filter(task => task && task.text && task.text.trim() !== '');
            } catch (e) {
                console.error('Error loading tasks from localStorage:', e);
                this.tasks = [];
            }
        }
    }

    saveTasks() {
        // Save to server
        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.tasks)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Tasks saved to server successfully');
        })
        .catch(error => {
            console.error('Error saving tasks to server:', error);
            // Fallback to localStorage
            this.saveToLocalStorage();
        });
    }

    saveToLocalStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    startAutoRefresh() {
        // Check for updates every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshTasks();
        }, 30000);
    }

    refreshTasks() {
        fetch('/api/tasks')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Only update if tasks have changed
                const newTasks = Array.isArray(data) ? data : [];
                if (JSON.stringify(this.tasks) !== JSON.stringify(newTasks)) {
                    this.tasks = newTasks;
                    this.render();
                    console.log('Tasks refreshed from server');
                }
                // Update last sync time regardless
                this.lastSyncTime = new Date().toISOString();
                this.updateSyncTime();
            })
            .catch(error => {
                console.error('Error refreshing tasks:', error);
            });
    }

    showLoadingState() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="todo-container">
                    <div class="todo-header">
                        <h3>📋 BTM Inc Task Manager</h3>
                    </div>
                    <div class="todo-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading tasks...</p>
                    </div>
                </div>
            `;
        }
    }

    addTask(text) {
        if (text.trim() !== '') {
            const task = {
                id: Date.now(),
                text: text.trim(),
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: this.getUserIdentifier()
            };
            this.tasks.push(task);
            this.saveTasks();
            this.render();
        }
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { 
                ...task, 
                completed: !task.completed,
                updatedAt: new Date().toISOString(),
                updatedBy: this.getUserIdentifier()
            } : task
        );
        this.saveTasks();
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
    }
    
    getUserIdentifier() {
        // Try to get a username from localStorage or generate a random one
        let username = localStorage.getItem('btm-username');
        if (!username) {
            // Generate a random username
            const adjectives = ['Quick', 'Smart', 'Busy', 'Clever', 'Happy'];
            const nouns = ['User', 'Worker', 'Manager', 'Team', 'Staff'];
            username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
            localStorage.setItem('btm-username', username);
        }
        return username;
    }

    setUsername(name) {
        if (name && name.trim()) {
            localStorage.setItem('btm-username', name.trim());
        }
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="todo-container">
                <div class="todo-header">
                    <h3>📋 BTM Inc Task Manager</h3>
                    <div class="todo-controls">
                        <button id="set-username-btn" class="todo-control-btn" title="Set Username">
                            👤 ${this.escapeHtml(this.getUserIdentifier())}
                        </button>
                        <button id="refresh-tasks-btn" class="todo-control-btn" title="Refresh Tasks">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div class="todo-add-section">
                    <div class="todo-input-group">
                        <input type="text" id="todo-input" class="todo-input" placeholder="Add a new task..." maxlength="100">
                        <button id="todo-add-btn" class="todo-add-btn">➕</button>
                    </div>
                </div>

                <div class="todo-list" id="todo-list">
                    ${this.renderTasks()}
                </div>

                ${this.tasks.length > 0 ? this.renderSummary() : ''}
            </div>
            
            <!-- Username Modal -->
            <div id="username-modal" class="todo-modal">
                <div class="todo-modal-content">
                    <div class="todo-modal-header">
                        <h3>Set Your Username</h3>
                        <button class="todo-modal-close">&times;</button>
                    </div>
                    <div class="todo-modal-body">
                        <p>Enter a username that will be shown when you modify tasks:</p>
                        <input type="text" id="username-input" class="todo-input" placeholder="Enter username" maxlength="20" value="${this.escapeHtml(this.getUserIdentifier())}">
                    </div>
                    <div class="todo-modal-footer">
                        <button id="save-username-btn" class="todo-btn">Save</button>
                        <button class="todo-modal-close todo-btn secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderTasks() {
        if (this.tasks.length === 0) {
            return `
                <div class="todo-empty">
                    <p>No tasks yet. Add one above to get started!</p>
                </div>
            `;
        }

        return this.tasks.map(task => `
            <div class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <label class="todo-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="todo-content">
                    <span class="todo-text">${this.escapeHtml(task.text)}</span>
                    <div class="todo-meta">
                        ${task.updatedBy ? `<span class="todo-updated-by">Updated by: ${this.escapeHtml(task.updatedBy)}</span>` : ''}
                        ${task.updatedAt ? `<span class="todo-timestamp">${this.formatDate(task.updatedAt)}</span>` : ''}
                    </div>
                </div>
                <button class="todo-delete-btn" data-id="${task.id}">🗑️</button>
            </div>
        `).join('');
    }
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} hr ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
            // For older dates, show the actual date
            return date.toLocaleDateString();
        } catch (e) {
            return 'Unknown date';
        }
    }

    renderSummary() {
        const remaining = this.tasks.filter(task => !task.completed).length;
        const total = this.tasks.length;
        const lastUpdate = this.getLastUpdateTime();
        
        return `
            <div class="todo-summary">
                <p>${remaining} of ${total} tasks remaining</p>
                ${lastUpdate ? `<p class="todo-last-sync">Last synced: ${lastUpdate}</p>` : ''}
            </div>
        `;
    }
    
    getLastUpdateTime() {
        if (this.lastSyncTime) {
            return this.formatDate(this.lastSyncTime);
        }
        return null;
    }
    
    updateSyncTime() {
        const summaryElement = document.querySelector('.todo-summary');
        if (summaryElement) {
            const syncElement = summaryElement.querySelector('.todo-last-sync');
            if (syncElement) {
                syncElement.textContent = `Last synced: ${this.formatDate(this.lastSyncTime)}`;
            } else if (this.lastSyncTime) {
                const p = document.createElement('p');
                p.className = 'todo-last-sync';
                p.textContent = `Last synced: ${this.formatDate(this.lastSyncTime)}`;
                summaryElement.appendChild(p);
            }
        }
    }

    attachEventListeners() {
        // Add task button
        const addBtn = document.getElementById('todo-add-btn');
        const input = document.getElementById('todo-input');

        if (addBtn && input) {
            // Focus on the input field when the todo app loads
            setTimeout(() => {
                input.focus();
            }, 100);
            
            addBtn.addEventListener('click', () => {
                this.addTask(input.value);
                input.value = '';
                // Return focus to input after adding task
                input.focus();
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTask(input.value);
                    input.value = '';
                    // Return focus to input after adding task
                    input.focus();
                }
            });
            
            // Enable/disable add button based on input content
            input.addEventListener('input', () => {
                addBtn.disabled = input.value.trim() === '';
                addBtn.style.opacity = input.value.trim() === '' ? '0.5' : '1';
                addBtn.style.cursor = input.value.trim() === '' ? 'not-allowed' : 'pointer';
            });
            
            // Initial button state
            addBtn.disabled = input.value.trim() === '';
            addBtn.style.opacity = input.value.trim() === '' ? '0.5' : '1';
            addBtn.style.cursor = input.value.trim() === '' ? 'not-allowed' : 'pointer';
        }

        // Task checkboxes
        const checkboxes = document.querySelectorAll('.todo-checkbox input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.todo-item').dataset.id);
                this.toggleTask(taskId);
            });
        });

        // Delete buttons
        const deleteBtns = document.querySelectorAll('.todo-delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.id);
                this.deleteTask(taskId);
            });
        });
        
        // Refresh tasks button
        const refreshBtn = document.getElementById('refresh-tasks-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('rotating');
                this.refreshTasks();
                setTimeout(() => {
                    refreshBtn.classList.remove('rotating');
                }, 1000);
            });
        }
        
        // Username button and modal
        const setUsernameBtn = document.getElementById('set-username-btn');
        const usernameModal = document.getElementById('username-modal');
        const closeModalBtns = document.querySelectorAll('.todo-modal-close');
        const saveUsernameBtn = document.getElementById('save-username-btn');
        const usernameInput = document.getElementById('username-input');
        
        if (setUsernameBtn && usernameModal) {
            setUsernameBtn.addEventListener('click', () => {
                usernameModal.classList.add('show');
                setTimeout(() => {
                    if (usernameInput) usernameInput.focus();
                }, 100);
            });
            
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    usernameModal.classList.remove('show');
                });
            });
            
            if (saveUsernameBtn && usernameInput) {
                saveUsernameBtn.addEventListener('click', () => {
                    this.setUsername(usernameInput.value);
                    setUsernameBtn.innerHTML = `👤 ${this.escapeHtml(this.getUserIdentifier())}`;
                    usernameModal.classList.remove('show');
                });
                
                usernameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.setUsername(usernameInput.value);
                        setUsernameBtn.innerHTML = `👤 ${this.escapeHtml(this.getUserIdentifier())}`;
                        usernameModal.classList.remove('show');
                    }
                });
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
}