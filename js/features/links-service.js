/**
 * Links Service
 * Manages links functionality
 */

import { logger } from '../utils/logger.js';
import { apiService } from '../api/api-service.js';
import { errorHandler } from '../utils/error-handler.js';

/**
 * Link object
 * @typedef {Object} Link
 * @property {string} id - Link ID
 * @property {string} title - Link title
 * @property {string} url - Link URL
 * @property {string} description - Link description
 * @property {string} category - Link category
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Update timestamp
 */

/**
 * Links service class
 * @class
 */
class LinksService {
    /**
     * Create a new LinksService instance
     */
    constructor() {
        this.links = [];
        this.baseUrl = 'http://localhost:3001';
        this.listeners = new Set();
    }
    
    /**
     * Initialize links service
     * @returns {Promise<void>}
     */
    async init() {
        logger.info('Initializing links service');
        
        try {
            // Load links
            await this.loadLinks();
        } catch (error) {
            logger.error('Failed to initialize links service', error);
            throw error;
        }
    }
    
    /**
     * Load links from API
     * @returns {Promise<Link[]>} Links array
     */
    async loadLinks() {
        try {
            logger.debug('Loading links');
            
            // Fetch links from API
            const response = await fetch(`${this.baseUrl}/api/links`);
            
            if (!response.ok) {
                throw new Error(`Failed to load links: ${response.status} ${response.statusText}`);
            }
            
            this.links = await response.json();
            
            logger.debug(`Loaded ${this.links.length} links`);
            
            // Notify listeners
            this.notifyListeners();
            
            return this.links;
        } catch (error) {
            logger.error('Error loading links', error);
            throw errorHandler.createApiError('Failed to load links', error);
        }
    }
    
    /**
     * Get all links
     * @returns {Link[]} Links array
     */
    getLinks() {
        return [...this.links];
    }
    
    /**
     * Get link by ID
     * @param {string} id - Link ID
     * @returns {Link|null} Link object or null if not found
     */
    getLinkById(id) {
        return this.links.find(link => link.id === id) || null;
    }
    
    /**
     * Add a new link
     * @param {Object} linkData - Link data
     * @returns {Promise<Link>} Added link
     */
    async addLink(linkData) {
        try {
            logger.debug('Adding link', linkData);
            
            // Validate link data
            this.validateLinkData(linkData);
            
            // Add timestamps
            const now = new Date().toISOString();
            const newLink = {
                ...linkData,
                createdAt: now,
                updatedAt: now,
            };
            
            // Send to API
            const response = await fetch(`${this.baseUrl}/api/links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newLink),
            });
            
            if (!response.ok) {
                throw new Error(`Failed to add link: ${response.status} ${response.statusText}`);
            }
            
            const addedLink = await response.json();
            
            // Update local cache
            this.links.push(addedLink);
            
            // Notify listeners
            this.notifyListeners();
            
            logger.debug('Link added', addedLink);
            
            return addedLink;
        } catch (error) {
            logger.error('Error adding link', error);
            throw errorHandler.createApiError('Failed to add link', error);
        }
    }
    
    /**
     * Update an existing link
     * @param {string} id - Link ID
     * @param {Object} linkData - Link data
     * @returns {Promise<Link>} Updated link
     */
    async updateLink(id, linkData) {
        try {
            logger.debug(`Updating link ${id}`, linkData);
            
            // Check if link exists
            const existingLink = this.getLinkById(id);
            if (!existingLink) {
                throw new Error(`Link with ID ${id} not found`);
            }
            
            // Validate link data
            this.validateLinkData(linkData);
            
            // Update timestamp
            const updatedLink = {
                ...existingLink,
                ...linkData,
                id, // Ensure ID doesn't change
                updatedAt: new Date().toISOString(),
            };
            
            // Send to API
            const response = await fetch(`${this.baseUrl}/api/links/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedLink),
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update link: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update local cache
            const index = this.links.findIndex(link => link.id === id);
            if (index !== -1) {
                this.links[index] = result;
            }
            
            // Notify listeners
            this.notifyListeners();
            
            logger.debug('Link updated', result);
            
            return result;
        } catch (error) {
            logger.error(`Error updating link ${id}`, error);
            throw errorHandler.createApiError('Failed to update link', error);
        }
    }
    
    /**
     * Delete a link
     * @param {string} id - Link ID
     * @returns {Promise<boolean>} Success flag
     */
    async deleteLink(id) {
        try {
            logger.debug(`Deleting link ${id}`);
            
            // Check if link exists
            const existingLink = this.getLinkById(id);
            if (!existingLink) {
                throw new Error(`Link with ID ${id} not found`);
            }
            
            // Send to API
            const response = await fetch(`${this.baseUrl}/api/links/${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete link: ${response.status} ${response.statusText}`);
            }
            
            // Update local cache
            this.links = this.links.filter(link => link.id !== id);
            
            // Notify listeners
            this.notifyListeners();
            
            logger.debug(`Link ${id} deleted`);
            
            return true;
        } catch (error) {
            logger.error(`Error deleting link ${id}`, error);
            throw errorHandler.createApiError('Failed to delete link', error);
        }
    }
    
    /**
     * Search links
     * @param {string} query - Search query
     * @returns {Link[]} Matching links
     */
    searchLinks(query) {
        if (!query) {
            return this.getLinks();
        }
        
        const normalizedQuery = query.toLowerCase();
        
        return this.links.filter(link => {
            return (
                link.title.toLowerCase().includes(normalizedQuery) ||
                link.url.toLowerCase().includes(normalizedQuery) ||
                link.description.toLowerCase().includes(normalizedQuery) ||
                link.category.toLowerCase().includes(normalizedQuery)
            );
        });
    }
    
    /**
     * Filter links by category
     * @param {string} category - Category name
     * @returns {Link[]} Matching links
     */
    filterByCategory(category) {
        if (!category) {
            return this.getLinks();
        }
        
        return this.links.filter(link => link.category === category);
    }
    
    /**
     * Get all unique categories
     * @returns {string[]} Array of categories
     */
    getCategories() {
        const categories = new Set();
        
        this.links.forEach(link => {
            if (link.category) {
                categories.add(link.category);
            }
        });
        
        return [...categories].sort();
    }
    
    /**
     * Validate link data
     * @param {Object} linkData - Link data
     * @throws {Error} Validation error
     * @private
     */
    validateLinkData(linkData) {
        const { title, url } = linkData;
        
        if (!title || typeof title !== 'string' || title.trim() === '') {
            throw errorHandler.createValidationError('Title is required');
        }
        
        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw errorHandler.createValidationError('URL is required');
        }
        
        try {
            new URL(url);
        } catch (error) {
            throw errorHandler.createValidationError('Invalid URL format');
        }
    }
    
    /**
     * Add a listener for link changes
     * @param {Function} listener - Listener function
     * @returns {Function} Function to remove listener
     */
    addListener(listener) {
        this.listeners.add(listener);
        
        // Return function to remove listener
        return () => {
            this.listeners.delete(listener);
        };
    }
    
    /**
     * Notify listeners of link changes
     * @private
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.links);
            } catch (error) {
                logger.error('Error in links listener', error);
            }
        });
    }
}

// Export singleton instance
export const linksService = new LinksService(); 