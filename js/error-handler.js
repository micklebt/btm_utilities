/**
 * Error Handler Module
 * Comprehensive error handling with user-friendly messages and recovery
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, playErrorBeep } from './utils.js';

// Error types
export const ErrorType = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    SERVER: 'server',
    CLIENT: 'client',
    UNKNOWN: 'unknown',
};

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};

// User-friendly error messages
const ErrorMessages = {
    [ErrorType.NETWORK]: {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Retry',
    },
    [ErrorType.VALIDATION]: {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        action: 'Fix Input',
    },
    [ErrorType.AUTHENTICATION]: {
        title: 'Authentication Required',
        message: 'Please log in to continue.',
        action: 'Login',
    },
    [ErrorType.AUTHORIZATION]: {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        action: 'Contact Admin',
    },
    [ErrorType.NOT_FOUND]: {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        action: 'Go Back',
    },
    [ErrorType.SERVER]: {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'Retry',
    },
    [ErrorType.CLIENT]: {
        title: 'Application Error',
        message: 'Something went wrong. Please refresh the page and try again.',
        action: 'Refresh',
    },
    [ErrorType.UNKNOWN]: {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Retry',
    },
};

// Error handler class
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.recoveryStrategies = new Map();
        this.errorCallbacks = new Map();
        this.isHandling = false;
        this.setupGlobalHandlers();
    }

    // Setup global error handlers
    setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: ErrorType.UNKNOWN,
                severity: ErrorSeverity.HIGH,
                context: 'unhandledrejection',
            });
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                type: ErrorType.CLIENT,
                severity: ErrorSeverity.MEDIUM,
                context: 'javascript',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), {
                    type: ErrorType.NETWORK,
                    severity: ErrorSeverity.LOW,
                    context: 'resource',
                    resource: event.target.src || event.target.href,
                });
            }
        }, true);
    }

    // Create error object
    createError(error, options = {}) {
        const errorId = generateId('error');
        const timestamp = Date.now();

        const errorObj = {
            id: errorId,
            timestamp,
            type: options.type || ErrorType.UNKNOWN,
            severity: options.severity || ErrorSeverity.MEDIUM,
            message: error.message || 'Unknown error',
            stack: error.stack,
            name: error.name,
            code: error.code,
            context: options.context || 'general',
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            sessionId: logger.sessionId,
            userId: logger.userId,
            additionalData: options.data || {},
        };

        return errorObj;
    }

    // Handle error
    async handleError(error, options = {}) {
        if (this.isHandling) {
            console.warn('Error handler is already processing an error');
            return;
        }

        this.isHandling = true;

        try {
            // Create error object
            const errorObj = this.createError(error, options);

            // Log error
            logger.error(errorObj.message, errorObj, error);

            // Add to errors list
            this.addError(errorObj);

            // Store error
            this.storeError(errorObj);

            // Get user-friendly message
            const userMessage = this.getUserMessage(errorObj);

            // Show error to user
            await this.showErrorToUser(errorObj, userMessage);

            // Play error beep for high severity errors
            if (errorObj.severity === ErrorSeverity.HIGH || errorObj.severity === ErrorSeverity.CRITICAL) {
                playErrorBeep();
            }

            // Execute recovery strategy
            await this.executeRecoveryStrategy(errorObj);

            // Trigger error callbacks
            this.triggerErrorCallbacks(errorObj);

        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
        } finally {
            this.isHandling = false;
        }
    }

    // Add error to list
    addError(errorObj) {
        this.errors.push(errorObj);

        // Keep only the latest errors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
    }

    // Store error in localStorage
    storeError(errorObj) {
        try {
            const storedErrors = storageUtils.get('btm_errors', false, []);
            storedErrors.push(errorObj);

            // Keep only the latest 50 errors in storage
            if (storedErrors.length > 50) {
                storedErrors.splice(0, storedErrors.length - 50);
            }

            storageUtils.set('btm_errors', storedErrors, false);
        } catch (error) {
            console.error('Failed to store error:', error);
        }
    }

    // Get user-friendly message
    getUserMessage(errorObj) {
        const template = ErrorMessages[errorObj.type] || ErrorMessages[ErrorType.UNKNOWN];
        
        return {
            title: template.title,
            message: template.message,
            action: template.action,
            errorId: errorObj.id,
            timestamp: formatDate(errorObj.timestamp),
        };
    }

    // Show error to user
    async showErrorToUser(errorObj, userMessage) {
        // Don't show low severity errors to user
        if (errorObj.severity === ErrorSeverity.LOW) {
            return;
        }

        // Create error notification
        const notification = this.createErrorNotification(userMessage, errorObj);

        // Show notification
        this.showNotification(notification);

        // For critical errors, show modal
        if (errorObj.severity === ErrorSeverity.CRITICAL) {
            await this.showErrorModal(userMessage, errorObj);
        }
    }

    // Create error notification
    createErrorNotification(userMessage, errorObj) {
        const notification = document.createElement('div');
        notification.className = `notification error`;
        notification.innerHTML = `
            <div class="notification-header">
                <h4>${userMessage.title}</h4>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-body">
                <p>${userMessage.message}</p>
                <div class="notification-actions">
                    <button class="notification-action" data-action="${userMessage.action.toLowerCase().replace(' ', '-')}">
                        ${userMessage.action}
                    </button>
                    <button class="notification-action secondary" data-action="dismiss">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });

        notification.querySelectorAll('.notification-action').forEach(button => {
            button.addEventListener('click', () => {
                this.handleNotificationAction(button.dataset.action, errorObj);
                this.removeNotification(notification);
            });
        });

        return notification;
    }

    // Show notification
    showNotification(notification) {
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                this.removeNotification(notification);
            }, 10000);
        }
    }

    // Remove notification
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }

    // Handle notification action
    handleNotificationAction(action, errorObj) {
        switch (action) {
            case 'retry':
                this.retryOperation(errorObj);
                break;
            case 'refresh':
                window.location.reload();
                break;
            case 'go-back':
                window.history.back();
                break;
            case 'login':
                this.redirectToLogin();
                break;
            case 'contact-admin':
                this.contactAdmin(errorObj);
                break;
            case 'fix-input':
                this.focusOnInput();
                break;
            case 'dismiss':
                // Do nothing, just dismiss
                break;
        }
    }

    // Show error modal
    async showErrorModal(userMessage, errorObj) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${userMessage.title}</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${userMessage.message}</p>
                    <div class="error-details">
                        <p><strong>Error ID:</strong> ${errorObj.id}</p>
                        <p><strong>Time:</strong> ${userMessage.timestamp}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="primary-button" data-action="${userMessage.action.toLowerCase().replace(' ', '-')}">
                            ${userMessage.action}
                        </button>
                        <button class="secondary-button" data-action="close">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.close-button').addEventListener('click', () => {
            this.closeErrorModal(modal);
        });

        modal.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                this.handleNotificationAction(button.dataset.action, errorObj);
                this.closeErrorModal(modal);
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeErrorModal(modal);
            }
        });
    }

    // Close error modal
    closeErrorModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    // Register recovery strategy
    registerRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }

    // Execute recovery strategy
    async executeRecoveryStrategy(errorObj) {
        const strategy = this.recoveryStrategies.get(errorObj.type);
        if (strategy && typeof strategy === 'function') {
            try {
                await strategy(errorObj);
            } catch (error) {
                logger.error('Recovery strategy failed', { errorObj, recoveryError: error });
            }
        }
    }

    // Register error callback
    onError(errorType, callback) {
        if (!this.errorCallbacks.has(errorType)) {
            this.errorCallbacks.set(errorType, new Set());
        }
        this.errorCallbacks.get(errorType).add(callback);
    }

    // Trigger error callbacks
    triggerErrorCallbacks(errorObj) {
        const callbacks = this.errorCallbacks.get(errorObj.type);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(errorObj);
                } catch (error) {
                    logger.error('Error callback failed', { errorObj, callbackError: error });
                }
            });
        }
    }

    // Retry operation
    retryOperation(errorObj) {
        // This would be implemented based on the specific operation that failed
        logger.info('Retrying operation', { errorId: errorObj.id });
    }

    // Redirect to login
    redirectToLogin() {
        // This would redirect to the login page
        logger.info('Redirecting to login');
    }

    // Contact admin
    contactAdmin(errorObj) {
        // This would open a contact form or email client
        logger.info('Contacting admin', { errorId: errorObj.id });
    }

    // Focus on input
    focusOnInput() {
        // This would focus on the problematic input field
        logger.info('Focusing on input field');
    }

    // Get errors
    getErrors(type = null, severity = null, limit = null) {
        let filteredErrors = this.errors;

        if (type !== null) {
            filteredErrors = filteredErrors.filter(error => error.type === type);
        }

        if (severity !== null) {
            filteredErrors = filteredErrors.filter(error => error.severity === severity);
        }

        if (limit !== null) {
            filteredErrors = filteredErrors.slice(-limit);
        }

        return filteredErrors;
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            bySeverity: {},
            byContext: {},
            timeRange: {
                start: null,
                end: null,
            },
        };

        this.errors.forEach(error => {
            // Count by type
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

            // Count by context
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;

            // Track time range
            if (!stats.timeRange.start || error.timestamp < stats.timeRange.start) {
                stats.timeRange.start = error.timestamp;
            }
            if (!stats.timeRange.end || error.timestamp > stats.timeRange.end) {
                stats.timeRange.end = error.timestamp;
            }
        });

        return stats;
    }

    // Clear errors
    clearErrors() {
        this.errors = [];
        storageUtils.remove('btm_errors');
    }

    // Export errors
    exportErrors(format = 'json') {
        const errors = this.getErrors();

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(errors, null, 2);
            case 'csv':
                return this.convertErrorsToCSV(errors);
            default:
                return JSON.stringify(errors, null, 2);
        }
    }

    // Convert errors to CSV
    convertErrorsToCSV(errors) {
        const headers = ['Timestamp', 'Type', 'Severity', 'Message', 'Context', 'Error ID'];
        const rows = errors.map(error => [
            formatDate(error.timestamp),
            error.type,
            error.severity,
            error.message,
            error.context,
            error.id,
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export error handler instance and utilities
export { errorHandler };

// Export default error handler
export default errorHandler; 