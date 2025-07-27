/**
 * Logger Module
 * Comprehensive logging system with error tracking and monitoring
 */

import { config } from './config.js?v=1.0.2';
import { storageUtils } from './storage.js?v=1.0.2';
import { formatDate, generateId } from './utils.js?v=1.0.2';

// Log levels
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
};

// Log level names
const LogLevelNames = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.FATAL]: 'FATAL',
};

// Log colors for console output
const LogColors = {
    [LogLevel.DEBUG]: '#6c757d',
    [LogLevel.INFO]: '#17a2b8',
    [LogLevel.WARN]: '#ffc107',
    [LogLevel.ERROR]: '#dc3545',
    [LogLevel.FATAL]: '#721c24',
};

// Logger class
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Maximum number of logs to keep in memory
        this.logLevel = config.app.debug ? LogLevel.DEBUG : LogLevel.INFO;
        this.enableConsole = true;
        this.enableStorage = true;
        this.enableRemote = false;
        this.remoteEndpoint = null;
        this.sessionId = generateId('session');
        this.userId = null;
        this.context = {};
    }

    // Set log level
    setLogLevel(level) {
        if (Object.values(LogLevel).includes(level)) {
            this.logLevel = level;
        }
    }

    // Set user ID for tracking
    setUserId(userId) {
        this.userId = userId;
    }

    // Add context information
    addContext(key, value) {
        this.context[key] = value;
    }

    // Remove context information
    removeContext(key) {
        delete this.context[key];
    }

    // Clear context
    clearContext() {
        this.context = {};
    }

    // Create log entry
    createLogEntry(level, message, data = null, error = null) {
        const timestamp = Date.now();
        const logEntry = {
            id: generateId('log'),
            timestamp,
            level,
            levelName: LogLevelNames[level],
            message,
            data,
            error: error ? this.serializeError(error) : null,
            sessionId: this.sessionId,
            userId: this.userId,
            context: { ...this.context },
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
        };

        return logEntry;
    }

    // Serialize error object
    serializeError(error) {
        if (!error) return null;

        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause ? this.serializeError(error.cause) : null,
            code: error.code,
            fileName: error.fileName,
            lineNumber: error.lineNumber,
            columnNumber: error.columnNumber,
        };
    }

    // Add log entry
    addLogEntry(logEntry) {
        this.logs.push(logEntry);

        // Keep only the latest logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Store in localStorage if enabled
        if (this.enableStorage) {
            this.storeLog(logEntry);
        }

        // Send to remote endpoint if enabled
        if (this.enableRemote && this.remoteEndpoint) {
            this.sendToRemote(logEntry);
        }
    }

    // Store log in localStorage
    storeLog(logEntry) {
        try {
            const storedLogs = storageUtils.get('btm_logs', false, []);
            storedLogs.push(logEntry);

            // Keep only the latest 100 logs in storage
            if (storedLogs.length > 100) {
                storedLogs.splice(0, storedLogs.length - 100);
            }

            storageUtils.set('btm_logs', storedLogs, false);
        } catch (error) {
            console.error('Failed to store log:', error);
        }
    }

    // Send log to remote endpoint
    async sendToRemote(logEntry) {
        try {
            if (!this.remoteEndpoint) return;

            const response = await fetch(this.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry),
            });

            if (!response.ok) {
                console.warn('Failed to send log to remote endpoint:', response.status);
            }
        } catch (error) {
            console.error('Failed to send log to remote endpoint:', error);
        }
    }

    // Console output with colors
    outputToConsole(logEntry) {
        if (!this.enableConsole) return;

        const timestamp = formatDate(logEntry.timestamp, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        const prefix = `[${timestamp}] [${logEntry.levelName}]`;
        const color = LogColors[logEntry.level];

        // Create console message
        const args = [prefix, logEntry.message];

        if (logEntry.data) {
            args.push(logEntry.data);
        }

        if (logEntry.error) {
            args.push(logEntry.error);
        }

        // Use appropriate console method
        switch (logEntry.level) {
            case LogLevel.DEBUG:
                console.debug(...args);
                break;
            case LogLevel.INFO:
                console.info(...args);
                break;
            case LogLevel.WARN:
                console.warn(...args);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(...args);
                break;
        }
    }

    // Main logging method
    log(level, message, data = null, error = null) {
        if (level < this.logLevel) return;

        const logEntry = this.createLogEntry(level, message, data, error);
        this.addLogEntry(logEntry);
        this.outputToConsole(logEntry);

        return logEntry;
    }

    // Convenience methods
    debug(message, data = null) {
        return this.log(LogLevel.DEBUG, message, data);
    }

    info(message, data = null) {
        return this.log(LogLevel.INFO, message, data);
    }

    warn(message, data = null, error = null) {
        return this.log(LogLevel.WARN, message, data, error);
    }

    error(message, data = null, error = null) {
        return this.log(LogLevel.ERROR, message, data, error);
    }

    fatal(message, data = null, error = null) {
        return this.log(LogLevel.FATAL, message, data, error);
    }

    // Log performance metrics
    time(label) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.timeEnd(label);
        }
    }

    // Get logs
    getLogs(level = null, limit = null) {
        let filteredLogs = this.logs;

        if (level !== null) {
            filteredLogs = filteredLogs.filter(log => log.level >= level);
        }

        if (limit !== null) {
            filteredLogs = filteredLogs.slice(-limit);
        }

        return filteredLogs;
    }

    // Get logs by session
    getLogsBySession(sessionId) {
        return this.logs.filter(log => log.sessionId === sessionId);
    }

    // Get logs by user
    getLogsByUser(userId) {
        return this.logs.filter(log => log.userId === userId);
    }

    // Get error logs
    getErrorLogs() {
        return this.logs.filter(log => log.level >= LogLevel.ERROR);
    }

    // Clear logs
    clearLogs() {
        this.logs = [];
        storageUtils.remove('btm_logs');
    }

    // Export logs
    exportLogs(format = 'json') {
        const logs = this.getLogs();

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(logs, null, 2);
            case 'csv':
                return this.convertToCSV(logs);
            case 'txt':
                return this.convertToText(logs);
            default:
                return JSON.stringify(logs, null, 2);
        }
    }

    // Convert logs to CSV
    convertToCSV(logs) {
        const headers = ['Timestamp', 'Level', 'Message', 'Session ID', 'User ID', 'URL'];
        const rows = logs.map(log => [
            formatDate(log.timestamp),
            log.levelName,
            log.message,
            log.sessionId,
            log.userId || '',
            log.url,
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    // Convert logs to text
    convertToText(logs) {
        return logs
            .map(log => `[${formatDate(log.timestamp)}] [${log.levelName}] ${log.message}`)
            .join('\n');
    }

    // Get log statistics
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            bySession: {},
            errors: 0,
            warnings: 0,
            timeRange: {
                start: null,
                end: null,
            },
        };

        this.logs.forEach(log => {
            // Count by level
            stats.byLevel[log.levelName] = (stats.byLevel[log.levelName] || 0) + 1;

            // Count by session
            stats.bySession[log.sessionId] = (stats.bySession[log.sessionId] || 0) + 1;

            // Count errors and warnings
            if (log.level >= LogLevel.ERROR) stats.errors++;
            if (log.level === LogLevel.WARN) stats.warnings++;

            // Track time range
            if (!stats.timeRange.start || log.timestamp < stats.timeRange.start) {
                stats.timeRange.start = log.timestamp;
            }
            if (!stats.timeRange.end || log.timestamp > stats.timeRange.end) {
                stats.timeRange.end = log.timestamp;
            }
        });

        return stats;
    }
}

// Create global logger instance
const logger = new Logger();

// Export logger instance and utilities
export { logger };

// Export default logger
export default logger; 