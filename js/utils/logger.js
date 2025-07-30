/**
 * Logger Module
 * Centralized logging for the BTM Utility application
 */

import { config } from './config.js';

/**
 * Log levels
 * @enum {number}
 */
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

/**
 * Logger class
 * @class
 */
class Logger {
    /**
     * Create a new Logger instance
     */
    constructor() {
        this.level = config.app.debug ? LogLevel.DEBUG : LogLevel.INFO;
        this.logs = [];
        this.maxLogs = 100;
    }
    
    /**
     * Set log level
     * @param {LogLevel} level - Log level
     */
    setLevel(level) {
        this.level = level;
    }
    
    /**
     * Log a debug message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    debug(message, data) {
        this._log(LogLevel.DEBUG, message, data);
    }
    
    /**
     * Log an info message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    info(message, data) {
        this._log(LogLevel.INFO, message, data);
    }
    
    /**
     * Log a warning message
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     */
    warn(message, data) {
        this._log(LogLevel.WARN, message, data);
    }
    
    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {Error|Object} [error] - Error object or additional data
     */
    error(message, error) {
        this._log(LogLevel.ERROR, message, error);
    }
    
    /**
     * Internal logging method
     * @param {LogLevel} level - Log level
     * @param {string} message - Message to log
     * @param {Object} [data] - Additional data
     * @private
     */
    _log(level, message, data) {
        if (level < this.level) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            level,
            message,
            timestamp,
            data,
        };
        
        // Add to internal log storage
        this.logs.push(logEntry);
        
        // Trim logs if needed
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Output to console
        const logMethod = this._getConsoleMethod(level);
        
        if (data) {
            console[logMethod](
                `[${this._getLevelName(level)}] ${timestamp} - ${message}`,
                data instanceof Error ? data.stack || data.message : data
            );
        } else {
            console[logMethod](`[${this._getLevelName(level)}] ${timestamp} - ${message}`);
        }
    }
    
    /**
     * Get console method for log level
     * @param {LogLevel} level - Log level
     * @returns {string} Console method name
     * @private
     */
    _getConsoleMethod(level) {
        switch (level) {
            case LogLevel.DEBUG:
                return 'debug';
            case LogLevel.INFO:
                return 'info';
            case LogLevel.WARN:
                return 'warn';
            case LogLevel.ERROR:
                return 'error';
            default:
                return 'log';
        }
    }
    
    /**
     * Get name for log level
     * @param {LogLevel} level - Log level
     * @returns {string} Level name
     * @private
     */
    _getLevelName(level) {
        switch (level) {
            case LogLevel.DEBUG:
                return 'DEBUG';
            case LogLevel.INFO:
                return 'INFO';
            case LogLevel.WARN:
                return 'WARN';
            case LogLevel.ERROR:
                return 'ERROR';
            default:
                return 'UNKNOWN';
        }
    }
    
    /**
     * Get all logs
     * @returns {Array} Log entries
     */
    getLogs() {
        return [...this.logs];
    }
    
    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
    }
}

// Export singleton instance
export const logger = new Logger(); 