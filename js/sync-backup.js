/**
 * Data Synchronization and Backup System
 * Handles cloud storage, conflict resolution, and automatic backups
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, throttle } from './utils.js';

export class SyncBackupSystem {
    constructor() {
        this.syncStatus = 'idle'; // idle, syncing, error
        this.lastSync = null;
        this.syncQueue = [];
        this.conflicts = [];
        this.backups = [];
        this.settings = {
            enabled: true,
            autoSync: true,
            syncInterval: 300000, // 5 minutes
            backupEnabled: true,
            backupInterval: 86400000, // 24 hours
            backupRetention: 7, // days
            cloudProviders: {
                google: {
                    enabled: false,
                    credentials: null,
                    folderId: null
                },
                dropbox: {
                    enabled: false,
                    accessToken: null,
                    folderPath: null
                },
                local: {
                    enabled: true,
                    path: './backups'
                }
            },
            dataTypes: {
                collections: { sync: true, backup: true },
                tasks: { sync: true, backup: true },
                contacts: { sync: true, backup: true },
                recordings: { sync: false, backup: true },
                incidents: { sync: true, backup: true },
                settings: { sync: true, backup: true },
                logs: { sync: false, backup: true }
            }
        };
        
        this.syncIntervals = new Map();
        this.backupIntervals = new Map();
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Sync/Backup System');
            
            // Load existing data
            await this.loadData();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start sync and backup processes
            this.startSyncProcess();
            this.startBackupProcess();
            
            logger.info('Sync/Backup System initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'sync-backup-init'
            });
        }
    }

    async loadData() {
        try {
            const savedBackups = await storageUtils.backupsManager.load();
            const savedConflicts = await storageUtils.conflictsManager.load();
            const savedSettings = await storageUtils.syncSettingsManager.load();
            
            this.backups = savedBackups || [];
            this.conflicts = savedConflicts || [];
            
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
            
            logger.info(`Loaded ${this.backups.length} backups and ${this.conflicts.length} conflicts`);
        } catch (error) {
            logger.error('Failed to load sync/backup data', null, error);
            this.backups = [];
            this.conflicts = [];
        }
    }

    initializeUI() {
        // Create sync status indicator if it doesn't exist
        if (!document.getElementById('sync-status-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'sync-status-indicator';
            indicator.className = 'sync-status-indicator';
            indicator.innerHTML = `
                <div class="sync-icon" id="sync-icon">🔄</div>
                <div class="sync-info">
                    <span class="sync-status" id="sync-status-text">Idle</span>
                    <span class="last-sync" id="last-sync-text">Never</span>
                </div>
            `;
            
            // Add to header or navigation
            const header = document.querySelector('header') || document.body;
            header.appendChild(indicator);
        }

        // Create sync/backup settings modal
        if (!document.getElementById('sync-backup-modal')) {
            const modal = document.createElement('div');
            modal.id = 'sync-backup-modal';
            modal.className = 'modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>☁️ Sync & Backup Settings</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <div class="modal-tabs">
                        <button type="button" class="tab-btn active" data-tab="sync">Sync</button>
                        <button type="button" class="tab-btn" data-tab="backup">Backup</button>
                        <button type="button" class="tab-btn" data-tab="providers">Providers</button>
                    </div>
                    
                    <div class="tab-content">
                        <!-- Sync Tab -->
                        <div class="tab-pane active" id="sync-tab">
                            <form id="sync-settings-form" class="settings-form">
                                <div class="settings-section">
                                    <h4>Sync Settings</h4>
                                    <div class="form-section">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="sync-enabled" 
                                                   ${this.settings.enabled ? 'checked' : ''}>
                                            Enable synchronization
                                        </label>
                                    </div>
                                    <div class="form-section">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="auto-sync" 
                                                   ${this.settings.autoSync ? 'checked' : ''}>
                                            Auto-sync
                                        </label>
                                    </div>
                                    <div class="form-section">
                                        <label for="sync-interval">Sync interval (minutes)</label>
                                        <input type="number" id="sync-interval" 
                                               value="${this.settings.syncInterval / 60000}" min="1" max="60">
                                    </div>
                                </div>
                                
                                <div class="settings-section">
                                    <h4>Data Types</h4>
                                    ${Object.entries(this.settings.dataTypes).map(([type, config]) => `
                                        <div class="form-section">
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="sync-${type}" 
                                                       ${config.sync ? 'checked' : ''}>
                                                Sync ${type}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            </form>
                        </div>
                        
                        <!-- Backup Tab -->
                        <div class="tab-pane" id="backup-tab">
                            <form id="backup-settings-form" class="settings-form">
                                <div class="settings-section">
                                    <h4>Backup Settings</h4>
                                    <div class="form-section">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="backup-enabled" 
                                                   ${this.settings.backupEnabled ? 'checked' : ''}>
                                            Enable automatic backups
                                        </label>
                                    </div>
                                    <div class="form-section">
                                        <label for="backup-interval">Backup interval (hours)</label>
                                        <input type="number" id="backup-interval" 
                                               value="${this.settings.backupInterval / 3600000}" min="1" max="168">
                                    </div>
                                    <div class="form-section">
                                        <label for="backup-retention">Retention period (days)</label>
                                        <input type="number" id="backup-retention" 
                                               value="${this.settings.backupRetention}" min="1" max="365">
                                    </div>
                                </div>
                                
                                <div class="settings-section">
                                    <h4>Backup Data Types</h4>
                                    ${Object.entries(this.settings.dataTypes).map(([type, config]) => `
                                        <div class="form-section">
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="backup-${type}" 
                                                       ${config.backup ? 'checked' : ''}>
                                                Backup ${type}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            </form>
                        </div>
                        
                        <!-- Providers Tab -->
                        <div class="tab-pane" id="providers-tab">
                            <div class="providers-list">
                                <div class="provider-item">
                                    <h4>📁 Local Storage</h4>
                                    <div class="form-section">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="local-enabled" 
                                                   ${this.settings.cloudProviders.local.enabled ? 'checked' : ''}>
                                            Enable local backups
                                        </label>
                                    </div>
                                    <div class="form-section">
                                        <label for="local-path">Backup path</label>
                                        <input type="text" id="local-path" 
                                               value="${this.settings.cloudProviders.local.path}">
                                    </div>
                                </div>
                                
                                <div class="provider-item">
                                    <h4>☁️ Google Drive</h4>
                                    <div class="form-section">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="google-enabled" 
                                                   ${this.settings.cloudProviders.google.enabled ? 'checked' : ''}>
                                            Enable Google Drive sync
                                        </label>
                                    </div>
                                    <div class="form-section">
                                        <button type="button" class="btn btn-primary" id="google-auth-btn">
                                            🔐 Authenticate Google Drive
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="provider-item">
                                    <h4>📦 Dropbox</h4>
                                    <div class="form-section">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="dropbox-enabled" 
                                                   ${this.settings.cloudProviders.dropbox.enabled ? 'checked' : ''}>
                                            Enable Dropbox sync
                                        </label>
                                    </div>
                                    <div class="form-section">
                                        <button type="button" class="btn btn-primary" id="dropbox-auth-btn">
                                            🔐 Authenticate Dropbox
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="save-sync-backup-btn">
                            💾 Save Settings
                        </button>
                        <button type="button" class="btn btn-secondary" id="cancel-sync-backup-btn">
                            ❌ Cancel
                        </button>
                        <button type="button" class="btn btn-warning" id="manual-sync-btn">
                            🔄 Manual Sync
                        </button>
                        <button type="button" class="btn btn-info" id="manual-backup-btn">
                            💾 Manual Backup
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    setupEventListeners() {
        // Sync status indicator click
        const indicator = document.getElementById('sync-status-indicator');
        if (indicator) {
            indicator.addEventListener('click', () => this.showSyncModal());
        }

        // Modal controls
        const modal = document.getElementById('sync-backup-modal');
        const modalClose = document.querySelector('#sync-backup-modal .modal-close');
        const cancelBtn = document.getElementById('cancel-sync-backup-btn');
        const saveBtn = document.getElementById('save-sync-backup-btn');
        const manualSyncBtn = document.getElementById('manual-sync-btn');
        const manualBackupBtn = document.getElementById('manual-backup-btn');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideSyncModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideSyncModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideSyncModal();
                }
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        if (manualSyncBtn) {
            manualSyncBtn.addEventListener('click', () => this.manualSync());
        }

        if (manualBackupBtn) {
            manualBackupBtn.addEventListener('click', () => this.manualBackup());
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Provider authentication
        const googleAuthBtn = document.getElementById('google-auth-btn');
        const dropboxAuthBtn = document.getElementById('dropbox-auth-btn');

        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => this.authenticateGoogle());
        }

        if (dropboxAuthBtn) {
            dropboxAuthBtn.addEventListener('click', () => this.authenticateDropbox());
        }
    }

    startSyncProcess() {
        if (!this.settings.enabled || !this.settings.autoSync) return;

        // Clear existing intervals
        this.syncIntervals.forEach(interval => clearInterval(interval));
        this.syncIntervals.clear();

        // Start sync intervals for each data type
        Object.entries(this.settings.dataTypes).forEach(([type, config]) => {
            if (config.sync) {
                const interval = setInterval(() => {
                    this.syncDataType(type);
                }, this.settings.syncInterval);
                
                this.syncIntervals.set(type, interval);
            }
        });

        logger.info('Sync process started');
    }

    startBackupProcess() {
        if (!this.settings.backupEnabled) return;

        // Clear existing intervals
        this.backupIntervals.forEach(interval => clearInterval(interval));
        this.backupIntervals.clear();

        // Start backup interval
        const interval = setInterval(() => {
            this.createBackup();
        }, this.settings.backupInterval);
        
        this.backupIntervals.set('main', interval);

        // Clean up old backups
        this.cleanupOldBackups();

        logger.info('Backup process started');
    }

    async syncDataType(dataType) {
        try {
            if (this.syncStatus === 'syncing') {
                this.syncQueue.push(dataType);
                return;
            }

            this.setSyncStatus('syncing');
            logger.info(`Starting sync for ${dataType}`);

            // Get local data
            const localData = await this.getLocalData(dataType);
            
            // Get remote data from enabled providers
            const remoteData = await this.getRemoteData(dataType);
            
            // Detect conflicts
            const conflicts = this.detectConflicts(localData, remoteData);
            
            if (conflicts.length > 0) {
                await this.handleConflicts(dataType, conflicts);
            } else {
                // Merge data
                const mergedData = this.mergeData(localData, remoteData);
                
                // Update local storage
                await this.updateLocalData(dataType, mergedData);
                
                // Upload to remote providers
                await this.uploadToRemote(dataType, mergedData);
            }

            this.lastSync = new Date().toISOString();
            this.setSyncStatus('idle');
            
            this.updateSyncUI();
            logger.info(`Sync completed for ${dataType}`);

            // Process queue
            if (this.syncQueue.length > 0) {
                const nextType = this.syncQueue.shift();
                setTimeout(() => this.syncDataType(nextType), 1000);
            }

        } catch (error) {
            this.setSyncStatus('error');
            logger.error(`Sync failed for ${dataType}`, null, error);
            
            // Retry after delay
            setTimeout(() => {
                this.syncDataType(dataType);
            }, 30000);
        }
    }

    async getLocalData(dataType) {
        try {
            const manager = this.getDataManager(dataType);
            if (manager) {
                return await manager.load();
            }
            return null;
        } catch (error) {
            logger.error(`Error getting local data for ${dataType}`, null, error);
            return null;
        }
    }

    async getRemoteData(dataType) {
        const remoteData = {};
        
        // Get data from each enabled provider
        for (const [provider, config] of Object.entries(this.settings.cloudProviders)) {
            if (config.enabled) {
                try {
                    const data = await this.getDataFromProvider(provider, dataType);
                    if (data) {
                        remoteData[provider] = data;
                    }
                } catch (error) {
                    logger.error(`Error getting data from ${provider}`, null, error);
                }
            }
        }
        
        return remoteData;
    }

    async getDataFromProvider(provider, dataType) {
        switch (provider) {
            case 'google':
                return await this.getDataFromGoogle(dataType);
            case 'dropbox':
                return await this.getDataFromDropbox(dataType);
            case 'local':
                return await this.getDataFromLocal(dataType);
            default:
                return null;
        }
    }

    async getDataFromGoogle(dataType) {
        // Google Drive API implementation
        // This would use the Google Drive API to fetch data
        logger.info('Getting data from Google Drive', { dataType });
        return null; // Placeholder
    }

    async getDataFromDropbox(dataType) {
        // Dropbox API implementation
        // This would use the Dropbox API to fetch data
        logger.info('Getting data from Dropbox', { dataType });
        return null; // Placeholder
    }

    async getDataFromLocal(dataType) {
        // Local file system implementation
        try {
            const path = `${this.settings.cloudProviders.local.path}/${dataType}.json`;
            // This would read from local file system
            logger.info('Getting data from local storage', { dataType, path });
            return null; // Placeholder
        } catch (error) {
            logger.error('Error reading local backup', null, error);
            return null;
        }
    }

    detectConflicts(localData, remoteData) {
        const conflicts = [];
        
        // Compare local data with each remote provider
        Object.entries(remoteData).forEach(([provider, data]) => {
            if (data && localData) {
                const conflict = this.compareData(localData, data);
                if (conflict) {
                    conflicts.push({
                        provider,
                        localData,
                        remoteData: data,
                        conflict
                    });
                }
            }
        });
        
        return conflicts;
    }

    compareData(localData, remoteData) {
        // Simple comparison - in a real implementation, this would be more sophisticated
        const localHash = this.generateDataHash(localData);
        const remoteHash = this.generateDataHash(remoteData);
        
        return localHash !== remoteHash ? {
            type: 'data_mismatch',
            localHash,
            remoteHash
        } : null;
    }

    generateDataHash(data) {
        // Simple hash generation - in production, use a proper hashing algorithm
        return JSON.stringify(data).length.toString();
    }

    async handleConflicts(dataType, conflicts) {
        logger.warn(`Conflicts detected for ${dataType}`, conflicts);
        
        // Store conflicts for user resolution
        conflicts.forEach(conflict => {
            const conflictRecord = {
                id: generateId('conflict'),
                dataType,
                provider: conflict.provider,
                localData: conflict.localData,
                remoteData: conflict.remoteData,
                conflict: conflict.conflict,
                timestamp: new Date().toISOString(),
                resolved: false
            };
            
            this.conflicts.push(conflictRecord);
        });
        
        // Save conflicts
        await storageUtils.conflictsManager.save(this.conflicts);
        
        // Show conflict notification
        this.showConflictNotification(conflicts.length, dataType);
    }

    mergeData(localData, remoteData) {
        // Simple merge strategy - in production, this would be more sophisticated
        const merged = { ...localData };
        
        Object.entries(remoteData).forEach(([provider, data]) => {
            if (data) {
                // Merge arrays by combining unique items
                if (Array.isArray(data) && Array.isArray(merged)) {
                    const ids = new Set(merged.map(item => item.id));
                    data.forEach(item => {
                        if (!ids.has(item.id)) {
                            merged.push(item);
                        }
                    });
                }
                // For objects, use remote data as base and merge local changes
                else if (typeof data === 'object' && typeof merged === 'object') {
                    Object.assign(merged, data);
                }
            }
        });
        
        return merged;
    }

    async updateLocalData(dataType, data) {
        try {
            const manager = this.getDataManager(dataType);
            if (manager) {
                await manager.save(data);
                logger.info(`Local data updated for ${dataType}`);
            }
        } catch (error) {
            logger.error(`Error updating local data for ${dataType}`, null, error);
            throw error;
        }
    }

    async uploadToRemote(dataType, data) {
        // Upload to each enabled provider
        for (const [provider, config] of Object.entries(this.settings.cloudProviders)) {
            if (config.enabled) {
                try {
                    await this.uploadToProvider(provider, dataType, data);
                } catch (error) {
                    logger.error(`Error uploading to ${provider}`, null, error);
                }
            }
        }
    }

    async uploadToProvider(provider, dataType, data) {
        switch (provider) {
            case 'google':
                return await this.uploadToGoogle(dataType, data);
            case 'dropbox':
                return await this.uploadToDropbox(dataType, data);
            case 'local':
                return await this.uploadToLocal(dataType, data);
            default:
                return null;
        }
    }

    async uploadToGoogle(dataType, data) {
        // Google Drive API implementation
        logger.info('Uploading to Google Drive', { dataType });
        // Placeholder implementation
    }

    async uploadToDropbox(dataType, data) {
        // Dropbox API implementation
        logger.info('Uploading to Dropbox', { dataType });
        // Placeholder implementation
    }

    async uploadToLocal(dataType, data) {
        // Local file system implementation
        try {
            const path = `${this.settings.cloudProviders.local.path}/${dataType}.json`;
            // This would write to local file system
            logger.info('Uploading to local storage', { dataType, path });
        } catch (error) {
            logger.error('Error writing local backup', null, error);
            throw error;
        }
    }

    async createBackup() {
        try {
            logger.info('Creating backup');
            
            const backup = {
                id: generateId('backup'),
                timestamp: new Date().toISOString(),
                data: {},
                size: 0,
                status: 'creating'
            };

            // Backup each enabled data type
            for (const [dataType, config] of Object.entries(this.settings.dataTypes)) {
                if (config.backup) {
                    try {
                        const data = await this.getLocalData(dataType);
                        if (data) {
                            backup.data[dataType] = data;
                        }
                    } catch (error) {
                        logger.error(`Error backing up ${dataType}`, null, error);
                    }
                }
            }

            // Calculate backup size
            backup.size = JSON.stringify(backup.data).length;
            backup.status = 'completed';

            // Add to backups list
            this.backups.unshift(backup);

            // Save backup to storage
            await storageUtils.backupsManager.save(this.backups);

            // Upload backup to remote providers
            await this.uploadBackup(backup);

            logger.info('Backup created successfully', { backupId: backup.id, size: backup.size });

        } catch (error) {
            logger.error('Error creating backup', null, error);
        }
    }

    async uploadBackup(backup) {
        // Upload to each enabled provider
        for (const [provider, config] of Object.entries(this.settings.cloudProviders)) {
            if (config.enabled) {
                try {
                    await this.uploadBackupToProvider(provider, backup);
                } catch (error) {
                    logger.error(`Error uploading backup to ${provider}`, null, error);
                }
            }
        }
    }

    async uploadBackupToProvider(provider, backup) {
        switch (provider) {
            case 'google':
                return await this.uploadBackupToGoogle(backup);
            case 'dropbox':
                return await this.uploadBackupToDropbox(backup);
            case 'local':
                return await this.uploadBackupToLocal(backup);
            default:
                return null;
        }
    }

    async uploadBackupToGoogle(backup) {
        // Google Drive API implementation
        logger.info('Uploading backup to Google Drive', { backupId: backup.id });
        // Placeholder implementation
    }

    async uploadBackupToDropbox(backup) {
        // Dropbox API implementation
        logger.info('Uploading backup to Dropbox', { backupId: backup.id });
        // Placeholder implementation
    }

    async uploadBackupToLocal(backup) {
        // Local file system implementation
        try {
            const filename = `backup_${backup.id}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            const path = `${this.settings.cloudProviders.local.path}/${filename}`;
            // This would write backup file to local file system
            logger.info('Uploading backup to local storage', { backupId: backup.id, path });
        } catch (error) {
            logger.error('Error writing local backup file', null, error);
            throw error;
        }
    }

    cleanupOldBackups() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.settings.backupRetention);

            const oldBackups = this.backups.filter(backup => 
                new Date(backup.timestamp) < cutoffDate
            );

            oldBackups.forEach(backup => {
                this.backups = this.backups.filter(b => b.id !== backup.id);
            });

            if (oldBackups.length > 0) {
                storageUtils.backupsManager.save(this.backups);
                logger.info(`Cleaned up ${oldBackups.length} old backups`);
            }
        } catch (error) {
            logger.error('Error cleaning up old backups', null, error);
        }
    }

    setSyncStatus(status) {
        this.syncStatus = status;
        this.updateSyncUI();
    }

    updateSyncUI() {
        const icon = document.getElementById('sync-icon');
        const statusText = document.getElementById('sync-status-text');
        const lastSyncText = document.getElementById('last-sync-text');

        if (icon) {
            icon.textContent = this.getSyncIcon();
            icon.className = `sync-icon ${this.syncStatus}`;
        }

        if (statusText) {
            statusText.textContent = this.syncStatus.charAt(0).toUpperCase() + this.syncStatus.slice(1);
        }

        if (lastSyncText) {
            lastSyncText.textContent = this.lastSync 
                ? formatDate(this.lastSync) 
                : 'Never';
        }
    }

    getSyncIcon() {
        const icons = {
            idle: '🔄',
            syncing: '⏳',
            error: '❌'
        };
        return icons[this.syncStatus] || '🔄';
    }

    showSyncModal() {
        const modal = document.getElementById('sync-backup-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideSyncModal() {
        const modal = document.getElementById('sync-backup-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async saveSettings() {
        try {
            // Get sync settings
            const newSettings = {
                enabled: document.getElementById('sync-enabled').checked,
                autoSync: document.getElementById('auto-sync').checked,
                syncInterval: parseInt(document.getElementById('sync-interval').value) * 60000,
                backupEnabled: document.getElementById('backup-enabled').checked,
                backupInterval: parseInt(document.getElementById('backup-interval').value) * 3600000,
                backupRetention: parseInt(document.getElementById('backup-retention').value),
                dataTypes: {}
            };

            // Get data type settings
            Object.keys(this.settings.dataTypes).forEach(type => {
                newSettings.dataTypes[type] = {
                    sync: document.getElementById(`sync-${type}`).checked,
                    backup: document.getElementById(`backup-${type}`).checked
                };
            });

            // Get provider settings
            newSettings.cloudProviders = {
                local: {
                    enabled: document.getElementById('local-enabled').checked,
                    path: document.getElementById('local-path').value
                },
                google: {
                    enabled: document.getElementById('google-enabled').checked,
                    credentials: this.settings.cloudProviders.google.credentials,
                    folderId: this.settings.cloudProviders.google.folderId
                },
                dropbox: {
                    enabled: document.getElementById('dropbox-enabled').checked,
                    accessToken: this.settings.cloudProviders.dropbox.accessToken,
                    folderPath: this.settings.cloudProviders.dropbox.folderPath
                }
            };

            this.settings = newSettings;
            
            // Save to storage
            await storageUtils.syncSettingsManager.save(this.settings);
            
            // Restart processes
            this.startSyncProcess();
            this.startBackupProcess();
            
            this.hideSyncModal();
            this.showNotification('Sync/Backup settings saved successfully', 'success');
            
            logger.info('Sync/Backup settings updated', newSettings);
            
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'save-sync-backup-settings'
            });
            
            this.showNotification('Failed to save settings', 'error');
        }
    }

    async manualSync() {
        try {
            this.showNotification('Starting manual sync...', 'info');
            
            // Sync all enabled data types
            for (const [dataType, config] of Object.entries(this.settings.dataTypes)) {
                if (config.sync) {
                    await this.syncDataType(dataType);
                }
            }
            
            this.showNotification('Manual sync completed', 'success');
            
        } catch (error) {
            logger.error('Manual sync failed', null, error);
            this.showNotification('Manual sync failed', 'error');
        }
    }

    async manualBackup() {
        try {
            this.showNotification('Creating manual backup...', 'info');
            
            await this.createBackup();
            
            this.showNotification('Manual backup completed', 'success');
            
        } catch (error) {
            logger.error('Manual backup failed', null, error);
            this.showNotification('Manual backup failed', 'error');
        }
    }

    async authenticateGoogle() {
        try {
            // Google OAuth implementation
            this.showNotification('Google authentication not implemented yet', 'warning');
            logger.info('Google authentication requested');
        } catch (error) {
            logger.error('Google authentication failed', null, error);
            this.showNotification('Google authentication failed', 'error');
        }
    }

    async authenticateDropbox() {
        try {
            // Dropbox OAuth implementation
            this.showNotification('Dropbox authentication not implemented yet', 'warning');
            logger.info('Dropbox authentication requested');
        } catch (error) {
            logger.error('Dropbox authentication failed', null, error);
            this.showNotification('Dropbox authentication failed', 'error');
        }
    }

    showConflictNotification(count, dataType) {
        // This would integrate with the notification system
        const message = `${count} conflict(s) detected in ${dataType}. Please resolve in settings.`;
        logger.warn(message);
    }

    getDataManager(dataType) {
        const managers = {
            collections: storageUtils.collectionsManager,
            tasks: storageUtils.tasksManager,
            contacts: storageUtils.contactsManager,
            recordings: storageUtils.recordingsManager,
            incidents: storageUtils.incidentsManager,
            settings: storageUtils.settingsManager,
            logs: storageUtils.logsManager
        };
        return managers[dataType];
    }

    showNotification(message, type = 'info') {
        // This would integrate with the notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Public methods for external access
    getSyncStatus() {
        return this.syncStatus;
    }

    getLastSync() {
        return this.lastSync;
    }

    getBackups() {
        return this.backups;
    }

    getConflicts() {
        return this.conflicts;
    }

    getSettings() {
        return this.settings;
    }

    async exportData(format = 'json') {
        try {
            const data = {
                settings: this.settings,
                backups: this.backups,
                conflicts: this.conflicts,
                summary: {
                    totalBackups: this.backups.length,
                    totalConflicts: this.conflicts.length,
                    lastSync: this.lastSync,
                    syncStatus: this.syncStatus,
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting sync/backup data', null, error);
            throw error;
        }
    }

    convertToCSV(data) {
        // Convert backups to CSV
        const backupHeaders = ['ID', 'Timestamp', 'Size', 'Status'];
        const backupRows = data.backups.map(b => [
            b.id,
            b.timestamp,
            b.size,
            b.status
        ]);

        // Convert conflicts to CSV
        const conflictHeaders = ['ID', 'DataType', 'Provider', 'Timestamp', 'Resolved'];
        const conflictRows = data.conflicts.map(c => [
            c.id,
            c.dataType,
            c.provider,
            c.timestamp,
            c.resolved ? 'Yes' : 'No'
        ]);

        const backupsCSV = [backupHeaders, ...backupRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const conflictsCSV = [conflictHeaders, ...conflictRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return `Backups:\n${backupsCSV}\n\nConflicts:\n${conflictsCSV}`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.syncBackupSystem = new SyncBackupSystem();
    });
} else {
    window.syncBackupSystem = new SyncBackupSystem();
}

export default window.syncBackupSystem; 