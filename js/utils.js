/**
 * Utilities Module
 * Common helper functions for BTM Utility
 */

import { config } from './config.js?v=1.0.2';

// Debounce function for performance optimization
export function debounce(func, delay = config.performance.debounceDelay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Throttle function for rate limiting
export function throttle(func, delay = config.performance.throttleDelay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

// Deep clone object
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Generate unique ID
export function generateId(prefix = 'btm') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${randomStr}`;
}

// Format currency
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch (error) {
        console.warn('Currency formatting error:', error);
        return `$${parseFloat(amount).toFixed(2)}`;
    }
}

// Format date
export function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    
    try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date');
        }
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'Invalid Date';
    }
}

// Validate email format
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number format
export function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
}

// Format phone number for display
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
        // US format: (XXX) XXX-XXXX
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        // US format with country code: 1 (XXX) XXX-XXXX
        return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 7) {
        // Local format: XXX-XXXX
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
        // Return as-is if no standard format matches
        return phone;
    }
}

// Sanitize HTML input
export function sanitizeHtml(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Escape HTML entities
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Check if device is mobile
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if device supports touch
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Check if browser supports specific feature
export function supportsFeature(feature) {
    const supportMap = {
        'localStorage': () => {
            try {
                const test = 'test';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
        'sessionStorage': () => {
            try {
                const test = 'test';
                sessionStorage.setItem(test, test);
                sessionStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
        'serviceWorker': () => 'serviceWorker' in navigator,
        'pushNotifications': () => 'PushManager' in window,
        'geolocation': () => 'geolocation' in navigator,
        'camera': () => 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        'webGL': () => {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        },
        'webWorkers': () => typeof Worker !== 'undefined',
        'fetch': () => 'fetch' in window,
        'promises': () => typeof Promise !== 'undefined',
        'asyncAwait': () => {
            try {
                new Function('async () => {}');
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    return supportMap[feature] ? supportMap[feature]() : false;
}

// Get device pixel ratio
export function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
}

// Get viewport dimensions
export function getViewportDimensions() {
    return {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
}

// Check if element is in viewport
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewport = getViewportDimensions();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= viewport.height &&
        rect.right <= viewport.width
    );
}

// Sleep function for async operations
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function with exponential backoff
export async function retry(fn, maxAttempts = config.app.retryAttempts, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await sleep(delay * Math.pow(2, attempt - 1));
        }
    }
}

// Generate random string
export function randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Check if object is empty
export function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
}

// Merge objects deeply
export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

// Check if value is an object
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// Parse query string
export function parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Build query string
export function buildQueryString(params) {
    return new URLSearchParams(params).toString();
}

// Get file extension
export function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Copy text to clipboard
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        return false;
    }
}

// Download file
export function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Audio utilities
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            // AudioContext creation failed, return null
            return null;
        }
    }
    return audioContext;
}

export function playBeep(frequency = 800, duration = 200, volume = 0.3) {
    try {
        // Get or create audio context
        const ctx = getAudioContext();
        
        if (!ctx) {
            // AudioContext not available, use fallback
            playBeepFallback(volume);
            return;
        }
        
        // Resume audio context if suspended (required for autoplay policies)
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                playBeepInternal(ctx, frequency, duration, volume);
            }).catch(() => {
                // Fallback to HTML5 audio if AudioContext fails
                playBeepFallback(volume);
            });
        } else {
            playBeepInternal(ctx, frequency, duration, volume);
        }
    } catch (error) {
        // Fallback to HTML5 audio
        playBeepFallback(volume);
    }
}

function playBeepInternal(audioContext, frequency, duration, volume) {
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Configure gain (volume)
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play beep
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

function playBeepFallback(volume) {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = volume;
        audio.play().catch(() => {
            // Silent fallback if audio fails
        });
    } catch (fallbackError) {
        // Silent fallback if all audio methods fail
    }
}

export function playSuccessBeep() {
    playBeep(1000, 150, 0.3); // Higher pitch, shorter duration
}

export function playErrorBeep() {
    playBeep(400, 300, 0.3); // Lower pitch, longer duration
}

export function playNotificationBeep() {
    playBeep(800, 200, 0.3); // Standard notification beep
}

// Export default utilities
export default {
    debounce,
    throttle,
    deepClone,
    generateId,
    formatCurrency,
    formatDate,
    validateEmail,
    validatePhone,
    sanitizeHtml,
    escapeHtml,
    isMobile,
    isTouchDevice,
    supportsFeature,
    getDevicePixelRatio,
    getViewportDimensions,
    isInViewport,
    sleep,
    retry,
    randomString,
    isEmpty,
    mergeDeep,
    parseQueryString,
    buildQueryString,
    getFileExtension,
    formatFileSize,
    copyToClipboard,
    downloadFile,
}; 