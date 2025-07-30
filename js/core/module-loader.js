/**
 * Module Loader
 * Handles dynamic loading of application modules
 */

import { logger } from '../utils/logger.js';

/**
 * Module loader class
 * @class
 */
export class ModuleLoader {
    /**
     * Create a new ModuleLoader instance
     */
    constructor() {
        this.modules = new Map();
        this.loadedModules = new Set();
    }
    
    /**
     * Register a module
     * @param {string} name - Module name
     * @param {Object} module - Module instance
     */
    register(name, module) {
        if (this.modules.has(name)) {
            logger.warn(`Module '${name}' is already registered`);
            return;
        }
        
        this.modules.set(name, {
            instance: module,
            initialized: false,
            dependencies: module.dependencies || []
        });
        
        logger.info(`Module '${name}' registered`);
    }
    
    /**
     * Load a module
     * @param {string} name - Module name
     * @returns {Promise<Object>} Module instance
     */
    async load(name) {
        if (!this.modules.has(name)) {
            throw new Error(`Module '${name}' not found`);
        }
        
        if (this.loadedModules.has(name)) {
            return this.modules.get(name).instance;
        }
        
        const module = this.modules.get(name);
        
        // Load dependencies first
        for (const dependency of module.dependencies) {
            await this.load(dependency);
        }
        
        // Initialize module if it has an init method
        if (typeof module.instance.init === 'function' && !module.initialized) {
            logger.info(`Initializing module '${name}'`);
            await module.instance.init();
            module.initialized = true;
        }
        
        this.loadedModules.add(name);
        return module.instance;
    }
    
    /**
     * Load multiple modules
     * @param {string[]} names - Module names
     * @returns {Promise<Object[]>} Module instances
     */
    async loadMultiple(names) {
        const modules = [];
        for (const name of names) {
            const module = await this.load(name);
            modules.push(module);
        }
        return modules;
    }
    
    /**
     * Load all registered modules
     * @returns {Promise<Map<string, Object>>} Loaded modules
     */
    async loadAll() {
        for (const [name] of this.modules) {
            await this.load(name);
        }
        
        return this.modules;
    }
    
    /**
     * Get a loaded module
     * @param {string} name - Module name
     * @returns {Object|null} Module instance or null if not loaded
     */
    get(name) {
        if (!this.modules.has(name) || !this.loadedModules.has(name)) {
            return null;
        }
        
        return this.modules.get(name).instance;
    }
    
    /**
     * Check if a module is loaded
     * @param {string} name - Module name
     * @returns {boolean} True if loaded
     */
    isLoaded(name) {
        return this.loadedModules.has(name);
    }
    
    /**
     * Dynamically import a module
     * @param {string} path - Module path
     * @returns {Promise<Object>} Imported module
     */
    async importModule(path) {
        try {
            logger.info(`Importing module from '${path}'`);
            const module = await import(path);
            return module;
        } catch (error) {
            logger.error(`Failed to import module from '${path}'`, error);
            throw error;
        }
    }
} 