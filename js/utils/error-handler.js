/**
 * Error Handler Module
 * Centralized error handling for the BTM Utility application
 */

import { logger } from './logger.js';

/**
 * Error types
 * @enum {string}
 */
export const ErrorType = {
    NETWORK: 'network',
    API: 'api',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    TIMEOUT: 'timeout',
    UNKNOWN: 'unknown',
};

/**
 * Custom application error
 * @class
 * @extends Error
 */
export class AppError extends Error {
    /**
     * Create a new AppError
     * @param {string} message - Error message
     * @param {ErrorType} type - Error type
     * @param {Object} [data] - Additional error data
     */
    constructor(message, type = ErrorType.UNKNOWN, data = null) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.data = data;
        this.timestamp = new Date().toISOString();
    }
    
    /**
     * Convert to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            data: this.data,
            timestamp: this.timestamp,
            stack: this.stack,
        };
    }
}

/**
 * Error handler class
 * @class
 */
class ErrorHandler {
    /**
     * Create a new ErrorHandler instance
     */
    constructor() {
        this.errorListeners = new Set();
        
        // Set up global error handlers
        this._setupGlobalHandlers();
    }
    
    /**
     * Set up global error handlers
     * @private
     */
    _setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason || new Error('Unhandled Promise rejection'));
            // Prevent default browser handling
            event.preventDefault();
        });
        
        // Handle uncaught exceptions
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message));
            // Prevent default browser handling
            event.preventDefault();
        });
    }
    
    /**
     * Handle an error
     * @param {Error|AppError|string} error - Error to handle
     * @returns {AppError} Normalized error
     */
    handleError(error) {
        // Normalize error
        const appError = this._normalizeError(error);
        
        // Log error
        logger.error(appError.message, appError);
        
        // Notify listeners
        this._notifyListeners(appError);
        
        return appError;
    }
    
    /**
     * Normalize an error to AppError
     * @param {Error|AppError|string} error - Error to normalize
     * @returns {AppError} Normalized error
     * @private
     */
    _normalizeError(error) {
        if (error instanceof AppError) {
            return error;
        }
        
        if (error instanceof Error) {
            return new AppError(error.message, this._determineErrorType(error), {
                originalError: error,
                stack: error.stack,
            });
        }
        
        if (typeof error === 'string') {
            return new AppError(error);
        }
        
        return new AppError('Unknown error occurred', ErrorType.UNKNOWN, error);
    }
    
    /**
     * Determine error type from Error object
     * @param {Error} error - Error object
     * @returns {ErrorType} Error type
     * @private
     */
    _determineErrorType(error) {
        if (error.name === 'NetworkError' || error.message.includes('network')) {
            return ErrorType.NETWORK;
        }
        
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            return ErrorType.TIMEOUT;
        }
        
        if (error.status === 401 || error.message.includes('unauthorized')) {
            return ErrorType.AUTHENTICATION;
        }
        
        if (error.status === 403 || error.message.includes('forbidden')) {
            return ErrorType.AUTHORIZATION;
        }
        
        if (error.status === 404 || error.message.includes('not found')) {
            return ErrorType.NOT_FOUND;
        }
        
        if (error.status >= 400 && error.status < 500) {
            return ErrorType.VALIDATION;
        }
        
        if (error.status >= 500) {
            return ErrorType.API;
        }
        
        return ErrorType.UNKNOWN;
    }
    
    /**
     * Add error listener
     * @param {Function} listener - Error listener function
     * @returns {Function} Function to remove listener
     */
    addListener(listener) {
        this.errorListeners.add(listener);
        
        // Return function to remove listener
        return () => {
            this.errorListeners.delete(listener);
        };
    }
    
    /**
     * Notify error listeners
     * @param {AppError} error - Error to notify about
     * @private
     */
    _notifyListeners(error) {
        this.errorListeners.forEach((listener) => {
            try {
                listener(error);
            } catch (listenerError) {
                logger.error('Error in error listener', listenerError);
            }
        });
    }
    
    /**
     * Create a validation error
     * @param {string} message - Error message
     * @param {Object} [data] - Validation data
     * @returns {AppError} Validation error
     */
    createValidationError(message, data) {
        return new AppError(message, ErrorType.VALIDATION, data);
    }
    
    /**
     * Create a network error
     * @param {string} message - Error message
     * @param {Object} [data] - Error data
     * @returns {AppError} Network error
     */
    createNetworkError(message, data) {
        return new AppError(message, ErrorType.NETWORK, data);
    }
    
    /**
     * Create an API error
     * @param {string} message - Error message
     * @param {Object} [data] - Error data
     * @returns {AppError} API error
     */
    createApiError(message, data) {
        return new AppError(message, ErrorType.API, data);
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandler(); 