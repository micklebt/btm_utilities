/**
 * To-Do List Management System
 * Handles task creation, editing, completion tracking, and priority management
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, throttle } from './utils.js';

export class TodoManager {
    constructor() {
        this.tasks = [];
        this.categories = [
            { id: 'maintenance', name: 'Maintenance', icon: '🔧', color: '#ff6b35' },
            { id: 'cleaning', name: 'Cleaning', icon: '🧹', color: '#4ecdc4' },
            { id: 'inventory', name: 'Inventory', icon: '📦', color: '#45b7d1' },
            { id: 'customer', name: 'Customer Service', icon: '👥', color: '#96ceb4' },
            { id: 'admin', name: 'Administrative', icon: '📋', color: '#feca57' },
            { id: 'emergency', name: 'Emergency', icon: '🚨', color: '#ff6b6b' },
            { id: 'other', name: 'Other', icon: '📝', color: '#a8e6cf' }
        ];
        
        this.priorities = [
            { id: 'low', name: 'Low', icon: '🟢', color: '#28a745' },
            { id: 'medium', name: 'Medium', icon: '🟡', color: '#ffc107' },
            { id: 'high', name: 'High', icon: '🟠', color: '#fd7e14' },
            { id: 'urgent', name: 'Urgent', icon: '🔴', color: '#dc3545' }
        ];
        
        this.filters = {
            status: 'all', // all, pending, completed
            category: 'all',
            priority: 'all',
            search: ''
        };
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Todo Manager');
            
            // Load existing tasks
            await this.loadTasks();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update display
            this.updateTasksDisplay();
            
            logger.info('Todo Manager initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'todo-manager-init'
            });
        }
    }

    async loadTasks() {
        try {
            const savedTasks = await storageUtils.tasksManager.load();
            this.tasks = savedTasks || [];
            logger.info(`Loaded ${this.tasks.length} tasks`);
        } catch (error) {
            logger.error('Failed to load tasks', null, error);
            this.tasks = [];
        }
    }

    initializeUI() {
        const container = document.getElementById('todo-container');
        if (!container) return;

        container.innerHTML = `
            <div class="todo-header">
                <h2>📋 To-Do List</h2>
                <button type="button" id="add-task-btn" class="btn btn-primary">
                    ➕ Add Task
                </button>
            </div>

            <div class="todo-filters">
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="status-filter" class="filter-select">
                        <option value="all">All Tasks</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Category:</label>
                    <select id="category-filter" class="filter-select">
                        <option value="all">All Categories</option>
                        ${this.categories.map(cat => `
                            <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Priority:</label>
                    <select id="priority-filter" class="filter-select">
                        <option value="all">All Priorities</option>
                        ${this.priorities.map(pri => `
                            <option value="${pri.id}">${pri.icon} ${pri.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Search:</label>
                    <input type="text" id="search-filter" class="search-input" 
                           placeholder="Search tasks...">
                </div>
            </div>

            <div class="todo-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Tasks</span>
                    <span class="stat-value" id="total-tasks">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Pending</span>
                    <span class="stat-value" id="pending-tasks">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Completed</span>
                    <span class="stat-value" id="completed-tasks">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Urgent</span>
                    <span class="stat-value urgent" id="urgent-tasks">0</span>
                </div>
            </div>

            <div class="tasks-container">
                <div class="tasks-list" id="tasks-list">
                    <!-- Tasks will be populated here -->
                </div>
            </div>

            <!-- Add Task Modal -->
            <div id="task-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Add New Task</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <form id="task-form" class="task-form">
                        <div class="form-section">
                            <label for="task-title">Task Title *</label>
                            <input type="text" id="task-title" required 
                                   placeholder="Enter task title...">
                        </div>
                        
                        <div class="form-section">
                            <label for="task-description">Description</label>
                            <textarea id="task-description" rows="3" 
                                      placeholder="Enter task description..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-section">
                                <label for="task-category">Category</label>
                                <select id="task-category" required>
                                    ${this.categories.map(cat => `
                                        <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-section">
                                <label for="task-priority">Priority</label>
                                <select id="task-priority" required>
                                    ${this.priorities.map(pri => `
                                        <option value="${pri.id}">${pri.icon} ${pri.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-section">
                                <label for="task-due-date">Due Date</label>
                                <input type="datetime-local" id="task-due-date">
                            </div>
                            
                            <div class="form-section">
                                <label for="task-assignee">Assignee</label>
                                <input type="text" id="task-assignee" 
                                       placeholder="Who should do this?">
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <label class="checkbox-label">
                                <input type="checkbox" id="task-reminder">
                                Set reminder notification
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                💾 Save Task
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-task-btn">
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Add task button
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        }

        // Filter controls
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        const priorityFilter = document.getElementById('priority-filter');
        const searchFilter = document.getElementById('search-filter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.updateTasksDisplay();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                this.updateTasksDisplay();
            });
        }

        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => {
                this.filters.priority = priorityFilter.value;
                this.updateTasksDisplay();
            });
        }

        if (searchFilter) {
            searchFilter.addEventListener('input', debounce((e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.updateTasksDisplay();
            }, 300));
        }

        // Modal controls
        const modal = document.getElementById('task-modal');
        const modalClose = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancel-task-btn');
        const taskForm = document.getElementById('task-form');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideTaskModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideTaskModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideTaskModal();
                }
            });
        }

        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }
    }

    showAddTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const taskForm = document.getElementById('task-form');

        if (taskId) {
            // Edit existing task
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.populateTaskForm(task);
                modalTitle.textContent = 'Edit Task';
                taskForm.dataset.taskId = taskId;
            }
        } else {
            // Add new task
            this.clearTaskForm();
            modalTitle.textContent = 'Add New Task';
            delete taskForm.dataset.taskId;
        }

        modal.style.display = 'block';
    }

    hideTaskModal() {
        const modal = document.getElementById('task-modal');
        modal.style.display = 'none';
        this.clearTaskForm();
    }

    clearTaskForm() {
        const form = document.getElementById('task-form');
        if (form) {
            form.reset();
            delete form.dataset.taskId;
        }
    }

    populateTaskForm(task) {
        const titleInput = document.getElementById('task-title');
        const descInput = document.getElementById('task-description');
        const categorySelect = document.getElementById('task-category');
        const prioritySelect = document.getElementById('task-priority');
        const dueDateInput = document.getElementById('task-due-date');
        const assigneeInput = document.getElementById('task-assignee');
        const reminderCheckbox = document.getElementById('task-reminder');

        if (titleInput) titleInput.value = task.title;
        if (descInput) descInput.value = task.description || '';
        if (categorySelect) categorySelect.value = task.category;
        if (prioritySelect) prioritySelect.value = task.priority;
        if (dueDateInput) dueDateInput.value = task.dueDate || '';
        if (assigneeInput) assigneeInput.value = task.assignee || '';
        if (reminderCheckbox) reminderCheckbox.checked = task.reminder || false;
    }

    async saveTask() {
        try {
            const form = document.getElementById('task-form');
            const taskId = form.dataset.taskId;

            const taskData = {
                title: document.getElementById('task-title').value.trim(),
                description: document.getElementById('task-description').value.trim(),
                category: document.getElementById('task-category').value,
                priority: document.getElementById('task-priority').value,
                dueDate: document.getElementById('task-due-date').value,
                assignee: document.getElementById('task-assignee').value.trim(),
                reminder: document.getElementById('task-reminder').checked,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Validate required fields
            if (!taskData.title) {
                this.showNotification('Task title is required', 'error');
                return;
            }

            if (taskId) {
                // Update existing task
                const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
                    logger.info('Task updated', { taskId, taskData });
                }
            } else {
                // Create new task
                const newTask = {
                    id: generateId('task'),
                    ...taskData
                };
                this.tasks.push(newTask);
                logger.info('Task created', newTask);
            }

            // Save to storage
            await storageUtils.tasksManager.save(this.tasks);

            // Update display
            this.updateTasksDisplay();

            // Hide modal
            this.hideTaskModal();

            // Show success notification
            const action = taskId ? 'updated' : 'created';
            this.showNotification(`Task ${action} successfully`, 'success');

        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'save-task'
            });
            
            this.showNotification('Failed to save task', 'error');
        }
    }

    async toggleTaskStatus(taskId) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
            task.updatedAt = new Date().toISOString();

            // Save to storage
            await storageUtils.tasksManager.save(this.tasks);

            // Update display
            this.updateTasksDisplay();

            // Show notification
            const action = task.status === 'completed' ? 'completed' : 'marked as pending';
            this.showNotification(`Task ${action}`, 'success');

            logger.info('Task status toggled', { taskId, status: task.status });

        } catch (error) {
            logger.error('Error toggling task status', null, error);
        }
    }

    async deleteTask(taskId) {
        try {
            if (!confirm('Are you sure you want to delete this task?')) {
                return;
            }

            this.tasks = this.tasks.filter(t => t.id !== taskId);

            // Save to storage
            await storageUtils.tasksManager.save(this.tasks);

            // Update display
            this.updateTasksDisplay();

            // Show notification
            this.showNotification('Task deleted', 'success');

            logger.info('Task deleted', { taskId });

        } catch (error) {
            logger.error('Error deleting task', null, error);
        }
    }

    updateTasksDisplay() {
        // Apply filters
        let filteredTasks = this.tasks;

        if (this.filters.status !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.status === this.filters.status);
        }

        if (this.filters.category !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.category === this.filters.category);
        }

        if (this.filters.priority !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.priority === this.filters.priority);
        }

        if (this.filters.search) {
            filteredTasks = filteredTasks.filter(t => 
                t.title.toLowerCase().includes(this.filters.search) ||
                t.description.toLowerCase().includes(this.filters.search) ||
                (t.assignee && t.assignee.toLowerCase().includes(this.filters.search))
            );
        }

        // Sort tasks (urgent first, then by due date, then by creation date)
        filteredTasks.sort((a, b) => {
            // Urgent tasks first
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

            // Then by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            // Then by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Update stats
        this.updateStats();

        // Update tasks list
        const tasksList = document.getElementById('tasks-list');
        if (tasksList) {
            if (filteredTasks.length === 0) {
                tasksList.innerHTML = `
                    <div class="no-tasks">
                        <p>No tasks found matching your filters.</p>
                        <button type="button" class="btn btn-primary" onclick="window.todoManager.showAddTaskModal()">
                            ➕ Add Your First Task
                        </button>
                    </div>
                `;
            } else {
                tasksList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
            }
        }

        // Set up task event listeners
        this.setupTaskEventListeners();
    }

    renderTask(task) {
        const category = this.categories.find(c => c.id === task.category);
        const priority = this.priorities.find(p => p.id === task.priority);
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

        return `
            <div class="task-item ${task.status} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox">
                        <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                               data-task-id="${task.id}">
                    </div>
                    
                    <div class="task-info">
                        <div class="task-title ${task.status === 'completed' ? 'completed' : ''}">
                            ${task.title}
                        </div>
                        
                        ${task.description ? `
                            <div class="task-description">${task.description}</div>
                        ` : ''}
                        
                        <div class="task-meta">
                            <span class="task-category" style="color: ${category.color}">
                                ${category.icon} ${category.name}
                            </span>
                            
                            <span class="task-priority" style="color: ${priority.color}">
                                ${priority.icon} ${priority.name}
                            </span>
                            
                            ${task.assignee ? `
                                <span class="task-assignee">👤 ${task.assignee}</span>
                            ` : ''}
                            
                            ${task.dueDate ? `
                                <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                    📅 ${formatDate(task.dueDate)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="task-actions">
                        <button type="button" class="btn btn-icon edit-task-btn" 
                                data-task-id="${task.id}" title="Edit Task">
                            ✏️
                        </button>
                        <button type="button" class="btn btn-icon delete-task-btn" 
                                data-task-id="${task.id}" title="Delete Task">
                            🗑️
                        </button>
                    </div>
                </div>
                
                ${task.status === 'completed' && task.completedAt ? `
                    <div class="task-completion">
                        ✅ Completed on ${formatDate(task.completedAt)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupTaskEventListeners() {
        // Checkbox toggles
        const checkboxes = document.querySelectorAll('.task-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTaskStatus(e.target.dataset.taskId);
            });
        });

        // Edit buttons
        const editButtons = document.querySelectorAll('.edit-task-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showAddTaskModal(e.target.dataset.taskId);
            });
        });

        // Delete buttons
        const deleteButtons = document.querySelectorAll('.delete-task-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteTask(e.target.dataset.taskId);
            });
        });
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const pendingTasks = this.tasks.filter(t => t.status === 'pending').length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const urgentTasks = this.tasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length;

        const totalElement = document.getElementById('total-tasks');
        const pendingElement = document.getElementById('pending-tasks');
        const completedElement = document.getElementById('completed-tasks');
        const urgentElement = document.getElementById('urgent-tasks');

        if (totalElement) totalElement.textContent = totalTasks;
        if (pendingElement) pendingElement.textContent = pendingTasks;
        if (completedElement) completedElement.textContent = completedTasks;
        if (urgentElement) urgentElement.textContent = urgentTasks;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }

    // Public methods for external access
    getTasks() {
        return this.tasks;
    }

    getPendingTasks() {
        return this.tasks.filter(t => t.status === 'pending');
    }

    getUrgentTasks() {
        return this.tasks.filter(t => t.priority === 'urgent' && t.status === 'pending');
    }

    async exportTasks(format = 'json') {
        try {
            const data = {
                tasks: this.tasks,
                summary: {
                    total: this.tasks.length,
                    pending: this.getPendingTasks().length,
                    completed: this.tasks.filter(t => t.status === 'completed').length,
                    urgent: this.getUrgentTasks().length,
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data.tasks);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting tasks', null, error);
            throw error;
        }
    }

    convertToCSV(tasks) {
        const headers = ['Title', 'Description', 'Category', 'Priority', 'Status', 'Assignee', 'Due Date', 'Created At'];
        const rows = tasks.map(t => [
            t.title,
            t.description || '',
            t.category,
            t.priority,
            t.status,
            t.assignee || '',
            t.dueDate || '',
            t.createdAt
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.todoManager = new TodoManager();
    });
} else {
    window.todoManager = new TodoManager();
}

export default window.todoManager; 