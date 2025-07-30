/**
 * API Service Module
 * Handles API requests for the BTM Utility application
 */

import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { errorHandler, ErrorType } from '../utils/error-handler.js';

/**
 * API request options
 * @typedef {Object} ApiOptions
 * @property {string} [method='GET'] - HTTP method
 * @property {Object} [headers] - Request headers
 * @property {Object|FormData} [body] - Request body
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {boolean} [cache=false] - Whether to cache the response
 * @property {boolean} [credentials=true] - Whether to include credentials
 */

/**
 * API service class
 * @class
 */
class ApiService {
    /**
     * Create a new ApiService instance
     */
    constructor() {
        this.baseUrl = config.api.baseUrl;
        this.defaultTimeout = config.api.timeout;
        this.retries = config.api.retries;
        this.cache = new Map();
    }
    
    /**
     * Make an API request
     * @param {string} endpoint - API endpoint
     * @param {ApiOptions} [options={}] - Request options
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, options = {}) {
        const url = this._getUrl(endpoint);
        const method = options.method || 'GET';
        const cacheKey = this._getCacheKey(url, method, options.body);
        
        // Check cache
        if (options.cache && method === 'GET' && this.cache.has(cacheKey)) {
            logger.debug(`Using cached response for ${url}`);
            return this.cache.get(cacheKey);
        }
        
        // Set up request options
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
            credentials: options.credentials !== false ? 'include' : 'omit',
        };
        
        // Add body for non-GET requests
        if (method !== 'GET' && options.body) {
            fetchOptions.body = options.body instanceof FormData
                ? options.body
                : JSON.stringify(options.body);
                
            // Remove Content-Type for FormData
            if (options.body instanceof FormData) {
                delete fetchOptions.headers['Content-Type'];
            }
        }
        
        // Make request with retries
        let lastError;
        for (let attempt = 0; attempt <= this.retries; attempt++) {
            try {
                const response = await this._fetchWithTimeout(url, fetchOptions, options.timeout);
                
                // Handle response
                const data = await this._handleResponse(response);
                
                // Cache successful GET responses
                if (options.cache && method === 'GET') {
                    this.cache.set(cacheKey, data);
                }
                
                return data;
            } catch (error) {
                lastError = error;
                
                // Don't retry client errors
                if (error.status >= 400 && error.status < 500) {
                    break;
                }
                
                // Last attempt
                if (attempt === this.retries) {
                    break;
                }
                
                // Wait before retrying
                const delay = this._getRetryDelay(attempt);
                logger.warn(`Retrying request to ${url} in ${delay}ms (attempt ${attempt + 1}/${this.retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // All retries failed
        throw lastError;
    }
    
    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @param {ApiOptions} [options={}] - Request options
     * @returns {Promise<Object>} Response data
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }
    
    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object|FormData} body - Request body
     * @param {ApiOptions} [options={}] - Request options
     * @returns {Promise<Object>} Response data
     */
    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }
    
    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object|FormData} body - Request body
     * @param {ApiOptions} [options={}] - Request options
     * @returns {Promise<Object>} Response data
     */
    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }
    
    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @param {ApiOptions} [options={}] - Request options
     * @returns {Promise<Object>} Response data
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
    
    /**
     * Fetch with timeout
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {number} [timeout] - Timeout in milliseconds
     * @returns {Promise<Response>} Fetch response
     * @private
     */
    async _fetchWithTimeout(url, options, timeout = this.defaultTimeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw errorHandler.createNetworkError(`Request to ${url} timed out after ${timeout}ms`);
            }
            
            throw errorHandler.createNetworkError(`Network error: ${error.message}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }
    
    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise<Object>} Response data
     * @private
     */
    async _handleResponse(response) {
        // Check if response is OK
        if (!response.ok) {
            const errorData = await this._parseResponseData(response);
            const errorMessage = errorData?.message || `API error: ${response.status} ${response.statusText}`;
            
            const error = errorHandler.createApiError(errorMessage, {
                status: response.status,
                statusText: response.statusText,
                data: errorData,
            });
            
            throw error;
        }
        
        // Parse response data
        return this._parseResponseData(response);
    }
    
    /**
     * Parse response data
     * @param {Response} response - Fetch response
     * @returns {Promise<Object>} Parsed data
     * @private
     */
    async _parseResponseData(response) {
        const contentType = response.headers.get('Content-Type') || '';
        
        if (contentType.includes('application/json')) {
            try {
                return await response.json();
            } catch (error) {
                logger.error('Error parsing JSON response', error);
                throw errorHandler.createApiError('Invalid JSON response');
            }
        }
        
        if (contentType.includes('text/')) {
            return { text: await response.text() };
        }
        
        return { raw: await response.blob() };
    }
    
    /**
     * Get full URL for endpoint
     * @param {string} endpoint - API endpoint
     * @returns {string} Full URL
     * @private
     */
    _getUrl(endpoint) {
        // If endpoint is already a full URL, return it
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        
        // Remove leading slash from endpoint if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        
        // Add trailing slash to baseUrl if needed
        const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
        
        return `${baseUrl}${cleanEndpoint}`;
    }
    
    /**
     * Get cache key for request
     * @param {string} url - Request URL
     * @param {string} method - HTTP method
     * @param {Object} [body] - Request body
     * @returns {string} Cache key
     * @private
     */
    _getCacheKey(url, method, body) {
        return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
    }
    
    /**
     * Get retry delay with exponential backoff
     * @param {number} attempt - Retry attempt (0-based)
     * @returns {number} Delay in milliseconds
     * @private
     */
    _getRetryDelay(attempt) {
        // Exponential backoff with jitter
        const baseDelay = 300;
        const maxDelay = 5000;
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
        
        // Add jitter (±20%)
        const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
        
        return Math.floor(exponentialDelay + jitter);
    }
    
    /**
     * Clear the response cache
     */
    clearCache() {
        this.cache.clear();
        logger.debug('API response cache cleared');
    }
}

// Export singleton instance
export const apiService = new ApiService(); 