/**
 * Shared Menu Component
 * This file provides a consistent navigation menu across all pages
 */

export function initializeSharedMenu() {
    // Get the current page path
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    // Create the menu container
    const navContainer = document.querySelector('.nav-container');
    
    if (!navContainer) {
        console.error('Navigation container not found!');
        return;
    }
    
    // Define all menu items with their paths and icons
    const menuItems = [
        { 
            section: 'money-collection', 
            label: 'Money Collection', 
            icon: '💰', 
            path: 'index.html',
            active: currentPath === 'index.html' && !window.location.hash.includes('contacts') && 
                   !window.location.hash.includes('security') && !window.location.hash.includes('climate') && 
                   !window.location.hash.includes('todo') && !window.location.hash.includes('links')
        },
        { 
            section: 'contacts', 
            label: 'Contacts', 
            icon: '📞', 
            path: 'index.html#contacts',
            active: window.location.hash.includes('contacts')
        },
        { 
            section: 'security', 
            label: 'Security', 
            icon: '📹', 
            path: 'index.html#security',
            active: window.location.hash.includes('security')
        },
        { 
            section: 'climate', 
            label: 'Climate', 
            icon: '🌡️', 
            path: 'index.html#climate',
            active: window.location.hash.includes('climate')
        },
        { 
            section: 'todo', 
            label: 'To Do', 
            icon: '📋', 
            path: 'index.html#todo',
            active: window.location.hash.includes('todo')
        },
        { 
            section: 'links', 
            label: 'Links', 
            icon: '🔗', 
            path: 'index.html#links',
            active: window.location.hash.includes('links')
        }

    ];
    
    // Clear existing menu items
    navContainer.innerHTML = '';
    
    // Add menu items to the container
    menuItems.forEach(item => {
        const button = document.createElement('button');
        button.className = `nav-item ${item.active ? 'active' : ''}`;
        button.dataset.section = item.section;
        button.dataset.path = item.path;
        
        button.innerHTML = `
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
        `;
        
        // Add click event
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // If it's the same page with a different section, use the navigation function
            if (item.path === currentPath && window.btmUtility && typeof window.btmUtility.navigateToSection === 'function') {
                window.btmUtility.navigateToSection(item.section);
                
                // Update URL hash without reloading
                if (!item.path.includes('#')) {
                    window.history.pushState(null, '', `#${item.section}`);
                }
            } else {
                // Navigate to a different page
                window.location.href = item.path;
            }
            
            // Close mobile menu if open
            if (window.btmUtility && typeof window.btmUtility.hideMobileMenu === 'function') {
                window.btmUtility.hideMobileMenu();
            } else {
                const mainNav = document.getElementById('main-nav');
                if (mainNav && mainNav.classList.contains('show')) {
                    mainNav.classList.remove('show');
                }
            }
        });
        
        navContainer.appendChild(button);
    });
    
    return navContainer;
}

// Initialize the menu when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSharedMenu);
} else {
    initializeSharedMenu();
}

export default { initializeSharedMenu };