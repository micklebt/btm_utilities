/**
 * Notifications Component
 * Handles application notifications and alerts
 */

import { logger } from '../utils/logger.js';
import { storageUtils } from '../utils/storage.js';

/**
 * Notification types
 * @enum {string}
 */
export const NotificationType = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
};

/**
 * Notification component class
 * @class
 */
export class NotificationManager {
    /**
     * Create a new NotificationManager instance
     * @param {Object} options - Notification options
     * @param {number} options.maxNotifications - Maximum number of notifications to show
     * @param {number} options.autoHideDuration - Auto-hide duration in milliseconds
     */
    constructor(options = {}) {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = options.maxNotifications || 5;
        this.autoHideDuration = options.autoHideDuration || 5000;
    }
    
    /**
     * Initialize notification manager
     */
    init() {
        logger.info('Initializing notification manager');
        
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
        
        // Load saved notifications
        this.loadNotifications();
    }
    
    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {NotificationType} type - Notification type
     * @param {Object} options - Additional options
     * @param {boolean} options.persist - Whether to persist the notification
     * @param {number} options.duration - Auto-hide duration in milliseconds
     * @param {Function} options.onClick - Click handler
     * @returns {string} Notification ID
     */
    show(message, type = NotificationType.INFO, options = {}) {
        const id = `notification-${Date.now()}`;
        const duration = options.duration || this.autoHideDuration;
        const persist = options.persist || false;
        
        // Create notification object
        const notification = {
            id,
            message,
            type,
            timestamp: new Date().toISOString(),
            persist,
        };
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Trim notifications if needed
        if (this.notifications.length > this.maxNotifications) {
            const removedNotification = this.notifications.shift();
            this.removeNotificationElement(removedNotification.id);
        }
        
        // Save notifications if persistent
        if (persist) {
            this.saveNotifications();
        }
        
        // Create notification element
        this.createNotificationElement(notification, options.onClick);
        
        // Auto-hide notification
        if (!persist) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        logger.debug(`Notification shown: ${message}`, { type, id });
        
        return id;
    }
    
    /**
     * Show an info notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    info(message, options = {}) {
        return this.show(message, NotificationType.INFO, options);
    }
    
    /**
     * Show a success notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    success(message, options = {}) {
        return this.show(message, NotificationType.SUCCESS, options);
    }
    
    /**
     * Show a warning notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    warning(message, options = {}) {
        return this.show(message, NotificationType.WARNING, options);
    }
    
    /**
     * Show an error notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    error(message, options = {}) {
        return this.show(message, NotificationType.ERROR, options);
    }
    
    /**
     * Hide a notification
     * @param {string} id - Notification ID
     */
    hide(id) {
        // Find notification index
        const index = this.notifications.findIndex(n => n.id === id);
        
        if (index !== -1) {
            // Remove from notifications array
            const notification = this.notifications.splice(index, 1)[0];
            
            // Remove notification element
            this.removeNotificationElement(id);
            
            // Save notifications if needed
            if (notification.persist) {
                this.saveNotifications();
            }
            
            logger.debug(`Notification hidden: ${id}`);
        }
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        // Clear notifications array
        this.notifications = [];
        
        // Clear notification container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Clear saved notifications
        this.saveNotifications();
        
        logger.debug('All notifications cleared');
    }
    
    /**
     * Create notification element
     * @param {Object} notification - Notification object
     * @param {Function} onClick - Click handler
     * @private
     */
    createNotificationElement(notification, onClick) {
        if (!this.container) return;
        
        // Create notification element
        const element = document.createElement('div');
        element.id = notification.id;
        element.className = `notification ${notification.type}`;
        element.setAttribute('role', 'alert');
        
        // Create message element
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = notification.message;
        element.appendChild(message);
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.hide(notification.id);
        });
        element.appendChild(closeButton);
        
        // Add click handler
        if (onClick) {
            element.addEventListener('click', () => {
                onClick(notification);
            });
            element.style.cursor = 'pointer';
        }
        
        // Add to container
        this.container.appendChild(element);
        
        // Trigger animation
        setTimeout(() => {
            element.classList.add('show');
        }, 10);
    }
    
    /**
     * Remove notification element
     * @param {string} id - Notification ID
     * @private
     */
    removeNotificationElement(id) {
        if (!this.container) return;
        
        const element = document.getElementById(id);
        
        if (element) {
            // Trigger hide animation
            element.classList.remove('show');
            
            // Remove element after animation
            setTimeout(() => {
                if (element.parentNode === this.container) {
                    this.container.removeChild(element);
                }
            }, 300);
        }
    }
    
    /**
     * Save notifications to storage
     * @private
     */
    saveNotifications() {
        // Only save persistent notifications
        const persistentNotifications = this.notifications.filter(n => n.persist);
        storageUtils.set('notifications', persistentNotifications);
    }
    
    /**
     * Load notifications from storage
     * @private
     */
    loadNotifications() {
        const savedNotifications = storageUtils.get('notifications', []);
        
        // Add saved notifications
        savedNotifications.forEach(notification => {
            this.show(
                notification.message,
                notification.type,
                { persist: true }
            );
        });
    }
    
    /**
     * Play notification sound
     * @param {NotificationType} type - Notification type
     * @private
     */
    playSound(type) {
        // Implementation depends on available audio resources
        const audio = new Audio();
        
        switch (type) {
            case NotificationType.SUCCESS:
                audio.src = '/sounds/success.mp3';
                break;
            case NotificationType.WARNING:
                audio.src = '/sounds/warning.mp3';
                break;
            case NotificationType.ERROR:
                audio.src = '/sounds/error.mp3';
                break;
            default:
                audio.src = '/sounds/notification.mp3';
                break;
        }
        
        audio.play().catch(error => {
            logger.debug('Could not play notification sound', error);
        });
    }
}

// Export singleton instance
export const notificationManager = new NotificationManager(); 