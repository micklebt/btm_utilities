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
        // Ensure we have a valid base URL that works with both localhost and 127.0.0.1
        this.baseUrl = `${window.location.protocol}//${window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:3001`;
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

    async loadContacts(retryCount = 0) {
        try {
            // Maximum number of retries
            const MAX_RETRIES = 3;
            
            // Try to load from API first
            try {
                const response = await fetch(`${this.baseUrl}/api/contacts`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.contacts)) {
                        this.contacts = data.contacts;
                        logger.info(`Loaded ${this.contacts.length} emergency contacts from API`);
                        
                        // Cache contacts in local storage for offline use
                        try {
                            await storageUtils.contacts.save(this.contacts);
                            logger.info('Cached contacts to local storage');
                        } catch (cacheError) {
                            logger.warn('Failed to cache contacts', null, cacheError);
                        }
                        
                        // Clear any error notifications
                        const errorNotification = document.querySelector('.notification.error');
                        if (errorNotification) {
                            errorNotification.remove();
                        }
                        
                        return;
                    }
                }
                
                // If we get here, the response wasn't successful
                throw new Error('API response was not successful');
                
            } catch (apiError) {
                logger.warn('Failed to load contacts from API', null, apiError);
                
                // Retry with exponential backoff if not at max retries
                if (retryCount < MAX_RETRIES) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    logger.info(`Retrying API in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.loadContacts(retryCount + 1);
                }
                
                // If max retries reached or other error, fall back to local storage
                logger.warn('Max retries reached or error occurred, falling back to local storage');
            }
            
            // Fall back to local storage if API fails
            const savedContacts = await storageUtils.contacts.load();
            this.contacts = savedContacts || [];
            logger.info(`Loaded ${this.contacts.length} emergency contacts from local storage`);
            
            // Show notification that we're using cached data
            if (this.contacts.length > 0) {
                this.showNotification('Using cached contacts. Some information may not be up to date.', 'warning');
            }
            
        } catch (error) {
            logger.error('Failed to load contacts', null, error);
            this.contacts = [];
            this.showNotification('Error loading contacts. Please try again later.', 'error');
        }
    }

    initializeUI() {
        // The UI is now defined in index.html
        // This method will now just initialize event handlers for the contacts UI
        this.setupContactsUI();
    }
    
    setupContactsUI() {
        // Add contact button
        const addContactBtn = document.getElementById('add-contact');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => this.showAddContactModal());
        }
        
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Filter contacts
                const category = e.target.dataset.category;
                this.filterContacts(category);
            });
        });
        
        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveContact();
            });
        }
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal, .cancel-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('contact-modal').style.display = 'none';
                document.getElementById('contact-details-modal').style.display = 'none';
            });
        });
        
        // Contact details modal buttons
        const callContactBtn = document.getElementById('call-contact');
        if (callContactBtn) {
            callContactBtn.addEventListener('click', () => {
                const phone = callContactBtn.dataset.phone;
                if (phone) {
                    this.callContact(phone);
                }
            });
        }
        
        const editContactBtn = document.getElementById('edit-contact');
        if (editContactBtn) {
            editContactBtn.addEventListener('click', () => {
                const contactId = editContactBtn.dataset.contactId;
                if (contactId) {
                    document.getElementById('contact-details-modal').style.display = 'none';
                    this.showAddContactModal(contactId);
                }
            });
        }
        
        const deleteContactBtn = document.getElementById('delete-contact');
        if (deleteContactBtn) {
            deleteContactBtn.addEventListener('click', () => {
                const contactId = deleteContactBtn.dataset.contactId;
                if (contactId) {
                    document.getElementById('contact-details-modal').style.display = 'none';
                    this.deleteContact(contactId);
                }
            });
        }
    }

    setupEventListeners() {
        // Add contact button
        const addContactBtn = document.getElementById('add-contact');
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
        const contactIdInput = document.getElementById('contact-id');

        if (contactId) {
            // Edit existing contact
            const contact = this.contacts.find(c => c.id === contactId);
            if (contact) {
                this.populateContactForm(contact);
                modalTitle.textContent = 'Edit Contact';
                contactIdInput.value = contactId;
            }
        } else {
            // Add new contact
            this.clearContactForm();
            modalTitle.textContent = 'Add New Contact';
            contactIdInput.value = '';
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
            document.getElementById('contact-id').value = '';
        }
    }

    populateContactForm(contact) {
        const nameInput = document.getElementById('contact-name');
        const phoneInput = document.getElementById('contact-phone');
        const categorySelect = document.getElementById('contact-category');
        const orgInput = document.getElementById('contact-organization');
        const notesInput = document.getElementById('contact-notes');
        const primaryCheckbox = document.getElementById('contact-primary');
        const contactIdInput = document.getElementById('contact-id');

        if (nameInput) nameInput.value = contact.name;
        if (phoneInput) phoneInput.value = contact.phone;
        if (categorySelect) categorySelect.value = contact.category;
        if (orgInput) orgInput.value = contact.organization || '';
        if (notesInput) notesInput.value = contact.notes || '';
        if (primaryCheckbox) primaryCheckbox.checked = contact.primary || false;
        if (contactIdInput) contactIdInput.value = contact.id;
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
            const contactId = document.getElementById('contact-id').value;

            const contactData = {
                name: document.getElementById('contact-name').value.trim(),
                phone: document.getElementById('contact-phone').value.trim(),
                category: document.getElementById('contact-category').value,
                organization: document.getElementById('contact-organization').value.trim(),
                notes: document.getElementById('contact-notes').value.trim(),
                primary: document.getElementById('contact-primary').checked,
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

            let success = false;
            let savedContact = null;

            // Try to save via API first
            try {
                if (contactId) {
                    // Update existing contact
                    contactData.id = contactId;
                    const response = await fetch(`${this.baseUrl}/api/contacts/${contactId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(contactData)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            success = true;
                            savedContact = result.contact;
                            logger.info('Contact updated via API', { contactId, contactData });
                        }
                    }
                } else {
                    // Create new contact
                    contactData.id = generateId('contact');
                    const response = await fetch(`${this.baseUrl}/api/contacts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(contactData)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            success = true;
                            savedContact = result.contact;
                            logger.info('Contact created via API', savedContact);
                        }
                    }
                }
            } catch (apiError) {
                logger.warn('Failed to save contact via API, falling back to local storage', null, apiError);
            }

            // Fall back to local storage if API fails
            if (!success) {
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
                        savedContact = this.contacts[contactIndex];
                        logger.info('Contact updated in local storage', { contactId, contactData });
                }
            } else {
                // Create new contact
                const newContact = {
                        id: contactData.id,
                        ...contactData,
                        createdAt: new Date().toISOString()
                };
                this.contacts.push(newContact);
                    savedContact = newContact;
                    logger.info('Contact created in local storage', newContact);
            }

            // Save to storage
            await storageUtils.contacts.save(this.contacts);
            } else {
                // If API save was successful, update the local contacts array
                await this.loadContacts();
            }

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

            let success = false;

            // Try to delete via API first
            try {
                const response = await fetch(`${this.baseUrl}/api/contacts/${contactId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        success = true;
                        logger.info('Contact deleted via API', { contactId });
                    }
                }
            } catch (apiError) {
                logger.warn('Failed to delete contact via API, falling back to local storage', null, apiError);
            }

            // Fall back to local storage if API fails
            if (!success) {
            this.contacts = this.contacts.filter(c => c.id !== contactId);

            // Save to storage
            await storageUtils.contacts.save(this.contacts);
                
                logger.info('Contact deleted from local storage', { contactId });
            } else {
                // If API delete was successful, update the local contacts array
                await this.loadContacts();
            }

            // Update display
            this.updateContactsDisplay();

            // Show notification
            this.showNotification('Contact deleted', 'success');

        } catch (error) {
            logger.error('Error deleting contact', null, error);
            this.showNotification('Failed to delete contact', 'error');
        }
    }

    updateContactsDisplay() {
        const contactsContainer = document.getElementById('contacts-container');
        if (!contactsContainer) return;
        
        // Sort contacts: primary first, then by name
        const sortedContacts = [...this.contacts].sort((a, b) => {
            // Primary contacts first
            if (a.primary && !b.primary) return -1;
            if (!a.primary && b.primary) return 1;
            
            // Then by category
            if (a.category !== b.category) {
                const catA = this.categories.find(c => c.id === a.category);
                const catB = this.categories.find(c => c.id === b.category);
                return (catA?.priority || 999) - (catB?.priority || 999);
            }
            
            // Then by name
            return a.name.localeCompare(b.name);
        });
        
        // Get active filter
        const activeFilter = document.querySelector('.filter-btn.active');
        const filterCategory = activeFilter ? activeFilter.dataset.category : 'all';
        
        // Apply filter
        const filteredContacts = filterCategory === 'all' 
            ? sortedContacts 
            : sortedContacts.filter(c => c.category === filterCategory);
        
        // Group contacts by category
        const contactsByCategory = {};
        this.categories.forEach(category => {
            contactsByCategory[category.id] = filteredContacts.filter(c => c.category === category.id);
        });
        
        // Clear container
        contactsContainer.innerHTML = '';
        
        if (filteredContacts.length === 0) {
                    contactsContainer.innerHTML = `
                        <div class="no-contacts">
                    <p>No contacts found</p>
                    <button type="button" class="primary-button" id="add-contact-empty">
                        <span class="button-icon">➕</span>
                        Add Contact
                            </button>
                        </div>
                    `;
            
            // Add event listener to the new button
            const addContactEmptyBtn = document.getElementById('add-contact-empty');
            if (addContactEmptyBtn) {
                addContactEmptyBtn.addEventListener('click', () => this.showAddContactModal());
            }
            
            return;
        }
        
        // Create contact categories
        this.categories.forEach(category => {
            const categoryContacts = contactsByCategory[category.id];
            
            // Skip empty categories
            if (categoryContacts.length === 0) return;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'contact-category';
            categoryElement.innerHTML = `
                <h3>${category.icon} ${category.name}</h3>
                <div class="category-contacts">
                    ${categoryContacts.map(contact => this.renderContact(contact)).join('')}
                </div>
            `;
            
            contactsContainer.appendChild(categoryElement);
        });

        // Set up contact event listeners
        this.setupContactEventListeners();
    }
    
    filterContacts(category) {
        // Update the display with the filtered contacts
        this.updateContactsDisplay();
    }

    renderContact(contact) {
        const category = this.categories.find(c => c.id === contact.category);
        const formattedPhone = formatPhoneNumber(contact.phone);

        return `
            <div class="contact-item ${contact.primary ? 'primary' : ''}" data-contact-id="${contact.id}">
                <div class="contact-info">
                    <h4>
                        ${contact.name}
                        ${contact.primary ? '<span class="primary-badge">Primary</span>' : ''}
                    </h4>
                    
                    <p>
                            📞 ${formattedPhone}
                    </p>
                    
                    ${contact.organization ? `
                        <div class="contact-organization">🏢 ${contact.organization}</div>
                    ` : ''}
                </div>
                
                <div class="contact-actions">
                    <a href="tel:${contact.phone}" class="call-button">📞</a>
                    <button class="edit-button" onclick="window.emergencyContacts.showAddContactModal('${contact.id}')">✏️</button>
                    <button class="delete-button" onclick="window.emergencyContacts.deleteContact('${contact.id}')">🗑️</button>
                </div>
            </div>
        `;
    }
    
    showContactDetails(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const category = this.categories.find(c => c.id === contact.category);
        const formattedPhone = formatPhoneNumber(contact.phone);
        
        const detailsContent = document.getElementById('contact-details-content');
        const detailsTitle = document.getElementById('contact-details-title');
        
        detailsTitle.textContent = contact.name;
        
        detailsContent.innerHTML = `
            <div class="contact-detail-item">
                <div class="contact-detail-label">Phone Number</div>
                <div class="contact-detail-value">
                    <a href="tel:${contact.phone}">${formattedPhone}</a>
                </div>
            </div>
            
            <div class="contact-detail-item">
                <div class="contact-detail-label">Category</div>
                <div class="contact-detail-value">
                    ${category ? `${category.icon} ${category.name}` : contact.category}
                    ${contact.primary ? '<span class="primary-badge">Primary</span>' : ''}
                </div>
            </div>
            
            ${contact.organization ? `
                <div class="contact-detail-item">
                    <div class="contact-detail-label">Organization</div>
                    <div class="contact-detail-value">${contact.organization}</div>
                </div>
                    ` : ''}
            
            ${contact.notes ? `
                <div class="contact-detail-item">
                    <div class="contact-detail-label">Notes</div>
                    <div class="contact-detail-value">${contact.notes}</div>
                </div>
            ` : ''}
            
            <div class="contact-detail-item">
                <div class="contact-detail-label">Last Updated</div>
                <div class="contact-detail-value">
                    ${new Date(contact.updatedAt).toLocaleString()}
                </div>
            </div>
        `;
        
        // Set up action buttons
        const callContactBtn = document.getElementById('call-contact');
        const editContactBtn = document.getElementById('edit-contact');
        const deleteContactBtn = document.getElementById('delete-contact');
        
        if (callContactBtn) callContactBtn.dataset.phone = contact.phone;
        if (editContactBtn) editContactBtn.dataset.contactId = contact.id;
        if (deleteContactBtn) deleteContactBtn.dataset.contactId = contact.id;
        
        // Show modal
        document.getElementById('contact-details-modal').style.display = 'block';
    }

    setupContactEventListeners() {
        // Contact items - click to view details
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on any of the action buttons
                if (e.target.classList.contains('call-button') || 
                    e.target.classList.contains('edit-button') ||
                    e.target.classList.contains('delete-button') ||
                    e.target.closest('.call-button') ||
                    e.target.closest('.edit-button') ||
                    e.target.closest('.delete-button')) {
                    return;
                }
                
                const contactId = item.dataset.contactId;
                if (contactId) {
                    this.showContactDetails(contactId);
                }
            });
        });
        
        // Set up delete contact button in the details modal
        const deleteContactBtn = document.getElementById('delete-contact');
        if (deleteContactBtn) {
            deleteContactBtn.addEventListener('click', () => {
                const contactId = deleteContactBtn.dataset.contactId;
                if (contactId) {
                    // Hide the modal first
                    document.getElementById('contact-details-modal').style.display = 'none';
                    // Then delete the contact
                    this.deleteContact(contactId);
                }
            });
        }
        
        // Set up edit contact button in the details modal
        const editContactBtn = document.getElementById('edit-contact');
        if (editContactBtn) {
            editContactBtn.addEventListener('click', () => {
                const contactId = editContactBtn.dataset.contactId;
                if (contactId) {
                    // Hide the details modal first
                    document.getElementById('contact-details-modal').style.display = 'none';
                    // Then show the edit modal
                    this.showAddContactModal(contactId);
                }
            });
        }
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