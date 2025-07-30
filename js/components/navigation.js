/**
 * Navigation Component
 * Handles application navigation and section switching
 */

import { logger } from '../utils/logger.js';

/**
 * Navigation component class
 * @class
 */
export class Navigation {
    /**
     * Create a new Navigation instance
     * @param {Object} options - Navigation options
     * @param {Function} options.onSectionChange - Callback when section changes
     */
    constructor(options = {}) {
        this.currentSection = null;
        this.onSectionChange = options.onSectionChange || (() => {});
        this.mobileMenuOpen = false;
    }
    
    /**
     * Initialize navigation
     */
    init() {
        logger.info('Initializing navigation');
        this.setupNavigationListeners();
        this.setupMobileMenu();
        this.setupHomeButton();
    }
    
    /**
     * Setup navigation listeners
     * @private
     */
    setupNavigationListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.getAttribute('data-section');
                this.navigateToSection(targetSection);
            });
        });
        
        logger.debug('Navigation listeners set up');
    }
    
    /**
     * Setup mobile menu
     * @private
     */
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (event) => {
                const mainNav = document.getElementById('main-nav');
                const isClickInsideNav = mainNav && mainNav.contains(event.target);
                const isClickOnToggle = mobileMenuToggle.contains(event.target);
                
                if (this.mobileMenuOpen && !isClickInsideNav && !isClickOnToggle) {
                    this.hideMobileMenu();
                }
            });
            
            logger.debug('Mobile menu set up');
        }
    }
    
    /**
     * Setup home button
     * @private
     */
    setupHomeButton() {
        const homeButton = document.getElementById('home-button');
        
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                this.goHome();
            });
            
            logger.debug('Home button set up');
        }
    }
    
    /**
     * Navigate to section
     * @param {string} sectionName - Section name
     */
    navigateToSection(sectionName) {
        if (this.currentSection === sectionName) {
            return;
        }
        
        logger.info(`Navigating to section: ${sectionName}`);
        
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(nav => {
            const isActive = nav.getAttribute('data-section') === sectionName;
            nav.classList.toggle('active', isActive);
        });
        
        // Update active section
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            const isActive = section.id === sectionName;
            section.classList.toggle('active', isActive);
        });
        
        // Close mobile menu if open
        if (this.mobileMenuOpen) {
            this.hideMobileMenu();
        }
        
        // Update current section
        this.currentSection = sectionName;
        
        // Call section change callback
        this.onSectionChange(sectionName);
        
        // Update URL hash
        window.location.hash = sectionName;
    }
    
    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.mobileMenuOpen) {
            this.hideMobileMenu();
        } else {
            this.showMobileMenu();
        }
    }
    
    /**
     * Show mobile menu
     */
    showMobileMenu() {
        const mainNav = document.getElementById('main-nav');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (mainNav && mobileMenuToggle) {
            mainNav.classList.add('show');
            mobileMenuToggle.classList.add('active');
            this.mobileMenuOpen = true;
            logger.debug('Mobile menu shown');
        }
    }
    
    /**
     * Hide mobile menu
     */
    hideMobileMenu() {
        const mainNav = document.getElementById('main-nav');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (mainNav && mobileMenuToggle) {
            mainNav.classList.remove('show');
            mobileMenuToggle.classList.remove('active');
            this.mobileMenuOpen = false;
            logger.debug('Mobile menu hidden');
        }
    }
    
    /**
     * Go to home page
     */
    goHome() {
        logger.info('Going to home page');
        
        // Navigate to default section
        this.navigateToSection('money-collection');
        
        // Reload the page if needed
        // window.location.reload();
    }
} 