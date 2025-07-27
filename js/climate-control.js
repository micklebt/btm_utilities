/**
 * Climate Control Monitoring System
 * Handles temperature, humidity tracking, and HVAC controls
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, throttle } from './utils.js';

export class ClimateControl {
    constructor() {
        this.sensors = [];
        this.readings = [];
        this.alerts = [];
        this.settings = {
            temperature: {
                min: 65,
                max: 75,
                target: 70,
                unit: 'fahrenheit'
            },
            humidity: {
                min: 30,
                max: 60,
                target: 45,
                unit: 'percent'
            },
            hvac: {
                mode: 'auto', // auto, heat, cool, off
                fan: 'auto', // auto, on, off
                schedule: {
                    enabled: true,
                    periods: [
                        { start: '06:00', end: '22:00', temp: 70, mode: 'auto' },
                        { start: '22:00', end: '06:00', temp: 68, mode: 'heat' }
                    ]
                }
            }
        };
        
        this.sensorConfigs = [
            {
                id: 'sensor-1',
                name: 'Main Floor',
                location: 'Center of laundromat',
                type: 'temperature-humidity',
                status: 'online',
                position: { x: 0, y: 0 }
            },
            {
                id: 'sensor-2',
                name: 'Entrance Area',
                location: 'Near front door',
                type: 'temperature-humidity',
                status: 'online',
                position: { x: 1, y: 0 }
            },
            {
                id: 'sensor-3',
                name: 'Equipment Room',
                location: 'Behind washers',
                type: 'temperature-humidity',
                status: 'online',
                position: { x: 0, y: 1 }
            },
            {
                id: 'sensor-4',
                name: 'Storage Area',
                location: 'Back storage room',
                type: 'temperature-humidity',
                status: 'offline',
                position: { x: 1, y: 1 }
            }
        ];
        
        this.hvacUnits = [
            {
                id: 'hvac-1',
                name: 'Main HVAC Unit',
                type: 'heat-pump',
                status: 'online',
                mode: 'auto',
                fan: 'auto',
                efficiency: 85
            },
            {
                id: 'hvac-2',
                name: 'Dehumidifier',
                type: 'dehumidifier',
                status: 'online',
                mode: 'auto',
                fan: 'auto',
                efficiency: 90
            }
        ];
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Climate Control module');
            
            // Load existing data
            await this.loadData();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start monitoring
            this.startMonitoring();
            
            logger.info('Climate Control module initialized successfully');
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'high',
                context: 'climate-control-init'
            });
        }
    }

    async loadData() {
        try {
            const savedReadings = await storageUtils.readingsManager.load();
            const savedAlerts = await storageUtils.alertsManager.load();
            const savedSettings = await storageUtils.settingsManager.load();
            
            this.readings = savedReadings || [];
            this.alerts = savedAlerts || [];
            
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
            
            logger.info(`Loaded ${this.readings.length} readings and ${this.alerts.length} alerts`);
        } catch (error) {
            logger.error('Failed to load climate data', null, error);
            this.readings = [];
            this.alerts = [];
        }
    }

    initializeUI() {
        const container = document.getElementById('climate-control-container');
        if (!container) return;

        container.innerHTML = `
            <div class="climate-header">
                <h2>🌡️ Climate Control</h2>
                <div class="climate-controls">
                    <button type="button" id="hvac-auto-btn" class="btn btn-primary">
                        🔄 Auto Mode
                    </button>
                    <button type="button" id="hvac-heat-btn" class="btn btn-warning">
                        🔥 Heat
                    </button>
                    <button type="button" id="hvac-cool-btn" class="btn btn-info">
                        ❄️ Cool
                    </button>
                    <button type="button" id="hvac-off-btn" class="btn btn-secondary">
                        ⏹️ Off
                    </button>
                </div>
            </div>

            <div class="climate-overview">
                <div class="overview-card temperature">
                    <div class="card-header">
                        <h3>🌡️ Temperature</h3>
                        <span class="unit">°F</span>
                    </div>
                    <div class="card-value" id="current-temp">--</div>
                    <div class="card-range">
                        <span class="min">${this.settings.temperature.min}°</span>
                        <span class="target">${this.settings.temperature.target}°</span>
                        <span class="max">${this.settings.temperature.max}°</span>
                    </div>
                </div>
                
                <div class="overview-card humidity">
                    <div class="card-header">
                        <h3>💧 Humidity</h3>
                        <span class="unit">%</span>
                    </div>
                    <div class="card-value" id="current-humidity">--</div>
                    <div class="card-range">
                        <span class="min">${this.settings.humidity.min}%</span>
                        <span class="target">${this.settings.humidity.target}%</span>
                        <span class="max">${this.settings.humidity.max}%</span>
                    </div>
                </div>
                
                <div class="overview-card hvac-status">
                    <div class="card-header">
                        <h3>🏠 HVAC Status</h3>
                    </div>
                    <div class="card-value" id="hvac-mode">Auto</div>
                    <div class="card-details">
                        <span class="fan-status" id="fan-status">Auto</span>
                        <span class="efficiency" id="efficiency">85%</span>
                    </div>
                </div>
            </div>

            <div class="climate-grid">
                <div class="sensors-panel">
                    <h3>📡 Sensors</h3>
                    <div class="sensors-grid" id="sensors-grid">
                        <!-- Sensors will be populated here -->
                    </div>
                </div>
                
                <div class="hvac-panel">
                    <h3>🏠 HVAC Units</h3>
                    <div class="hvac-units" id="hvac-units">
                        <!-- HVAC units will be populated here -->
                    </div>
                </div>
            </div>

            <div class="climate-charts">
                <div class="chart-container">
                    <h3>📊 Temperature History</h3>
                    <canvas id="temp-chart" class="climate-chart"></canvas>
                </div>
                
                <div class="chart-container">
                    <h3>📊 Humidity History</h3>
                    <canvas id="humidity-chart" class="climate-chart"></canvas>
                </div>
            </div>

            <div class="climate-alerts">
                <h3>🚨 Alerts</h3>
                <div class="alerts-list" id="alerts-list">
                    <!-- Alerts will be populated here -->
                </div>
            </div>

            <!-- Settings Modal -->
            <div id="climate-settings-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⚙️ Climate Settings</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    
                    <form id="climate-settings-form" class="settings-form">
                        <div class="settings-section">
                            <h4>Temperature Settings</h4>
                            <div class="form-row">
                                <div class="form-section">
                                    <label for="temp-min">Minimum Temperature (°F)</label>
                                    <input type="number" id="temp-min" 
                                           value="${this.settings.temperature.min}" min="50" max="80">
                                </div>
                                <div class="form-section">
                                    <label for="temp-target">Target Temperature (°F)</label>
                                    <input type="number" id="temp-target" 
                                           value="${this.settings.temperature.target}" min="50" max="80">
                                </div>
                                <div class="form-section">
                                    <label for="temp-max">Maximum Temperature (°F)</label>
                                    <input type="number" id="temp-max" 
                                           value="${this.settings.temperature.max}" min="50" max="80">
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4>Humidity Settings</h4>
                            <div class="form-row">
                                <div class="form-section">
                                    <label for="humidity-min">Minimum Humidity (%)</label>
                                    <input type="number" id="humidity-min" 
                                           value="${this.settings.humidity.min}" min="20" max="80">
                                </div>
                                <div class="form-section">
                                    <label for="humidity-target">Target Humidity (%)</label>
                                    <input type="number" id="humidity-target" 
                                           value="${this.settings.humidity.target}" min="20" max="80">
                                </div>
                                <div class="form-section">
                                    <label for="humidity-max">Maximum Humidity (%)</label>
                                    <input type="number" id="humidity-max" 
                                           value="${this.settings.humidity.max}" min="20" max="80">
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4>HVAC Schedule</h4>
                            <div class="form-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="schedule-enabled" 
                                           ${this.settings.hvac.schedule.enabled ? 'checked' : ''}>
                                    Enable schedule
                                </label>
                            </div>
                            
                            <div class="schedule-periods" id="schedule-periods">
                                ${this.settings.hvac.schedule.periods.map((period, index) => `
                                    <div class="schedule-period">
                                        <div class="period-time">
                                            <input type="time" value="${period.start}" 
                                                   data-period="${index}" data-field="start">
                                            <span>to</span>
                                            <input type="time" value="${period.end}" 
                                                   data-period="${index}" data-field="end">
                                        </div>
                                        <div class="period-settings">
                                            <input type="number" value="${period.temp}" 
                                                   data-period="${index}" data-field="temp" 
                                                   placeholder="Temp" min="50" max="80">
                                            <select data-period="${index}" data-field="mode">
                                                <option value="auto" ${period.mode === 'auto' ? 'selected' : ''}>Auto</option>
                                                <option value="heat" ${period.mode === 'heat' ? 'selected' : ''}>Heat</option>
                                                <option value="cool" ${period.mode === 'cool' ? 'selected' : ''}>Cool</option>
                                            </select>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                💾 Save Settings
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-settings-btn">
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // HVAC control buttons
        const hvacButtons = {
            'hvac-auto-btn': 'auto',
            'hvac-heat-btn': 'heat',
            'hvac-cool-btn': 'cool',
            'hvac-off-btn': 'off'
        };

        Object.entries(hvacButtons).forEach(([btnId, mode]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.setHVACMode(mode));
            }
        });

        // Settings modal controls
        const settingsModal = document.getElementById('climate-settings-modal');
        const settingsModalClose = document.querySelector('#climate-settings-modal .modal-close');
        const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
        const settingsForm = document.getElementById('climate-settings-form');

        if (settingsModalClose) {
            settingsModalClose.addEventListener('click', () => this.hideSettingsModal());
        }

        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }

        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.hideSettingsModal();
                }
            });
        }

        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Settings button (if exists)
        const settingsBtn = document.getElementById('climate-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
    }

    startMonitoring() {
        // Initialize sensors and HVAC units
        this.updateSensorsDisplay();
        this.updateHVACDisplay();
        this.updateOverview();
        this.updateAlertsList();
        
        // Start periodic updates
        setInterval(() => {
            this.updateReadings();
        }, 30000); // Update every 30 seconds
        
        // Update charts every 5 minutes
        setInterval(() => {
            this.updateCharts();
        }, 300000);
    }

    updateSensorsDisplay() {
        const grid = document.getElementById('sensors-grid');
        if (!grid) return;

        grid.innerHTML = this.sensorConfigs.map(sensor => `
            <div class="sensor-card ${sensor.status}" data-sensor-id="${sensor.id}">
                <div class="sensor-header">
                    <h4>${sensor.name}</h4>
                    <span class="sensor-status ${sensor.status}">${sensor.status}</span>
                </div>
                <div class="sensor-location">${sensor.location}</div>
                <div class="sensor-readings">
                    <div class="reading-item">
                        <span class="reading-label">Temperature:</span>
                        <span class="reading-value" id="temp-${sensor.id}">--°F</span>
                    </div>
                    <div class="reading-item">
                        <span class="reading-label">Humidity:</span>
                        <span class="reading-value" id="humidity-${sensor.id}">--%</span>
                    </div>
                </div>
                <div class="sensor-actions">
                    <button type="button" class="btn btn-sm btn-primary" 
                            onclick="window.climateControl.calibrateSensor('${sensor.id}')">
                        🔧 Calibrate
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateHVACDisplay() {
        const container = document.getElementById('hvac-units');
        if (!container) return;

        container.innerHTML = this.hvacUnits.map(unit => `
            <div class="hvac-unit ${unit.status}" data-unit-id="${unit.id}">
                <div class="hvac-header">
                    <h4>${unit.name}</h4>
                    <span class="hvac-status ${unit.status}">${unit.status}</span>
                </div>
                <div class="hvac-type">${unit.type}</div>
                <div class="hvac-controls">
                    <div class="control-item">
                        <span class="control-label">Mode:</span>
                        <span class="control-value">${unit.mode}</span>
                    </div>
                    <div class="control-item">
                        <span class="control-label">Fan:</span>
                        <span class="control-value">${unit.fan}</span>
                    </div>
                    <div class="control-item">
                        <span class="control-label">Efficiency:</span>
                        <span class="control-value">${unit.efficiency}%</span>
                    </div>
                </div>
                <div class="hvac-actions">
                    <button type="button" class="btn btn-sm btn-secondary" 
                            onclick="window.climateControl.maintenanceAlert('${unit.id}')">
                        🔧 Maintenance
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateOverview() {
        // Get latest readings
        const latestReadings = this.getLatestReadings();
        
        if (latestReadings.temperature !== null) {
            const tempElement = document.getElementById('current-temp');
            if (tempElement) {
                tempElement.textContent = `${latestReadings.temperature}°`;
                tempElement.className = this.getTemperatureClass(latestReadings.temperature);
            }
        }
        
        if (latestReadings.humidity !== null) {
            const humidityElement = document.getElementById('current-humidity');
            if (humidityElement) {
                humidityElement.textContent = `${latestReadings.humidity}%`;
                humidityElement.className = this.getHumidityClass(latestReadings.humidity);
            }
        }
        
        // Update HVAC status
        const hvacModeElement = document.getElementById('hvac-mode');
        const fanStatusElement = document.getElementById('fan-status');
        const efficiencyElement = document.getElementById('efficiency');
        
        if (hvacModeElement) hvacModeElement.textContent = this.settings.hvac.mode;
        if (fanStatusElement) fanStatusElement.textContent = this.settings.hvac.fan;
        if (efficiencyElement) efficiencyElement.textContent = '85%';
    }

    updateReadings() {
        // Simulate sensor readings
        this.sensorConfigs.forEach(sensor => {
            if (sensor.status === 'online') {
                const reading = {
                    id: generateId('reading'),
                    sensorId: sensor.id,
                    temperature: this.generateTemperatureReading(),
                    humidity: this.generateHumidityReading(),
                    timestamp: new Date().toISOString()
                };
                
                this.readings.push(reading);
                
                // Update sensor display
                const tempElement = document.getElementById(`temp-${sensor.id}`);
                const humidityElement = document.getElementById(`humidity-${sensor.id}`);
                
                if (tempElement) tempElement.textContent = `${reading.temperature}°F`;
                if (humidityElement) humidityElement.textContent = `${reading.humidity}%`;
                
                // Check for alerts
                this.checkAlerts(reading);
            }
        });
        
        // Save readings (keep only last 1000)
        if (this.readings.length > 1000) {
            this.readings = this.readings.slice(-1000);
        }
        
        storageUtils.readingsManager.save(this.readings);
        
        // Update overview
        this.updateOverview();
    }

    generateTemperatureReading() {
        // Generate realistic temperature reading around target
        const target = this.settings.temperature.target;
        const variation = (Math.random() - 0.5) * 4; // ±2 degrees
        return Math.round((target + variation) * 10) / 10;
    }

    generateHumidityReading() {
        // Generate realistic humidity reading around target
        const target = this.settings.humidity.target;
        const variation = (Math.random() - 0.5) * 10; // ±5 percent
        return Math.round(Math.max(20, Math.min(80, target + variation)));
    }

    checkAlerts(reading) {
        const alerts = [];
        
        // Temperature alerts
        if (reading.temperature < this.settings.temperature.min) {
            alerts.push({
                type: 'temperature',
                severity: 'warning',
                message: `Temperature too low: ${reading.temperature}°F`
            });
        } else if (reading.temperature > this.settings.temperature.max) {
            alerts.push({
                type: 'temperature',
                severity: 'warning',
                message: `Temperature too high: ${reading.temperature}°F`
            });
        }
        
        // Humidity alerts
        if (reading.humidity < this.settings.humidity.min) {
            alerts.push({
                type: 'humidity',
                severity: 'info',
                message: `Humidity too low: ${reading.humidity}%`
            });
        } else if (reading.humidity > this.settings.humidity.max) {
            alerts.push({
                type: 'humidity',
                severity: 'warning',
                message: `Humidity too high: ${reading.humidity}%`
            });
        }
        
        // Create alert objects
        alerts.forEach(alert => {
            const alertObj = {
                id: generateId('alert'),
                ...alert,
                sensorId: reading.sensorId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            this.alerts.push(alertObj);
        });
        
        // Save alerts
        if (alerts.length > 0) {
            storageUtils.alertsManager.save(this.alerts);
            this.updateAlertsList();
        }
    }

    updateAlertsList() {
        const list = document.getElementById('alerts-list');
        if (!list) return;

        const recentAlerts = this.alerts
            .filter(alert => alert.status === 'active')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        if (recentAlerts.length === 0) {
            list.innerHTML = '<div class="no-alerts">No active alerts</div>';
        } else {
            list.innerHTML = recentAlerts.map(alert => `
                <div class="alert-item ${alert.severity}">
                    <div class="alert-icon">
                        ${this.getAlertIcon(alert.type)}
                    </div>
                    <div class="alert-content">
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${formatDate(alert.timestamp)}</div>
                    </div>
                    <div class="alert-actions">
                        <button type="button" class="btn btn-sm btn-secondary" 
                                onclick="window.climateControl.dismissAlert('${alert.id}')">
                            ✓
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    getAlertIcon(type) {
        const icons = {
            temperature: '🌡️',
            humidity: '💧',
            hvac: '🏠',
            sensor: '📡'
        };
        return icons[type] || '⚠️';
    }

    updateCharts() {
        // This would integrate with a charting library like Chart.js
        // For now, we'll just log that charts should be updated
        logger.info('Charts updated');
    }

    setHVACMode(mode) {
        try {
            this.settings.hvac.mode = mode;
            
            // Update HVAC units
            this.hvacUnits.forEach(unit => {
                if (unit.status === 'online') {
                    unit.mode = mode;
                }
            });
            
            // Update display
            this.updateHVACDisplay();
            this.updateOverview();
            
            // Save settings
            storageUtils.settingsManager.save(this.settings);
            
            this.showNotification(`HVAC mode set to ${mode}`, 'success');
            logger.info('HVAC mode changed', { mode });
            
        } catch (error) {
            logger.error('Error setting HVAC mode', null, error);
            this.showNotification('Failed to set HVAC mode', 'error');
        }
    }

    showSettingsModal() {
        const modal = document.getElementById('climate-settings-modal');
        modal.style.display = 'block';
    }

    hideSettingsModal() {
        const modal = document.getElementById('climate-settings-modal');
        modal.style.display = 'none';
    }

    async saveSettings() {
        try {
            // Get form values
            const newSettings = {
                temperature: {
                    min: parseInt(document.getElementById('temp-min').value),
                    max: parseInt(document.getElementById('temp-max').value),
                    target: parseInt(document.getElementById('temp-target').value),
                    unit: 'fahrenheit'
                },
                humidity: {
                    min: parseInt(document.getElementById('humidity-min').value),
                    max: parseInt(document.getElementById('humidity-max').value),
                    target: parseInt(document.getElementById('humidity-target').value),
                    unit: 'percent'
                },
                hvac: {
                    ...this.settings.hvac,
                    schedule: {
                        enabled: document.getElementById('schedule-enabled').checked,
                        periods: this.settings.hvac.schedule.periods
                    }
                }
            };

            // Validate settings
            if (newSettings.temperature.min >= newSettings.temperature.max ||
                newSettings.temperature.target < newSettings.temperature.min ||
                newSettings.temperature.target > newSettings.temperature.max) {
                this.showNotification('Invalid temperature settings', 'error');
                return;
            }

            if (newSettings.humidity.min >= newSettings.humidity.max ||
                newSettings.humidity.target < newSettings.humidity.min ||
                newSettings.humidity.target > newSettings.humidity.max) {
                this.showNotification('Invalid humidity settings', 'error');
                return;
            }

            // Update settings
            this.settings = newSettings;
            
            // Save to storage
            await storageUtils.settingsManager.save(this.settings);
            
            // Update display
            this.updateOverview();
            
            // Hide modal
            this.hideSettingsModal();
            
            this.showNotification('Settings saved successfully', 'success');
            logger.info('Climate settings updated', newSettings);
            
        } catch (error) {
            errorHandler.handleError(error, {
                type: 'client',
                severity: 'medium',
                context: 'save-climate-settings'
            });
            
            this.showNotification('Failed to save settings', 'error');
        }
    }

    getLatestReadings() {
        const latestReadings = this.readings
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, this.sensorConfigs.length);

        const avgTemp = latestReadings.length > 0 
            ? latestReadings.reduce((sum, r) => sum + r.temperature, 0) / latestReadings.length
            : null;
            
        const avgHumidity = latestReadings.length > 0
            ? latestReadings.reduce((sum, r) => sum + r.humidity, 0) / latestReadings.length
            : null;

        return {
            temperature: avgTemp ? Math.round(avgTemp * 10) / 10 : null,
            humidity: avgHumidity ? Math.round(avgHumidity) : null
        };
    }

    getTemperatureClass(temperature) {
        if (temperature < this.settings.temperature.min) return 'cold';
        if (temperature > this.settings.temperature.max) return 'hot';
        return 'normal';
    }

    getHumidityClass(humidity) {
        if (humidity < this.settings.humidity.min) return 'low';
        if (humidity > this.settings.humidity.max) return 'high';
        return 'normal';
    }

    calibrateSensor(sensorId) {
        try {
            this.showNotification(`Calibrating sensor ${sensorId}...`, 'info');
            
            // In a real implementation, this would send calibration commands to the sensor
            setTimeout(() => {
                this.showNotification(`Sensor ${sensorId} calibrated successfully`, 'success');
            }, 2000);
            
            logger.info('Sensor calibration initiated', { sensorId });
            
        } catch (error) {
            logger.error('Error calibrating sensor', null, error);
            this.showNotification('Failed to calibrate sensor', 'error');
        }
    }

    maintenanceAlert(unitId) {
        try {
            const unit = this.hvacUnits.find(u => u.id === unitId);
            if (!unit) return;

            this.showNotification(`Maintenance scheduled for ${unit.name}`, 'info');
            
            // Create maintenance alert
            const alert = {
                id: generateId('alert'),
                type: 'hvac',
                severity: 'info',
                message: `Maintenance scheduled for ${unit.name}`,
                unitId: unitId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            this.alerts.push(alert);
            storageUtils.alertsManager.save(this.alerts);
            this.updateAlertsList();
            
            logger.info('Maintenance alert created', { unitId, unitName: unit.name });
            
        } catch (error) {
            logger.error('Error creating maintenance alert', null, error);
        }
    }

    dismissAlert(alertId) {
        try {
            const alert = this.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.status = 'dismissed';
                storageUtils.alertsManager.save(this.alerts);
                this.updateAlertsList();
                
                logger.info('Alert dismissed', { alertId });
            }
        } catch (error) {
            logger.error('Error dismissing alert', null, error);
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
    getSettings() {
        return this.settings;
    }

    getReadings() {
        return this.readings;
    }

    getAlerts() {
        return this.alerts;
    }

    getSensors() {
        return this.sensorConfigs;
    }

    getHVACUnits() {
        return this.hvacUnits;
    }

    async exportData(format = 'json') {
        try {
            const data = {
                settings: this.settings,
                sensors: this.sensorConfigs,
                hvacUnits: this.hvacUnits,
                readings: this.readings.slice(-100), // Last 100 readings
                alerts: this.alerts,
                summary: {
                    totalSensors: this.sensorConfigs.length,
                    onlineSensors: this.sensorConfigs.filter(s => s.status === 'online').length,
                    totalReadings: this.readings.length,
                    activeAlerts: this.alerts.filter(a => a.status === 'active').length,
                    exportDate: new Date().toISOString()
                }
            };

            if (format === 'csv') {
                return this.convertToCSV(data);
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            logger.error('Error exporting climate data', null, error);
            throw error;
        }
    }

    convertToCSV(data) {
        // Convert readings to CSV
        const readingHeaders = ['Timestamp', 'Sensor ID', 'Temperature', 'Humidity'];
        const readingRows = data.readings.map(r => [
            r.timestamp,
            r.sensorId,
            r.temperature,
            r.humidity
        ]);

        // Convert alerts to CSV
        const alertHeaders = ['Timestamp', 'Type', 'Severity', 'Message', 'Status'];
        const alertRows = data.alerts.map(a => [
            a.timestamp,
            a.type,
            a.severity,
            a.message,
            a.status
        ]);

        const readingsCSV = [readingHeaders, ...readingRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const alertsCSV = [alertHeaders, ...alertRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return `Readings:\n${readingsCSV}\n\nAlerts:\n${alertsCSV}`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.climateControl = new ClimateControl();
    });
} else {
    window.climateControl = new ClimateControl();
}

export default window.climateControl; 