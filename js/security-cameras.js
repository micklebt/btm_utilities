/**
 * Security Camera Monitoring Interface
 * Handles live feeds, recording controls, and incident reporting
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, throttle } from './utils.js';

export class SecurityCameras {
    constructor() {
        this.cameras = [];
        this.activeStreams = new Map();
        this.recordings = [];
        this.incidents = [];
        this.isRecording = false;
        this.currentLayout = 'grid'; // grid, single, quad
        
        this.cameraConfigs = [
            {
                id: 'camera-1',
                name: 'Front Entrance',
                location: 'Main entrance',
                type: 'dome',
                resolution: '1080p',
                status: 'online',
                position: { x: 0, y: 0, width: 1, height: 1 }
            },
            {
                id: 'camera-2',
                name: 'Parking Lot',
                location: 'Parking area',
                type: 'bullet',
                resolution: '1080p',
                status: 'online',
                position: { x: 1, y: 0, width: 1, height: 1 }
            },
            {
                id: 'camera-3',
                name: 'Main Floor',
                location: 'Laundromat floor',
                type: 'dome',
                resolution: '720p',
                status: 'online',
                position: { x: 0, y: 1, width: 1, height: 1 }
            },
            {
                id: 'camera-4',
                name: 'Back Entrance',
                location: 'Rear entrance',
                type: 'bullet',
                resolution: '1080p',
                status: 'offline',
                position: { x: 1, y: 1, width: 1, height: 1 }
            }
        ];
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Security Cameras module');
            
            // Load existing data
            await this.loadData();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize camera streams
            this.initializeCameraStreams();
            
            logger.info('Security Cameras module initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'security-cameras-init'
            });
        }
    }

    async loadData() {
        try {
            const savedRecordings = await storageUtils.recordingsManager.load();
            const savedIncidents = await storageUtils.incidentsManager.load();
            
            this.recordings = savedRecordings || [];
            this.incidents = savedIncidents || [];
            
            logger.info(`Loaded ${this.recordings.length} recordings and ${this.incidents.length} incidents`);
        } catch (error) {
            logger.error('Failed to load security data', null, error);
            this.recordings = [];
            this.incidents = [];
        }
    }

    initializeUI() {
        const container = document.getElementById('security-cameras-container');
        if (!container) return;

        container.innerHTML = `
            <div class="security-header">
                <h2>📹 Security Cameras</h2>
                <div class="security-controls">
                    <button type="button" id="start-recording-btn" class="btn btn-danger">
                        🔴 Start Recording
                    </button>
                    <button type="button" id="stop-recording-btn" class="btn btn-secondary" style="display: none;">
                        ⏹️ Stop Recording
                    </button>
                    <button type="button" id="report-incident-btn" class="btn btn-warning">
                        🚨 Report Incident
                    </button>
                    <select id="layout-selector" class="layout-selector">
                        <option value="grid">Grid View</option>
                        <option value="single">Single Camera</option>
                        <option value="quad">Quad View</option>
                    </select>
                </div>
            </div>

            <div class="camera-status-bar">
                <div class="status-item">
                    <span class="status-label">Online Cameras:</span>
                    <span class="status-value" id="online-count">0</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Recording:</span>
                    <span class="status-value" id="recording-status">No</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Storage:</span>
                    <span class="status-value" id="storage-usage">0%</span>
                </div>
            </div>

            <div class="camera-grid" id="camera-grid">
                <!-- Camera feeds will be populated here -->
            </div>

            <div class="camera-sidebar">
                <div class="sidebar-section">
                    <h3>📋 Camera List</h3>
                    <div class="camera-list" id="camera-list">
                        <!-- Camera list will be populated here -->
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <h3>📹 Recent Recordings</h3>
                    <div class="recordings-list" id="recordings-list">
                        <!-- Recordings will be populated here -->
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <h3>🚨 Recent Incidents</h3>
                    <div class="incidents-list" id="incidents-list">
                        <!-- Incidents will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Report Incident Modal -->
            <div id="incident-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🚨 Report Security Incident</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <form id="incident-form" class="incident-form">
                        <div class="form-section">
                            <label for="incident-type">Incident Type *</label>
                            <select id="incident-type" required>
                                <option value="">Select incident type...</option>
                                <option value="theft">Theft</option>
                                <option value="vandalism">Vandalism</option>
                                <option value="trespassing">Trespassing</option>
                                <option value="suspicious">Suspicious Activity</option>
                                <option value="assault">Assault</option>
                                <option value="fire">Fire</option>
                                <option value="medical">Medical Emergency</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-section">
                            <label for="incident-description">Description *</label>
                            <textarea id="incident-description" rows="4" required
                                      placeholder="Describe what happened..."></textarea>
                        </div>
                        
                        <div class="form-section">
                            <label for="incident-location">Location</label>
                            <select id="incident-location">
                                <option value="">Select location...</option>
                                <option value="front-entrance">Front Entrance</option>
                                <option value="parking-lot">Parking Lot</option>
                                <option value="main-floor">Main Floor</option>
                                <option value="back-entrance">Back Entrance</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-section">
                            <label for="incident-severity">Severity Level</label>
                            <select id="incident-severity">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        
                        <div class="form-section">
                            <label class="checkbox-label">
                                <input type="checkbox" id="incident-police">
                                Police notification required
                            </label>
                        </div>
                        
                        <div class="form-section">
                            <label class="checkbox-label">
                                <input type="checkbox" id="incident-recording">
                                Include current recording
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-danger">
                                🚨 Report Incident
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-incident-btn">
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Recording controls
        const startRecordingBtn = document.getElementById('start-recording-btn');
        const stopRecordingBtn = document.getElementById('stop-recording-btn');
        
        if (startRecordingBtn) {
            startRecordingBtn.addEventListener('click', () => this.startRecording());
        }
        
        if (stopRecordingBtn) {
            stopRecordingBtn.addEventListener('click', () => this.stopRecording());
        }

        // Incident reporting
        const reportIncidentBtn = document.getElementById('report-incident-btn');
        if (reportIncidentBtn) {
            reportIncidentBtn.addEventListener('click', () => this.showIncidentModal());
        }

        // Layout selector
        const layoutSelector = document.getElementById('layout-selector');
        if (layoutSelector) {
            layoutSelector.addEventListener('change', (e) => {
                this.changeLayout(e.target.value);
            });
        }

        // Incident modal controls
        const incidentModal = document.getElementById('incident-modal');
        const incidentModalClose = document.querySelector('#incident-modal .modal-close');
        const cancelIncidentBtn = document.getElementById('cancel-incident-btn');
        const incidentForm = document.getElementById('incident-form');

        if (incidentModalClose) {
            incidentModalClose.addEventListener('click', () => this.hideIncidentModal());
        }

        if (cancelIncidentBtn) {
            cancelIncidentBtn.addEventListener('click', () => this.hideIncidentModal());
        }

        if (incidentModal) {
            incidentModal.addEventListener('click', (e) => {
                if (e.target === incidentModal) {
                    this.hideIncidentModal();
                }
            });
        }

        if (incidentForm) {
            incidentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.reportIncident();
            });
        }
    }

    initializeCameraStreams() {
        // Initialize camera grid
        this.updateCameraGrid();
        
        // Initialize camera list
        this.updateCameraList();
        
        // Update status
        this.updateStatus();
        
        // Update recordings and incidents
        this.updateRecordingsList();
        this.updateIncidentsList();
    }

    updateCameraGrid() {
        const grid = document.getElementById('camera-grid');
        if (!grid) return;

        const onlineCameras = this.cameraConfigs.filter(cam => cam.status === 'online');
        const onlineCount = onlineCameras.length;

        // Update online count
        const onlineCountElement = document.getElementById('online-count');
        if (onlineCountElement) {
            onlineCountElement.textContent = onlineCount;
        }

        // Generate camera grid based on layout
        let gridHTML = '';
        
        switch (this.currentLayout) {
            case 'single':
                gridHTML = this.generateSingleLayout();
                break;
            case 'quad':
                gridHTML = this.generateQuadLayout();
                break;
            default:
                gridHTML = this.generateGridLayout();
        }

        grid.className = `camera-grid layout-${this.currentLayout}`;
        grid.innerHTML = gridHTML;

        // Set up camera controls
        this.setupCameraControls();
    }

    generateSingleLayout() {
        const onlineCameras = this.cameraConfigs.filter(cam => cam.status === 'online');
        if (onlineCameras.length === 0) {
            return '<div class="no-cameras">No cameras online</div>';
        }

        const camera = onlineCameras[0];
        return `
            <div class="camera-feed single-feed" data-camera-id="${camera.id}">
                <div class="camera-header">
                    <h3>${camera.name}</h3>
                    <div class="camera-status ${camera.status}">${camera.status}</div>
                </div>
                <div class="camera-video">
                    <video id="video-${camera.id}" class="camera-video-element" autoplay muted>
                        <source src="data/video/placeholder.mp4" type="video/mp4">
                        Your browser does not support video playback.
                    </video>
                    <div class="camera-overlay">
                        <div class="camera-info">
                            <span class="camera-location">${camera.location}</span>
                            <span class="camera-resolution">${camera.resolution}</span>
                        </div>
                        <div class="camera-controls">
                            <button type="button" class="btn btn-sm btn-primary snapshot-btn" 
                                    data-camera-id="${camera.id}">📸</button>
                            <button type="button" class="btn btn-sm btn-secondary fullscreen-btn" 
                                    data-camera-id="${camera.id}">⛶</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateQuadLayout() {
        const onlineCameras = this.cameraConfigs.filter(cam => cam.status === 'online');
        const cameras = onlineCameras.slice(0, 4); // Max 4 cameras for quad view

        if (cameras.length === 0) {
            return '<div class="no-cameras">No cameras online</div>';
        }

        return `
            <div class="quad-grid">
                ${cameras.map((camera, index) => `
                    <div class="camera-feed quad-feed" data-camera-id="${camera.id}">
                        <div class="camera-header">
                            <h4>${camera.name}</h4>
                            <div class="camera-status ${camera.status}">${camera.status}</div>
                        </div>
                        <div class="camera-video">
                            <video id="video-${camera.id}" class="camera-video-element" autoplay muted>
                                <source src="data/video/placeholder.mp4" type="video/mp4">
                            </video>
                            <div class="camera-overlay">
                                <div class="camera-controls">
                                    <button type="button" class="btn btn-sm btn-primary snapshot-btn" 
                                            data-camera-id="${camera.id}">📸</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    generateGridLayout() {
        const onlineCameras = this.cameraConfigs.filter(cam => cam.status === 'online');
        
        if (onlineCameras.length === 0) {
            return '<div class="no-cameras">No cameras online</div>';
        }

        return onlineCameras.map(camera => `
            <div class="camera-feed grid-feed" data-camera-id="${camera.id}">
                <div class="camera-header">
                    <h4>${camera.name}</h4>
                    <div class="camera-status ${camera.status}">${camera.status}</div>
                </div>
                <div class="camera-video">
                    <video id="video-${camera.id}" class="camera-video-element" autoplay muted>
                        <source src="data/video/placeholder.mp4" type="video/mp4">
                    </video>
                    <div class="camera-overlay">
                        <div class="camera-info">
                            <span class="camera-location">${camera.location}</span>
                            <span class="camera-resolution">${camera.resolution}</span>
                        </div>
                        <div class="camera-controls">
                            <button type="button" class="btn btn-sm btn-primary snapshot-btn" 
                                    data-camera-id="${camera.id}">📸</button>
                            <button type="button" class="btn btn-sm btn-secondary fullscreen-btn" 
                                    data-camera-id="${camera.id}">⛶</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupCameraControls() {
        // Snapshot buttons
        const snapshotButtons = document.querySelectorAll('.snapshot-btn');
        snapshotButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.takeSnapshot(e.target.dataset.cameraId);
            });
        });

        // Fullscreen buttons
        const fullscreenButtons = document.querySelectorAll('.fullscreen-btn');
        fullscreenButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleFullscreen(e.target.dataset.cameraId);
            });
        });

        // Camera feed clicks for single view
        const cameraFeeds = document.querySelectorAll('.camera-feed');
        cameraFeeds.forEach(feed => {
            feed.addEventListener('click', (e) => {
                if (this.currentLayout === 'grid' && !e.target.closest('.camera-controls')) {
                    this.focusCamera(feed.dataset.cameraId);
                }
            });
        });
    }

    updateCameraList() {
        const list = document.getElementById('camera-list');
        if (!list) return;

        list.innerHTML = this.cameraConfigs.map(camera => `
            <div class="camera-list-item ${camera.status}" data-camera-id="${camera.id}">
                <div class="camera-list-info">
                    <div class="camera-list-name">${camera.name}</div>
                    <div class="camera-list-location">${camera.location}</div>
                    <div class="camera-list-status">${camera.status}</div>
                </div>
                <div class="camera-list-actions">
                    <button type="button" class="btn btn-sm btn-primary" 
                            onclick="window.securityCameras.focusCamera('${camera.id}')">
                        👁️
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStatus() {
        const recordingStatus = document.getElementById('recording-status');
        const storageUsage = document.getElementById('storage-usage');
        
        if (recordingStatus) {
            recordingStatus.textContent = this.isRecording ? 'Yes' : 'No';
            recordingStatus.className = `status-value ${this.isRecording ? 'recording' : ''}`;
        }
        
        if (storageUsage) {
            // Calculate storage usage (mock data)
            const usage = Math.floor(Math.random() * 30) + 10; // 10-40%
            storageUsage.textContent = `${usage}%`;
            storageUsage.className = `status-value ${usage > 80 ? 'warning' : ''}`;
        }
    }

    updateRecordingsList() {
        const list = document.getElementById('recordings-list');
        if (!list) return;

        const recentRecordings = this.recordings
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        if (recentRecordings.length === 0) {
            list.innerHTML = '<div class="no-recordings">No recent recordings</div>';
        } else {
            list.innerHTML = recentRecordings.map(recording => `
                <div class="recording-item">
                    <div class="recording-info">
                        <div class="recording-name">${recording.name}</div>
                        <div class="recording-time">${formatDate(recording.timestamp)}</div>
                        <div class="recording-duration">${recording.duration}</div>
                    </div>
                    <div class="recording-actions">
                        <button type="button" class="btn btn-sm btn-primary" 
                                onclick="window.securityCameras.downloadRecording('${recording.id}')">
                            📥
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    updateIncidentsList() {
        const list = document.getElementById('incidents-list');
        if (!list) return;

        const recentIncidents = this.incidents
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        if (recentIncidents.length === 0) {
            list.innerHTML = '<div class="no-incidents">No recent incidents</div>';
        } else {
            list.innerHTML = recentIncidents.map(incident => `
                <div class="incident-item ${incident.severity}">
                    <div class="incident-info">
                        <div class="incident-type">${incident.type}</div>
                        <div class="incident-time">${formatDate(incident.timestamp)}</div>
                        <div class="incident-severity">${incident.severity}</div>
                    </div>
                    <div class="incident-actions">
                        <button type="button" class="btn btn-sm btn-secondary" 
                                onclick="window.securityCameras.viewIncident('${incident.id}')">
                            👁️
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    changeLayout(layout) {
        this.currentLayout = layout;
        this.updateCameraGrid();
        
        // Update layout selector
        const layoutSelector = document.getElementById('layout-selector');
        if (layoutSelector) {
            layoutSelector.value = layout;
        }
        
        logger.info('Camera layout changed', { layout });
    }

    focusCamera(cameraId) {
        if (this.currentLayout === 'grid') {
            this.changeLayout('single');
        }
        
        // In a real implementation, this would switch to the specific camera
        logger.info('Camera focused', { cameraId });
    }

    async startRecording() {
        try {
            this.isRecording = true;
            
            // Update UI
            const startBtn = document.getElementById('start-recording-btn');
            const stopBtn = document.getElementById('stop-recording-btn');
            
            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-block';
            
            this.updateStatus();
            
            // Create recording entry
            const recording = {
                id: generateId('recording'),
                name: `Recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
                timestamp: new Date().toISOString(),
                duration: '00:00:00',
                cameras: this.cameraConfigs.filter(cam => cam.status === 'online').map(cam => cam.id),
                status: 'recording'
            };
            
            this.recordings.push(recording);
            await storageUtils.recordingsManager.save(this.recordings);
            
            this.showNotification('Recording started', 'success');
            logger.info('Recording started', recording);
            
        } catch (error) {
            logger.error('Error starting recording', null, error);
            this.showNotification('Failed to start recording', 'error');
        }
    }

    async stopRecording() {
        try {
            this.isRecording = false;
            
            // Update UI
            const startBtn = document.getElementById('start-recording-btn');
            const stopBtn = document.getElementById('stop-recording-btn');
            
            if (startBtn) startBtn.style.display = 'inline-block';
            if (stopBtn) stopBtn.style.display = 'none';
            
            this.updateStatus();
            
            // Update the current recording
            const currentRecording = this.recordings.find(r => r.status === 'recording');
            if (currentRecording) {
                currentRecording.status = 'completed';
                currentRecording.duration = '00:05:30'; // Mock duration
                await storageUtils.recordingsManager.save(this.recordings);
            }
            
            this.updateRecordingsList();
            this.showNotification('Recording stopped', 'success');
            logger.info('Recording stopped');
            
        } catch (error) {
            logger.error('Error stopping recording', null, error);
            this.showNotification('Failed to stop recording', 'error');
        }
    }

    takeSnapshot(cameraId) {
        try {
            const video = document.getElementById(`video-${cameraId}`);
            if (!video) return;
            
            // Create canvas to capture frame
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `snapshot_${cameraId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });
            
            this.showNotification('Snapshot captured', 'success');
            logger.info('Snapshot taken', { cameraId });
            
        } catch (error) {
            logger.error('Error taking snapshot', null, error);
            this.showNotification('Failed to capture snapshot', 'error');
        }
    }

    toggleFullscreen(cameraId) {
        try {
            const video = document.getElementById(`video-${cameraId}`);
            if (!video) return;
            
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                video.requestFullscreen();
            }
            
        } catch (error) {
            logger.error('Error toggling fullscreen', null, error);
        }
    }

    showIncidentModal() {
        const modal = document.getElementById('incident-modal');
        modal.style.display = 'block';
    }

    hideIncidentModal() {
        const modal = document.getElementById('incident-modal');
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('incident-form');
        if (form) {
            form.reset();
        }
    }

    async reportIncident() {
        try {
            const form = document.getElementById('incident-form');
            
            const incidentData = {
                id: generateId('incident'),
                type: document.getElementById('incident-type').value,
                description: document.getElementById('incident-description').value.trim(),
                location: document.getElementById('incident-location').value,
                severity: document.getElementById('incident-severity').value,
                policeRequired: document.getElementById('incident-police').checked,
                includeRecording: document.getElementById('incident-recording').checked,
                timestamp: new Date().toISOString(),
                status: 'reported'
            };

            // Validate required fields
            if (!incidentData.type || !incidentData.description) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Add to incidents
            this.incidents.push(incidentData);
            await storageUtils.incidentsManager.save(this.incidents);

            // Update display
            this.updateIncidentsList();

            // Hide modal
            this.hideIncidentModal();

            // Show success notification
            this.showNotification('Incident reported successfully', 'success');

            // If police notification required, show additional info
            if (incidentData.policeRequired) {
                this.showNotification('Police notification recommended for this incident', 'warning');
            }

            logger.info('Incident reported', incidentData);

        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'report-incident'
            });
            
            this.showNotification('Failed to report incident', 'error');
        }
    }

    downloadRecording(recordingId) {
        try {
            const recording = this.recordings.find(r => r.id === recordingId);
            if (!recording) return;

            // In a real implementation, this would download the actual recording file
            // For now, we'll create a mock download
            const content = `Recording: ${recording.name}\nDuration: ${recording.duration}\nTimestamp: ${recording.timestamp}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${recording.name}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Recording download started', 'success');
            logger.info('Recording download initiated', { recordingId });

        } catch (error) {
            logger.error('Error downloading recording', null, error);
            this.showNotification('Failed to download recording', 'error');
        }
    }

    viewIncident(incidentId) {
        try {
            const incident = this.incidents.find(i => i.id === incidentId);
            if (!incident) return;

            // Show incident details in a modal or alert
            const details = `
Incident Details:
Type: ${incident.type}
Description: ${incident.description}
Location: ${incident.location}
Severity: ${incident.severity}
Time: ${formatDate(incident.timestamp)}
Status: ${incident.status}
            `;

            alert(details);
            logger.info('Incident viewed', { incidentId });

        } catch (error) {
            logger.error('Error viewing incident', null, error);
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
    getCameras() {
        return this.cameraConfigs;
    }

    getRecordings() {
        return this.recordings;
    }

    getIncidents() {
        return this.incidents;
    }

    async exportData(format = 'json') {
        try {
            const data = {
                cameras: this.cameraConfigs,
                recordings: this.recordings,
                incidents: this.incidents,
                summary: {
                    totalCameras: this.cameraConfigs.length,
                    onlineCameras: this.cameraConfigs.filter(cam => cam.status === 'online').length,
                    totalRecordings: this.recordings.length,
                    totalIncidents: this.incidents.length,
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting security data', null, error);
            throw error;
        }
    }

    convertToCSV(data) {
        // Convert recordings to CSV
        const recordingHeaders = ['ID', 'Name', 'Timestamp', 'Duration', 'Status'];
        const recordingRows = data.recordings.map(r => [
            r.id, r.name, r.timestamp, r.duration, r.status
        ]);

        // Convert incidents to CSV
        const incidentHeaders = ['ID', 'Type', 'Description', 'Location', 'Severity', 'Timestamp'];
        const incidentRows = data.incidents.map(i => [
            i.id, i.type, i.description, i.location, i.severity, i.timestamp
        ]);

        const recordingsCSV = [recordingHeaders, ...recordingRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const incidentsCSV = [incidentHeaders, ...incidentRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return `Recordings:\n${recordingsCSV}\n\nIncidents:\n${incidentsCSV}`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.securityCameras = new SecurityCameras();
    });
} else {
    window.securityCameras = new SecurityCameras();
}

export default window.securityCameras; 