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
        
        this.assignees = [
            { id: 'john', name: 'John Smith', role: 'Manager' },
            { id: 'sarah', name: 'Sarah Johnson', role: 'Technician' },
            { id: 'mike', name: 'Mike Davis', role: 'Maintenance' },
            { id: 'lisa', name: 'Lisa Wilson', role: 'Customer Service' },
            { id: 'david', name: 'David Brown', role: 'Inventory' },
            { id: 'emma', name: 'Emma Taylor', role: 'Admin' }
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
            const savedTasks = await storageUtils.todos.load();
            this.tasks = savedTasks || [];
            logger.info(`Loaded ${this.tasks.length} tasks`);
        } catch (error) {
            logger.error('Failed to load tasks', null, error);
            this.tasks = [];
        }
    }

    initializeUI() {
        // The HTML already has the basic structure, so we'll enhance it
        const todoSection = document.getElementById('todo');
        if (!todoSection) {
            logger.warn('Todo section not found in DOM');
            return;
        }

        // Add enhanced filters to the existing structure
        const existingFilters = todoSection.querySelector('.todo-filters');
        if (existingFilters) {
            // Add enhanced filters with better styling
            existingFilters.innerHTML = `
                <div class="filter-group">
                    <button class="filter-button active" data-filter="all">📋 All</button>
                    <button class="filter-button" data-filter="pending">⏳ Pending</button>
                    <button class="filter-button" data-filter="completed">✅ Completed</button>
                </div>
                <div class="filter-group">
                    <select id="category-filter" class="filter-select">
                        <option value="all">🏷️ All Categories</option>
                        ${this.categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <select id="priority-filter" class="filter-select">
                        <option value="all">⚡ All Priorities</option>
                        ${this.priorities.map(pri => `<option value="${pri.id}">${pri.icon} ${pri.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <input type="text" id="search-tasks" class="search-input" placeholder="🔍 Search tasks...">
                </div>
            `;
        }

        // Stats display removed - no longer showing metrics in the middle of the todo list

        // Create task modal if it doesn't exist
        if (!document.getElementById('task-modal')) {
            const modalHTML = `
                <div id="task-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="task-modal-title">➕ Add New Task</h3>
                            <button type="button" class="close-button" id="close-task-modal" title="Close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="task-form" class="task-form">
                                <div class="form-group">
                                    <label for="task-title">📝 Task Title</label>
                                    <input type="text" id="task-title" class="form-input" placeholder="Enter task title...">
                                </div>
                                
                                <div class="form-group">
                                    <label for="task-description">📄 Description</label>
                                    <textarea id="task-description" class="form-textarea" rows="3" placeholder="Describe the task..."></textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="task-category">🏷️ Category</label>
                                        <select id="task-category" class="form-select">
                                            ${this.categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="task-priority">⚡ Priority</label>
                                        <select id="task-priority" class="form-select">
                                            ${this.priorities.map(pri => `<option value="${pri.id}">${pri.icon} ${pri.name}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="task-due-date">📅 Due Date</label>
                                        <input type="date" id="task-due-date" class="form-input">
                                    </div>
                                    <div class="form-group">
                                        <label for="task-assignee">👤 Assignee</label>
                                        <select id="task-assignee" class="form-select">
                                            <option value="">Select assignee...</option>
                                            ${this.assignees.map(assignee => `<option value="${assignee.name}">${assignee.name} (${assignee.role})</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="task-reminder">
                                        <span class="checkmark"></span>
                                        🔔 Set reminder
                                    </label>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" class="btn btn-secondary" id="cancel-task">
                                        ❌ Cancel
                                    </button>
                                    <button type="submit" class="btn btn-primary" id="save-task">
                                        ✅ Save Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        logger.info('Todo UI initialized successfully');
    }

    setupEventListeners() {
        // Add task button (existing in HTML)
        const addTaskBtn = document.getElementById('add-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showAddTaskModal();
            });
        }

        // Filter buttons (existing in HTML)
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                const filter = e.target.dataset.filter;
                this.filters.status = filter;
                this.updateTasksDisplay();
            });
        });

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.updateTasksDisplay();
            });
        }

        // Priority filter
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.filters.priority = e.target.value;
                this.updateTasksDisplay();
            });
        }

        // Search input
        const searchInput = document.getElementById('search-tasks');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.updateTasksDisplay();
            }, 300));
        }

        // Task modal events
        const taskModal = document.getElementById('task-modal');
        const closeModalBtn = document.getElementById('close-task-modal');
        const cancelBtn = document.getElementById('cancel-task');
        const taskForm = document.getElementById('task-form');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideTaskModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideTaskModal();
            });
        }

        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        // Close modal when clicking outside
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) {
                    this.hideTaskModal();
                }
            });
        }

        logger.info('Todo event listeners set up successfully');
    }

    showAddTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('task-modal-title');
        
        if (!modal) {
            logger.error('Task modal not found');
            return;
        }

        if (taskId) {
            // Edit existing task
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                modalTitle.textContent = 'Edit Task';
                this.populateTaskForm(task);
            }
        } else {
            // Add new task
            modalTitle.textContent = 'Add New Task';
            this.clearTaskForm();
        }

        modal.classList.add('show');
        document.getElementById('task-title').focus();
    }

    hideTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('show');
            this.clearTaskForm();
        }
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
        if (assigneeInput) {
            // For select elements, we need to find the option that matches the assignee name
            if (assigneeInput.tagName === 'SELECT') {
                const assigneeOption = Array.from(assigneeInput.options).find(option => 
                    option.value === task.assignee
                );
                assigneeInput.value = assigneeOption ? assigneeOption.value : '';
            } else {
                assigneeInput.value = task.assignee || '';
            }
        }
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

            // All fields are optional - allow empty tasks
            if (!taskData.title && !taskData.description) {
                this.showNotification('Please provide at least a title or description', 'warning');
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
            await storageUtils.todos.save(this.tasks);

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
            await storageUtils.todos.save(this.tasks);

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
            await storageUtils.todos.save(this.tasks);

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
        const todoItems = document.getElementById('todo-items');
        if (!todoItems) {
            logger.warn('Todo items container not found');
            return;
        }

        // Apply filters
        let filteredTasks = this.tasks.filter(task => {
            // Status filter
            if (this.filters.status !== 'all') {
                if (this.filters.status === 'pending' && task.completed) return false;
                if (this.filters.status === 'completed' && !task.completed) return false;
            }

            // Category filter
            if (this.filters.category !== 'all' && task.category !== this.filters.category) {
                return false;
            }

            // Priority filter
            if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesTitle = task.title.toLowerCase().includes(searchTerm);
                const matchesDescription = task.description?.toLowerCase().includes(searchTerm) || false;
                const matchesAssignee = task.assignee?.toLowerCase().includes(searchTerm) || false;
                
                if (!matchesTitle && !matchesDescription && !matchesAssignee) {
                    return false;
                }
            }

            return true;
        });

        // Sort tasks: urgent first, then by due date, then by creation date
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
            
            // Finally by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Render tasks
        todoItems.innerHTML = filteredTasks.length > 0 
            ? filteredTasks.map(task => this.renderTask(task)).join('')
            : '<div class="no-tasks">No tasks found. Click "Add Task" to create your first task!</div>';

        // Set up event listeners for the new task elements
        this.setupTaskEventListeners();
    }

    renderTask(task) {
        const category = this.categories.find(c => c.id === task.category) || this.categories[0];
        const priority = this.priorities.find(p => p.id === task.priority) || this.priorities[1];
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

        return `
            <div class="todo-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="todo-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           data-task-id="${task.id}">
                </div>
                
                <div class="task-info">
                    <div class="task-title ${task.completed ? 'completed' : ''}">
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
            
            ${task.completed && task.completedAt ? `
                <div class="task-completion">
                    ✅ Completed on ${formatDate(task.completedAt)}
                </div>
            ` : ''}
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
        const pendingTasks = this.tasks.filter(t => !t.completed).length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const urgentTasks = this.tasks.filter(t => t.priority === 'urgent' && !t.completed).length;

        // Update stats display
        const totalElement = document.getElementById('total-tasks');
        const pendingElement = document.getElementById('pending-tasks');
        const completedElement = document.getElementById('completed-tasks');
        const urgentElement = document.getElementById('urgent-tasks');

        if (totalElement) totalElement.textContent = totalTasks;
        if (pendingElement) pendingElement.textContent = pendingTasks;
        if (completedElement) completedElement.textContent = completedTasks;
        if (urgentElement) urgentElement.textContent = urgentTasks;

        // Update urgent tasks styling
        if (urgentElement) {
            urgentElement.classList.toggle('urgent', urgentTasks > 0);
        }

        logger.info(`Stats updated: ${totalTasks} total, ${pendingTasks} pending, ${completedTasks} completed, ${urgentTasks} urgent`);
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