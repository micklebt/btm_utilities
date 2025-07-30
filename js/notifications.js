/**
 * Notification System
 * Handles different types, priorities, and delivery methods for notifications
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, throttle } from './utils.js';

export class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.subscribers = new Map();
        this.settings = {
            enabled: true,
            sound: true,
            vibration: true,
            desktop: true,
            email: false,
            sms: false,
            autoClear: true,
            autoClearDelay: 5000,
            maxNotifications: 50,
            categories: {
                system: { enabled: true, priority: 'low' },
                security: { enabled: true, priority: 'high' },
                maintenance: { enabled: true, priority: 'medium' },
                financial: { enabled: true, priority: 'high' },
                customer: { enabled: true, priority: 'medium' },
                emergency: { enabled: true, priority: 'critical' }
            }
        };
        
        this.notificationTypes = {
            success: { icon: '✅', color: '#28a745', sound: 'success.mp3' },
            info: { icon: 'ℹ️', color: '#17a2b8', sound: 'info.mp3' },
            warning: { icon: '⚠️', color: '#ffc107', sound: 'warning.mp3' },
            error: { icon: '❌', color: '#dc3545', sound: 'error.mp3' },
            security: { icon: '🛡️', color: '#6f42c1', sound: 'security.mp3' },
            emergency: { icon: '🚨', color: '#dc3545', sound: 'emergency.mp3' },
            maintenance: { icon: '🔧', color: '#fd7e14', sound: 'maintenance.mp3' },
            financial: { icon: '💰', color: '#28a745', sound: 'financial.mp3' }
        };
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Notification System');
            
            // Load existing notifications
            await this.loadNotifications();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Request notification permissions
            await this.requestPermissions();
            
            // Initialize notification center
            this.updateNotificationCenter();
            
            logger.info('Notification System initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'notification-system-init'
            });
        }
    }

    async loadNotifications() {
        try {
            const savedNotifications = await storageUtils.notifications.load();
            this.notifications = savedNotifications || [];
            logger.info(`Loaded ${this.notifications.length} notifications`);
        } catch (error) {
            logger.error('Failed to load notifications', null, error);
            this.notifications = [];
        }
    }

    initializeUI() {
        // Create notification center if it doesn't exist
        if (!document.getElementById('notification-center')) {
            const notificationCenter = document.createElement('div');
            notificationCenter.id = 'notification-center';
            notificationCenter.className = 'notification-center';
            document.body.appendChild(notificationCenter);
        }



        // Create notification settings modal
        if (!document.getElementById('notification-settings-modal')) {
            const modal = document.createElement('div');
            modal.id = 'notification-settings-modal';
            modal.className = 'modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔔 Notification Settings</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <form id="notification-settings-form" class="settings-form">
                        <div class="settings-section">
                            <h4>General Settings</h4>
                            <div class="form-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="notifications-enabled" 
                                           ${this.settings.enabled ? 'checked' : ''}>
                                    Enable notifications
                                </label>
                            </div>
                            <div class="form-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="notifications-sound" 
                                           ${this.settings.sound ? 'checked' : ''}>
                                    Play sound
                                </label>
                            </div>
                            <div class="form-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="notifications-vibration" 
                                           ${this.settings.vibration ? 'checked' : ''}>
                                    Vibrate device
                                </label>
                            </div>
                            <div class="form-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="notifications-desktop" 
                                           ${this.settings.desktop ? 'checked' : ''}>
                                    Desktop notifications
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4>Category Settings</h4>
                            ${Object.entries(this.settings.categories).map(([category, config]) => `
                                <div class="form-section">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="category-${category}" 
                                               ${config.enabled ? 'checked' : ''}>
                                        ${this.getCategoryDisplayName(category)}
                                    </label>
                                    <select id="priority-${category}" class="priority-select">
                                        <option value="low" ${config.priority === 'low' ? 'selected' : ''}>Low</option>
                                        <option value="medium" ${config.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                        <option value="high" ${config.priority === 'high' ? 'selected' : ''}>High</option>
                                        <option value="critical" ${config.priority === 'critical' ? 'selected' : ''}>Critical</option>
                                    </select>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="settings-section">
                            <h4>Auto-Clear Settings</h4>
                            <div class="form-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="auto-clear-enabled" 
                                           ${this.settings.autoClear ? 'checked' : ''}>
                                    Auto-clear notifications
                                </label>
                            </div>
                            <div class="form-section">
                                <label for="auto-clear-delay">Auto-clear delay (seconds)</label>
                                <input type="number" id="auto-clear-delay" 
                                       value="${this.settings.autoClearDelay / 1000}" min="1" max="60">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                💾 Save Settings
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-notification-settings">
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    setupEventListeners() {
        // Notification bell click
        const bellBtn = document.querySelector('.bell-btn');
        if (bellBtn) {
            bellBtn.addEventListener('click', () => this.toggleNotificationCenter());
        }

        // Notification settings
        const settingsBtn = document.querySelector('.notification-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // Settings modal controls
        const settingsModal = document.getElementById('notification-settings-modal');
        const settingsModalClose = document.querySelector('#notification-settings-modal .modal-close');
        const cancelSettingsBtn = document.getElementById('cancel-notification-settings');
        const settingsForm = document.getElementById('notification-settings-form');

        if (settingsModalClose) {
            settingsModalClose.addEventListener('click', () => this.hideSettingsModal());
        }

        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }

        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.hideSettingsModal();
                }
            });
        }

        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Close notification center when clicking outside
        document.addEventListener('click', (e) => {
            const center = document.getElementById('notification-center');
            
            if (center && center.classList.contains('active') && 
                !center.contains(e.target)) {
                this.hideNotificationCenter();
            }
        });
    }

    async requestPermissions() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                logger.info('Notification permission status', { permission });
                
                if (permission === 'granted') {
                    this.settings.desktop = true;
                }
            }
        } catch (error) {
            logger.error('Error requesting notification permissions', null, error);
        }
    }

    show(type, message, options = {}) {
        try {
            const notification = {
                id: generateId('notification'),
                type: type,
                message: message,
                title: options.title || this.getDefaultTitle(type),
                category: options.category || 'system',
                priority: options.priority || this.settings.categories[options.category || 'system']?.priority || 'medium',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                actions: options.actions || [],
                data: options.data || {},
                expiresAt: options.expiresAt || null
            };

            // Add to notifications array
            this.notifications.unshift(notification);

            // Limit notifications
            if (this.notifications.length > this.settings.maxNotifications) {
                this.notifications = this.notifications.slice(0, this.settings.maxNotifications);
            }

            // Save to storage
            storageUtils.notifications.save(this.notifications);

            // Display notification
            this.displayNotification(notification);

            // Update notification center
            this.updateNotificationCenter();

            // Trigger subscribers
            this.triggerSubscribers('notification', notification);

            logger.info('Notification created', notification);

            return notification.id;

        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'show-notification'
            });
        }
    }

    displayNotification(notification) {
        // Check if notification should be displayed
        if (!this.settings.enabled) return;
        
        const category = this.settings.categories[notification.category];
        if (!category || !category.enabled) return;

        // Create notification element
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification notification-${notification.type}`;
        notificationElement.dataset.notificationId = notification.id;
        
        const typeConfig = this.notificationTypes[notification.type] || this.notificationTypes.info;
        
        notificationElement.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${typeConfig.icon}</span>
                <span class="notification-title">${notification.title}</span>
                <button type="button" class="notification-close">&times;</button>
            </div>
            <div class="notification-body">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatDate(notification.timestamp)}</div>
            </div>
            ${notification.actions.length > 0 ? `
                <div class="notification-actions">
                    ${notification.actions.map(action => `
                        <button type="button" class="btn btn-sm btn-${action.type || 'secondary'}" 
                                data-action="${action.id}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Add to notification center
        const center = document.getElementById('notification-center');
        if (center) {
            center.appendChild(notificationElement);
        }

        // Set up event listeners
        this.setupNotificationEventListeners(notificationElement, notification);

        // Play sound
        if (this.settings.sound) {
            this.playNotificationSound(typeConfig.sound);
        }

        // Vibrate device
        if (this.settings.vibration && 'vibrate' in navigator) {
            this.vibrateDevice(notification.priority);
        }

        // Show desktop notification
        if (this.settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
            this.showDesktopNotification(notification);
        }

        // Auto-clear
        if (this.settings.autoClear) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, this.settings.autoClearDelay);
        }

        // Expiration
        if (notification.expiresAt) {
            const expiresIn = new Date(notification.expiresAt) - new Date();
            if (expiresIn > 0) {
                setTimeout(() => {
                    this.dismiss(notification.id);
                }, expiresIn);
            }
        }
    }

    setupNotificationEventListeners(element, notification) {
        // Close button
        const closeBtn = element.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dismiss(notification.id);
            });
        }

        // Action buttons
        const actionButtons = element.querySelectorAll('[data-action]');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.target.dataset.action;
                const action = notification.actions.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler(notification);
                }
                this.dismiss(notification.id);
            });
        });

        // Click to mark as read
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close') && !e.target.closest('[data-action]')) {
                this.markAsRead(notification.id);
            }
        });
    }

    playNotificationSound(soundFile) {
        try {
            const audio = new Audio(`data/audio/${soundFile}`);
            audio.volume = 0.5;
            audio.play().catch(error => {
                logger.warn('Could not play notification sound', null, error);
            });
        } catch (error) {
            logger.warn('Error playing notification sound', null, error);
        }
    }

    vibrateDevice(priority) {
        try {
            const patterns = {
                low: [100],
                medium: [200, 100, 200],
                high: [300, 100, 300, 100, 300],
                critical: [500, 200, 500, 200, 500, 200, 500]
            };
            
            const pattern = patterns[priority] || patterns.medium;
            navigator.vibrate(pattern);
        } catch (error) {
            logger.warn('Error vibrating device', null, error);
        }
    }

    showDesktopNotification(notification) {
        try {
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/images/icons/icon-96x96.svg',
                badge: '/images/icons/icon-32x32.svg',
                tag: notification.id,
                requireInteraction: notification.priority === 'critical',
                actions: notification.actions.map(action => ({
                    action: action.id,
                    title: action.label
                }))
            });

            desktopNotification.onclick = () => {
                this.markAsRead(notification.id);
                desktopNotification.close();
            };

            desktopNotification.onactionclick = (event) => {
                const action = notification.actions.find(a => a.id === event.action);
                if (action && action.handler) {
                    action.handler(notification);
                }
                desktopNotification.close();
            };

        } catch (error) {
            logger.error('Error showing desktop notification', null, error);
        }
    }

    updateNotificationCenter() {
        const center = document.getElementById('notification-center');
        const countElement = document.getElementById('notification-count');
        
        if (!center) return;

        // Update notification count
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (countElement) {
            countElement.textContent = unreadCount;
            countElement.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        // Update center content
        if (this.notifications.length === 0) {
            center.innerHTML = `
                <div class="notification-center-header">
                    <h3>🔔 Notifications</h3>
                    <button type="button" class="notification-settings-btn">⚙️</button>
                </div>
                <div class="no-notifications">
                    <p>No notifications</p>
                </div>
            `;
        } else {
            center.innerHTML = `
                <div class="notification-center-header">
                    <h3>🔔 Notifications</h3>
                    <div class="notification-controls">
                        <button type="button" class="mark-all-read-btn">Mark all read</button>
                        <button type="button" class="clear-all-btn">Clear all</button>
                        <button type="button" class="notification-settings-btn">⚙️</button>
                    </div>
                </div>
                <div class="notifications-list">
                    ${this.notifications.map(notification => this.renderNotificationItem(notification)).join('')}
                </div>
            `;
        }

        // Set up center event listeners
        this.setupCenterEventListeners();
    }

    renderNotificationItem(notification) {
        const typeConfig = this.notificationTypes[notification.type] || this.notificationTypes.info;
        const isRead = notification.read ? 'read' : 'unread';
        
        return `
            <div class="notification-item ${isRead} ${notification.type}" data-notification-id="${notification.id}">
                <div class="notification-item-icon">${typeConfig.icon}</div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${notification.title}</div>
                    <div class="notification-item-message">${notification.message}</div>
                    <div class="notification-item-meta">
                        <span class="notification-item-time">${formatDate(notification.timestamp)}</span>
                        <span class="notification-item-category">${notification.category}</span>
                    </div>
                </div>
                <div class="notification-item-actions">
                    <button type="button" class="btn btn-sm btn-secondary mark-read-btn" 
                            title="${notification.read ? 'Mark as unread' : 'Mark as read'}">
                        ${notification.read ? '👁️' : '✓'}
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary dismiss-btn" title="Dismiss">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }

    setupCenterEventListeners() {
        // Mark all read button
        const markAllReadBtn = document.querySelector('.mark-all-read-btn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Clear all button
        const clearAllBtn = document.querySelector('.clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }

        // Settings button
        const settingsBtn = document.querySelector('.notification-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // Individual notification actions
        const markReadBtns = document.querySelectorAll('.mark-read-btn');
        markReadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                this.toggleReadStatus(notificationId);
            });
        });

        const dismissBtns = document.querySelectorAll('.dismiss-btn');
        dismissBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                this.dismiss(notificationId);
            });
        });
    }

    toggleNotificationCenter() {
        const center = document.getElementById('notification-center');
        if (center) {
            center.classList.toggle('active');
        }
    }

    hideNotificationCenter() {
        const center = document.getElementById('notification-center');
        if (center) {
            center.classList.remove('active');
        }
    }

    showSettingsModal() {
        const modal = document.getElementById('notification-settings-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideSettingsModal() {
        const modal = document.getElementById('notification-settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async saveSettings() {
        try {
            const newSettings = {
                enabled: document.getElementById('notifications-enabled').checked,
                sound: document.getElementById('notifications-sound').checked,
                vibration: document.getElementById('notifications-vibration').checked,
                desktop: document.getElementById('notifications-desktop').checked,
                autoClear: document.getElementById('auto-clear-enabled').checked,
                autoClearDelay: parseInt(document.getElementById('auto-clear-delay').value) * 1000,
                categories: {}
            };

            // Get category settings
            Object.keys(this.settings.categories).forEach(category => {
                newSettings.categories[category] = {
                    enabled: document.getElementById(`category-${category}`).checked,
                    priority: document.getElementById(`priority-${category}`).value
                };
            });

            this.settings = newSettings;
            
            // Save to storage
            await storageUtils.settingsManager.save(this.settings);
            
            this.hideSettingsModal();
            this.show('success', 'Notification settings saved successfully');
            
            logger.info('Notification settings updated', newSettings);
            
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'save-notification-settings'
            });
            
            this.show('error', 'Failed to save notification settings');
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            storageUtils.notifications.save(this.notifications);
            this.updateNotificationCenter();
            logger.info('Notification marked as read', { notificationId });
        }
    }

    toggleReadStatus(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = !notification.read;
            storageUtils.notifications.save(this.notifications);
            this.updateNotificationCenter();
            logger.info('Notification read status toggled', { notificationId, read: notification.read });
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        storageUtils.notifications.save(this.notifications);
        this.updateNotificationCenter();
        logger.info('All notifications marked as read');
    }

    dismiss(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.dismissed = true;
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            storageUtils.notifications.save(this.notifications);
            this.updateNotificationCenter();
            logger.info('Notification dismissed', { notificationId });
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            this.notifications = [];
            storageUtils.notifications.save(this.notifications);
            this.updateNotificationCenter();
            logger.info('All notifications cleared');
        }
    }

    getDefaultTitle(type) {
        const titles = {
            success: 'Success',
            info: 'Information',
            warning: 'Warning',
            error: 'Error',
            security: 'Security Alert',
            emergency: 'Emergency',
            maintenance: 'Maintenance',
            financial: 'Financial Update'
        };
        return titles[type] || 'Notification';
    }

    getCategoryDisplayName(category) {
        const names = {
            system: 'System Notifications',
            security: 'Security Alerts',
            maintenance: 'Maintenance Updates',
            financial: 'Financial Notifications',
            customer: 'Customer Service',
            emergency: 'Emergency Alerts'
        };
        return names[category] || category;
    }

    // Subscription system for other modules
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);
    }

    unsubscribe(event, callback) {
        if (this.subscribers.has(event)) {
            const callbacks = this.subscribers.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    triggerSubscribers(event, data) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error('Error in notification subscriber', null, error);
                }
            });
        }
    }

    // Public methods for external access
    getNotifications() {
        return this.notifications;
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    getSettings() {
        return this.settings;
    }

    async exportNotifications(format = 'json') {
        try {
            const data = {
                notifications: this.notifications,
                settings: this.settings,
                summary: {
                    total: this.notifications.length,
                    unread: this.getUnreadCount(),
                    byType: Object.keys(this.notificationTypes).reduce((acc, type) => {
                        acc[type] = this.notifications.filter(n => n.type === type).length;
                        return acc;
                    }, {}),
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data.notifications);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting notifications', null, error);
            throw error;
        }
    }

    convertToCSV(notifications) {
        const headers = ['ID', 'Type', 'Title', 'Message', 'Category', 'Priority', 'Timestamp', 'Read', 'Dismissed'];
        const rows = notifications.map(n => [
            n.id,
            n.type,
            n.title,
            n.message,
            n.category,
            n.priority,
            n.timestamp,
            n.read ? 'Yes' : 'No',
            n.dismissed ? 'Yes' : 'No'
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationSystem = new NotificationSystem();
    });
} else {
    window.notificationSystem = new NotificationSystem();
}

// Utility function for simple notifications
export function showNotification(message, type = 'info', options = {}) {
    if (window.notificationSystem) {
        return window.notificationSystem.show(type, message, options);
    } else {
        // Fallback for when notification system isn't ready
        console.warn('Notification system not ready, using fallback');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

export default window.notificationSystem; 