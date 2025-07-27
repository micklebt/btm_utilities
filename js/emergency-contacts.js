/**
 * Emergency Contacts Management System
 * Handles contact categories, quick dialing, and emergency protocols
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatPhoneNumber, validatePhone, debounce } from './utils.js';

export class EmergencyContacts {
    constructor() {
        this.contacts = [];
        this.categories = [
            { id: 'police', name: 'Police', icon: '🚔', color: '#007bff', priority: 1 },
            { id: 'fire', name: 'Fire Department', icon: '🚒', color: '#dc3545', priority: 1 },
            { id: 'ambulance', name: 'Ambulance', icon: '🚑', color: '#dc3545', priority: 1 },
            { id: 'maintenance', name: 'Maintenance', icon: '🔧', color: '#ffc107', priority: 2 },
            { id: 'security', name: 'Security', icon: '🛡️', color: '#6c757d', priority: 2 },
            { id: 'management', name: 'Management', icon: '👔', color: '#28a745', priority: 3 },
            { id: 'suppliers', name: 'Suppliers', icon: '📦', color: '#17a2b8', priority: 3 },
            { id: 'other', name: 'Other', icon: '📞', color: '#6f42c1', priority: 4 }
        ];
        
        this.emergencyProtocols = {
            fire: {
                title: 'Fire Emergency Protocol',
                steps: [
                    '1. Immediately call 911',
                    '2. Evacuate all customers and staff',
                    '3. Do not use elevators',
                    '4. Meet at designated assembly point',
                    '5. Contact management immediately'
                ],
                contacts: ['fire', 'police', 'management']
            },
            medical: {
                title: 'Medical Emergency Protocol',
                steps: [
                    '1. Call 911 immediately',
                    '2. Do not move the person if seriously injured',
                    '3. Clear the area around the person',
                    '4. Contact management',
                    '5. Document the incident'
                ],
                contacts: ['ambulance', 'police', 'management']
            },
            security: {
                title: 'Security Emergency Protocol',
                steps: [
                    '1. Call 911 if immediate danger',
                    '2. Contact security company',
                    '3. Document the incident',
                    '4. Contact management',
                    '5. Preserve any evidence'
                ],
                contacts: ['police', 'security', 'management']
            },
            maintenance: {
                title: 'Maintenance Emergency Protocol',
                steps: [
                    '1. Assess the situation',
                    '2. Contact maintenance immediately',
                    '3. Shut off affected systems if safe',
                    '4. Contact management',
                    '5. Document the issue'
                ],
                contacts: ['maintenance', 'management']
            }
        };
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Emergency Contacts module');
            
            // Load existing contacts
            await this.loadContacts();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update display
            this.updateContactsDisplay();
            
            logger.info('Emergency Contacts module initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'emergency-contacts-init'
            });
        }
    }

    async loadContacts() {
        try {
            const savedContacts = await storageUtils.contacts.load();
            this.contacts = savedContacts || [];
            logger.info(`Loaded ${this.contacts.length} emergency contacts`);
        } catch (error) {
            logger.error('Failed to load contacts', null, error);
            this.contacts = [];
        }
    }

    initializeUI() {
        const container = document.getElementById('emergency-contacts-container');
        if (!container) return;

        container.innerHTML = `
            <div class="emergency-header">
                <h2>🚨 Emergency Contacts</h2>
                <button type="button" id="add-contact-btn" class="btn btn-primary">
                    ➕ Add Contact
                </button>
            </div>

            <div class="emergency-quick-actions">
                <h3>Quick Actions</h3>
                <div class="quick-actions-grid">
                    <button type="button" class="emergency-btn police" data-protocol="fire">
                        🚔 Police (911)
                    </button>
                    <button type="button" class="emergency-btn fire" data-protocol="fire">
                        🚒 Fire (911)
                    </button>
                    <button type="button" class="emergency-btn medical" data-protocol="medical">
                        🚑 Ambulance (911)
                    </button>
                    <button type="button" class="emergency-btn security" data-protocol="security">
                        🛡️ Security
                    </button>
                </div>
            </div>

            <div class="contacts-categories">
                ${this.categories.map(category => `
                    <div class="contact-category" data-category="${category.id}">
                        <div class="category-header" style="border-left-color: ${category.color}">
                            <h3>${category.icon} ${category.name}</h3>
                            <span class="contact-count" id="count-${category.id}">0</span>
                        </div>
                        <div class="category-contacts" id="contacts-${category.id}">
                            <!-- Contacts will be populated here -->
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Add Contact Modal -->
            <div id="contact-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="contact-modal-title">Add Emergency Contact</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <form id="contact-form" class="contact-form">
                        <div class="form-section">
                            <label for="contact-name">Contact Name *</label>
                            <input type="text" id="contact-name" required 
                                   placeholder="Enter contact name...">
                        </div>
                        
                        <div class="form-section">
                            <label for="contact-phone">Phone Number *</label>
                            <input type="tel" id="contact-phone" required 
                                   placeholder="(555) 123-4567">
                        </div>
                        
                        <div class="form-section">
                            <label for="contact-category">Category *</label>
                            <select id="contact-category" required>
                                ${this.categories.map(cat => `
                                    <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-section">
                            <label for="contact-organization">Organization</label>
                            <input type="text" id="contact-organization" 
                                   placeholder="Company or organization name...">
                        </div>
                        
                        <div class="form-section">
                            <label for="contact-notes">Notes</label>
                            <textarea id="contact-notes" rows="3" 
                                      placeholder="Additional notes about this contact..."></textarea>
                        </div>
                        
                        <div class="form-section">
                            <label class="checkbox-label">
                                <input type="checkbox" id="contact-primary">
                                Primary contact for this category
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                💾 Save Contact
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-contact-btn">
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Emergency Protocol Modal -->
            <div id="protocol-modal" class="modal" style="display: none;">
                <div class="modal-content emergency-protocol">
                    <div class="modal-header">
                        <h3 id="protocol-title">Emergency Protocol</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <div class="protocol-content">
                        <div class="protocol-steps" id="protocol-steps">
                            <!-- Protocol steps will be populated here -->
                        </div>
                        
                        <div class="protocol-contacts" id="protocol-contacts">
                            <h4>Quick Contact Buttons</h4>
                            <div class="protocol-contact-buttons">
                                <!-- Contact buttons will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="call-911-btn">
                            🚨 Call 911
                        </button>
                        <button type="button" class="btn btn-secondary" id="close-protocol-btn">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Add contact button
        const addContactBtn = document.getElementById('add-contact-btn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => this.showAddContactModal());
        }

        // Emergency protocol buttons
        const emergencyBtns = document.querySelectorAll('.emergency-btn');
        emergencyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showEmergencyProtocol(e.target.dataset.protocol);
            });
        });

        // Contact modal controls
        const contactModal = document.getElementById('contact-modal');
        const contactModalClose = document.querySelector('#contact-modal .modal-close');
        const cancelContactBtn = document.getElementById('cancel-contact-btn');
        const contactForm = document.getElementById('contact-form');

        if (contactModalClose) {
            contactModalClose.addEventListener('click', () => this.hideContactModal());
        }

        if (cancelContactBtn) {
            cancelContactBtn.addEventListener('click', () => this.hideContactModal());
        }

        if (contactModal) {
            contactModal.addEventListener('click', (e) => {
                if (e.target === contactModal) {
                    this.hideContactModal();
                }
            });
        }

        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveContact();
            });
        }

        // Protocol modal controls
        const protocolModal = document.getElementById('protocol-modal');
        const protocolModalClose = document.querySelector('#protocol-modal .modal-close');
        const closeProtocolBtn = document.getElementById('close-protocol-btn');
        const call911Btn = document.getElementById('call-911-btn');

        if (protocolModalClose) {
            protocolModalClose.addEventListener('click', () => this.hideProtocolModal());
        }

        if (closeProtocolBtn) {
            closeProtocolBtn.addEventListener('click', () => this.hideProtocolModal());
        }

        if (protocolModal) {
            protocolModal.addEventListener('click', (e) => {
                if (e.target === protocolModal) {
                    this.hideProtocolModal();
                }
            });
        }

        if (call911Btn) {
            call911Btn.addEventListener('click', () => this.call911());
        }

        // Phone number validation
        const phoneInput = document.getElementById('contact-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', debounce((e) => {
                this.validatePhoneNumber(e.target.value);
            }, 300));
        }
    }

    showAddContactModal(contactId = null) {
        const modal = document.getElementById('contact-modal');
        const modalTitle = document.getElementById('contact-modal-title');
        const contactForm = document.getElementById('contact-form');

        if (contactId) {
            // Edit existing contact
            const contact = this.contacts.find(c => c.id === contactId);
            if (contact) {
                this.populateContactForm(contact);
                modalTitle.textContent = 'Edit Emergency Contact';
                contactForm.dataset.contactId = contactId;
            }
        } else {
            // Add new contact
            this.clearContactForm();
            modalTitle.textContent = 'Add Emergency Contact';
            delete contactForm.dataset.contactId;
        }

        modal.style.display = 'block';
    }

    hideContactModal() {
        const modal = document.getElementById('contact-modal');
        modal.style.display = 'none';
        this.clearContactForm();
    }

    clearContactForm() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.reset();
            delete form.dataset.contactId;
        }
    }

    populateContactForm(contact) {
        const nameInput = document.getElementById('contact-name');
        const phoneInput = document.getElementById('contact-phone');
        const categorySelect = document.getElementById('contact-category');
        const orgInput = document.getElementById('contact-organization');
        const notesInput = document.getElementById('contact-notes');
        const primaryCheckbox = document.getElementById('contact-primary');

        if (nameInput) nameInput.value = contact.name;
        if (phoneInput) phoneInput.value = contact.phone;
        if (categorySelect) categorySelect.value = contact.category;
        if (orgInput) orgInput.value = contact.organization || '';
        if (notesInput) notesInput.value = contact.notes || '';
        if (primaryCheckbox) primaryCheckbox.checked = contact.primary || false;
    }

    validatePhoneNumber(phone) {
        const phoneInput = document.getElementById('contact-phone');
        const isValid = validatePhone(phone);
        
        if (isValid) {
            phoneInput.classList.remove('error');
            phoneInput.setCustomValidity('');
        } else {
            phoneInput.classList.add('error');
            phoneInput.setCustomValidity('Please enter a valid phone number');
        }
    }

    async saveContact() {
        try {
            const form = document.getElementById('contact-form');
            const contactId = form.dataset.contactId;

            const contactData = {
                name: document.getElementById('contact-name').value.trim(),
                phone: document.getElementById('contact-phone').value.trim(),
                category: document.getElementById('contact-category').value,
                organization: document.getElementById('contact-organization').value.trim(),
                notes: document.getElementById('contact-notes').value.trim(),
                primary: document.getElementById('contact-primary').checked,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Validate required fields
            if (!contactData.name || !contactData.phone) {
                this.showNotification('Name and phone number are required', 'error');
                return;
            }

            if (!validatePhone(contactData.phone)) {
                this.showNotification('Please enter a valid phone number', 'error');
                return;
            }

            // If this is a primary contact, unset other primary contacts in the same category
            if (contactData.primary) {
                this.contacts.forEach(contact => {
                    if (contact.category === contactData.category && contact.id !== contactId) {
                        contact.primary = false;
                    }
                });
            }

            if (contactId) {
                // Update existing contact
                const contactIndex = this.contacts.findIndex(c => c.id === contactId);
                if (contactIndex !== -1) {
                    this.contacts[contactIndex] = { ...this.contacts[contactIndex], ...contactData };
                    logger.info('Contact updated', { contactId, contactData });
                }
            } else {
                // Create new contact
                const newContact = {
                    id: generateId('contact'),
                    ...contactData
                };
                this.contacts.push(newContact);
                logger.info('Contact created', newContact);
            }

            // Save to storage
            await storageUtils.contacts.save(this.contacts);

            // Update display
            this.updateContactsDisplay();

            // Hide modal
            this.hideContactModal();

            // Show success notification
            const action = contactId ? 'updated' : 'created';
            this.showNotification(`Contact ${action} successfully`, 'success');

        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'save-contact'
            });
            
            this.showNotification('Failed to save contact', 'error');
        }
    }

    async deleteContact(contactId) {
        try {
            if (!confirm('Are you sure you want to delete this contact?')) {
                return;
            }

            this.contacts = this.contacts.filter(c => c.id !== contactId);

            // Save to storage
            await storageUtils.contacts.save(this.contacts);

            // Update display
            this.updateContactsDisplay();

            // Show notification
            this.showNotification('Contact deleted', 'success');

            logger.info('Contact deleted', { contactId });

        } catch (error) {
            logger.error('Error deleting contact', null, error);
        }
    }

    updateContactsDisplay() {
        // Group contacts by category
        const contactsByCategory = {};
        this.categories.forEach(category => {
            contactsByCategory[category.id] = this.contacts.filter(c => c.category === category.id);
        });

        // Update each category
        this.categories.forEach(category => {
            const countElement = document.getElementById(`count-${category.id}`);
            const contactsContainer = document.getElementById(`contacts-${category.id}`);
            
            const categoryContacts = contactsByCategory[category.id];
            
            // Update count
            if (countElement) {
                countElement.textContent = categoryContacts.length;
            }

            // Update contacts list
            if (contactsContainer) {
                if (categoryContacts.length === 0) {
                    contactsContainer.innerHTML = `
                        <div class="no-contacts">
                            <p>No contacts in this category</p>
                            <button type="button" class="btn btn-sm btn-primary" 
                                    onclick="window.emergencyContacts.showAddContactModal()">
                                ➕ Add Contact
                            </button>
                        </div>
                    `;
                } else {
                    contactsContainer.innerHTML = categoryContacts
                        .sort((a, b) => {
                            // Primary contacts first
                            if (a.primary && !b.primary) return -1;
                            if (!a.primary && b.primary) return 1;
                            // Then by name
                            return a.name.localeCompare(b.name);
                        })
                        .map(contact => this.renderContact(contact))
                        .join('');
                }
            }
        });

        // Set up contact event listeners
        this.setupContactEventListeners();
    }

    renderContact(contact) {
        const category = this.categories.find(c => c.id === contact.category);
        const formattedPhone = formatPhoneNumber(contact.phone);

        return `
            <div class="contact-item ${contact.primary ? 'primary' : ''}" data-contact-id="${contact.id}">
                <div class="contact-info">
                    <div class="contact-name">
                        ${contact.name}
                        ${contact.primary ? '<span class="primary-badge">Primary</span>' : ''}
                    </div>
                    
                    <div class="contact-phone">
                        <a href="tel:${contact.phone}" class="phone-link">
                            📞 ${formattedPhone}
                        </a>
                    </div>
                    
                    ${contact.organization ? `
                        <div class="contact-organization">🏢 ${contact.organization}</div>
                    ` : ''}
                    
                    ${contact.notes ? `
                        <div class="contact-notes">📝 ${contact.notes}</div>
                    ` : ''}
                </div>
                
                <div class="contact-actions">
                    <button type="button" class="btn btn-icon call-btn" 
                            data-phone="${contact.phone}" title="Call Contact">
                        📞
                    </button>
                    <button type="button" class="btn btn-icon edit-contact-btn" 
                            data-contact-id="${contact.id}" title="Edit Contact">
                        ✏️
                    </button>
                    <button type="button" class="btn btn-icon delete-contact-btn" 
                            data-contact-id="${contact.id}" title="Delete Contact">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    setupContactEventListeners() {
        // Call buttons
        const callButtons = document.querySelectorAll('.call-btn');
        callButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.callContact(e.target.dataset.phone);
            });
        });

        // Edit buttons
        const editButtons = document.querySelectorAll('.edit-contact-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showAddContactModal(e.target.dataset.contactId);
            });
        });

        // Delete buttons
        const deleteButtons = document.querySelectorAll('.delete-contact-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteContact(e.target.dataset.contactId);
            });
        });
    }

    showEmergencyProtocol(protocolType) {
        const protocol = this.emergencyProtocols[protocolType];
        if (!protocol) return;

        const modal = document.getElementById('protocol-modal');
        const title = document.getElementById('protocol-title');
        const steps = document.getElementById('protocol-steps');
        const contacts = document.getElementById('protocol-contacts');

        title.textContent = protocol.title;
        
        steps.innerHTML = `
            <h4>Emergency Steps:</h4>
            <ol class="protocol-steps-list">
                ${protocol.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        `;

        // Get contacts for this protocol
        const protocolContacts = this.contacts.filter(contact => 
            protocol.contacts.includes(contact.category)
        );

        contacts.innerHTML = `
            <h4>Quick Contact Buttons</h4>
            <div class="protocol-contact-buttons">
                ${protocolContacts.map(contact => `
                    <button type="button" class="btn btn-contact" 
                            data-phone="${contact.phone}">
                        📞 ${contact.name}
                    </button>
                `).join('')}
            </div>
        `;

        // Set up contact button listeners
        const contactButtons = contacts.querySelectorAll('.btn-contact');
        contactButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.callContact(e.target.dataset.phone);
            });
        });

        modal.style.display = 'block';
    }

    hideProtocolModal() {
        const modal = document.getElementById('protocol-modal');
        modal.style.display = 'none';
    }

    callContact(phone) {
        try {
            // Remove any non-digit characters
            const cleanPhone = phone.replace(/\D/g, '');
            
            // Create tel: link
            const telLink = `tel:${cleanPhone}`;
            
            // Open phone app or initiate call
            window.location.href = telLink;
            
            logger.info('Initiating call', { phone, cleanPhone });
        } catch (error) {
            logger.error('Error initiating call', null, error);
            this.showNotification('Unable to initiate call', 'error');
        }
    }

    call911() {
        try {
            // Call 911
            window.location.href = 'tel:911';
            
            logger.info('Initiating 911 call');
        } catch (error) {
            logger.error('Error calling 911', null, error);
            this.showNotification('Unable to call 911', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }

    // Public methods for external access
    getContacts() {
        return this.contacts;
    }

    getContactsByCategory(categoryId) {
        return this.contacts.filter(c => c.category === categoryId);
    }

    getPrimaryContact(categoryId) {
        return this.contacts.find(c => c.category === categoryId && c.primary);
    }

    async exportContacts(format = 'json') {
        try {
            const data = {
                contacts: this.contacts,
                categories: this.categories,
                summary: {
                    total: this.contacts.length,
                    byCategory: this.categories.map(cat => ({
                        category: cat.name,
                        count: this.getContactsByCategory(cat.id).length
                    })),
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data.contacts);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting contacts', null, error);
            throw error;
        }
    }

    convertToCSV(contacts) {
        const headers = ['Name', 'Phone', 'Category', 'Organization', 'Notes', 'Primary', 'Created At'];
        const rows = contacts.map(c => [
            c.name,
            c.phone,
            c.category,
            c.organization || '',
            c.notes || '',
            c.primary ? 'Yes' : 'No',
            c.createdAt
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.emergencyContacts = new EmergencyContacts();
    });
} else {
    window.emergencyContacts = new EmergencyContacts();
}

export default window.emergencyContacts; 